# Tablemate — Architecture

> **Stack snapshot:** Next.js 15 · React 19 · TypeScript 5 · Supabase · Tailwind CSS v4 · Stripe · OpenAI

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Tech Stack](#tech-stack)
3. [File Structure](#file-structure)
4. [Data Architecture](#data-architecture)
5. [Data Flow Diagrams](#data-flow-diagrams)
6. [Authentication](#authentication)
7. [API Design](#api-design)
8. [Payments (Stripe)](#payments-stripe)
9. [AI Seating Feature](#ai-seating-feature)
10. [PDF Export](#pdf-export)
11. [Key Design Decisions](#key-design-decisions)
12. [Deployment](#deployment)

---

## System Overview

Tablemate is a **full-stack Next.js application** that helps couples manage their wedding guest list, collect RSVPs, and build a seating chart. It is deployed as a serverless application on Vercel with Supabase as the backend-as-a-service.

```
┌─────────────────────────────────────────────────────────────┐
│                          Browser                             │
│          Next.js App (React 19, Tailwind CSS v4)            │
└──────────────┬──────────────────────────────────┬───────────┘
               │ RSC + Client Components           │ API Routes
               ▼                                  ▼
┌──────────────────────┐              ┌────────────────────────┐
│   Supabase (BaaS)    │              │  External Services     │
│  • PostgreSQL DB     │◄─────────────│  • Stripe (payments)   │
│  • Auth (OAuth/email)│              │  • OpenAI (AI seating) │
│  • Row Level Security│              │  • Email (RSVP sends)  │
│  • Realtime (future) │              └────────────────────────┘
└──────────────────────┘

Hosting: Vercel (Next.js serverless + edge functions)
```

---

## Tech Stack

### Frontend
| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| Framework | Next.js | 15.x | App Router, RSC, API routes, Vercel-native |
| UI Library | React | 19.x | Latest concurrent features |
| Language | TypeScript | 5.x | Type safety across full stack |
| Styling | Tailwind CSS | v4 | Utility-first, no runtime CSS-in-JS overhead |
| Icons | Lucide React | 1.x | Consistent SVG icon library |

### Backend / Services
| Layer | Technology | Why |
|-------|-----------|-----|
| Database | Supabase (PostgreSQL) | Managed DB + auth + realtime in one; generous free tier |
| Auth | Supabase Auth | OAuth + email/password; built-in session management |
| Payments | Stripe | Industry standard; excellent webhooks + Checkout hosted UI |
| AI | OpenAI (GPT-4o-mini) | Cost-effective for structured seating suggestion tasks |
| PDF Generation | jsPDF + jspdf-autotable | Client-side PDF; no server cost per export |
| QR Codes | qrcode | Lightweight; generates RSVP link QR codes |

### Infrastructure
| Component | Service |
|-----------|---------|
| Hosting | Vercel (automatic deployments from main branch) |
| Database | Supabase Cloud (managed PostgreSQL) |
| CDN / Static Assets | Vercel Edge Network |
| Environment Secrets | Vercel Environment Variables |

---

## File Structure

```
src/
├── app/                              # Next.js App Router root
│   │
│   ├── layout.tsx                   # Root layout
│   │   • Sets HTML lang, viewport, fonts
│   │   • Wraps all pages (no global providers needed — Supabase uses server-side)
│   │
│   ├── page.tsx                     # Landing page (/)
│   │   • Marketing content, hero, features, pricing teaser
│   │   • Static — no auth required, fully SSR for SEO
│   │
│   ├── globals.css                  # Global CSS
│   │   • Tailwind v4 @import
│   │   • CSS custom properties for brand colors
│   │
│   ├── login/ & signup/             # Auth pages
│   │   • Client components with Supabase signIn/signUp calls
│   │   • Redirect to /app on success
│   │
│   ├── pricing/page.tsx             # Pricing page
│   │   • Static tiers; Stripe Checkout links
│   │
│   ├── demo/page.tsx                # Public demo (unauthenticated)
│   │   • Shows interactive seating chart with mock data
│   │   • No DB reads — all state is local
│   │
│   ├── app/                         # Authenticated section (protected)
│   │   ├── page.tsx                 # Dashboard — list of couple's weddings
│   │   │   • Server component: fetches weddings for current user via Supabase server client
│   │   │
│   │   ├── new/page.tsx             # Create wedding form
│   │   │   • Client component: form submission → inserts into `weddings` table
│   │   │
│   │   ├── upgrade/page.tsx         # Upgrade to premium
│   │   │   • Redirects to Stripe Checkout session via /api/stripe/checkout
│   │   │
│   │   └── wedding/[id]/            # Per-wedding planner (dynamic route)
│   │       ├── page.tsx             # Server component
│   │       │   • Fetches wedding + guests + tables from DB
│   │       │   • Passes data as props to PlannerClient
│   │       │
│   │       ├── PlannerClient.tsx    # Root client component for planner
│   │       │   • Holds shared state: guests[], tables[], selectedGuest
│   │       │   • Renders ChartCanvas, GuestPanel, RulesPanel, ExportPanel
│   │       │
│   │       ├── ChartCanvas.tsx      # Drag-and-drop seating chart
│   │       │   • Canvas-based rendering of tables and seats
│   │       │   • Drag guest → seat assignment (updates DB via /api/guests)
│   │       │
│   │       ├── GuestPanel.tsx       # Guest list sidebar
│   │       │   • Add/edit/remove guests
│   │       │   • Shows RSVP status, meal choice, dietary tags
│   │       │   • "Unassigned" guest tray for drag-and-drop
│   │       │
│   │       ├── RulesPanel.tsx       # Seating rules
│   │       │   • Keep-apart rules (e.g., ex-couples)
│   │       │   • Keep-together rules (e.g., family groups)
│   │       │   • Used as input to AI seating API
│   │       │
│   │       ├── ExportPanel.tsx      # Export controls
│   │       │   • Calls lib/exportPDF.ts with current chart data
│   │       │
│   │       ├── WishingWall.tsx      # Guest messages display
│   │       ├── MobilePlanner.tsx    # Mobile-optimized planner layout
│   │       └── MobileWishes.tsx     # Mobile wishing wall
│   │
│   ├── api/                         # Next.js Route Handlers (serverless functions)
│   │   ├── ai/seat/route.ts         # POST /api/ai/seat
│   │   │   • Accepts: guests[], tables[], rules[]
│   │   │   • Sends structured prompt to OpenAI
│   │   │   • Returns: suggested seat_assignments[]
│   │   │
│   │   ├── guests/route.ts          # /api/guests
│   │   │   • GET: fetch guests for a wedding
│   │   │   • POST: add guest
│   │   │   • PATCH: update guest (seat assignment, RSVP status, etc.)
│   │   │   • DELETE: remove guest
│   │   │
│   │   ├── rsvp/send/route.ts       # POST /api/rsvp/send
│   │   │   • Generates unique RSVP token
│   │   │   • Sends email with RSVP link to guest
│   │   │
│   │   └── stripe/
│   │       ├── checkout/route.ts    # POST /api/stripe/checkout
│   │       │   • Creates Stripe Checkout Session
│   │       │   • Returns {url} for client redirect
│   │       │
│   │       └── webhook/route.ts     # POST /api/stripe/webhook
│   │           • Verifies Stripe signature
│   │           • On checkout.session.completed: upgrades user to premium in DB
│   │
│   ├── auth/
│   │   ├── callback/route.ts        # Supabase OAuth callback handler
│   │   └── signout/route.ts         # Clears session, redirects to /
│   │
│   ├── guest/[shareCode]/page.tsx   # Public guest view
│   │   • Given a shareCode, shows the couple's event info
│   │   • Allows RSVP submission (no auth required)
│   │
│   └── rsvp/[token]/page.tsx        # RSVP form
│       • Token validates against rsvp_tokens table
│       • Guest fills in: attending, meal choice, dietary needs, +1
│       • Submits → updates guest row, marks token as used
│
└── lib/
    ├── types.ts                     # Shared TypeScript types
    │   • Wedding, Guest, Table, SeatAssignment, RSVPToken, etc.
    │
    ├── stripe.ts                    # Stripe client singleton
    │   • Initialized with STRIPE_SECRET_KEY
    │
    ├── exportPDF.ts                 # PDF generation logic
    │   • Uses jsPDF + jspdf-autotable
    │   • Renders table-by-table guest layout
    │
    └── supabase/
        ├── client.ts                # Browser Supabase client (singleton)
        │   • Used in Client Components
        │   • createBrowserClient from @supabase/ssr
        │
        └── server.ts                # Server Supabase client
            • Used in Server Components and Route Handlers
            • createServerClient from @supabase/ssr (reads cookies)
```

---

## Data Architecture

### Core Tables

```sql
-- A wedding event
weddings (
  id          uuid PRIMARY KEY,
  user_id     uuid REFERENCES auth.users,  -- owner
  name        text,                         -- "Sarah & James's Wedding"
  date        date,
  guest_limit int,                          -- 75 free, unlimited premium
  is_premium  boolean DEFAULT false,
  created_at  timestamptz
)

-- Guests invited to a wedding
guests (
  id              uuid PRIMARY KEY,
  wedding_id      uuid REFERENCES weddings,
  name            text NOT NULL,
  email           text,
  rsvp_status     text,  -- 'pending' | 'attending' | 'declined'
  meal_choice     text,  -- 'chicken' | 'fish' | 'vegetarian' | etc.
  dietary_tags    text[], -- ['vegan', 'gluten-free', 'nut-allergy']
  plus_one_name   text,
  group_tag       text,  -- 'Bride Family' | 'Groom College Friends' | etc.
  created_at      timestamptz
)

-- Tables in the seating chart
tables (
  id          uuid PRIMARY KEY,
  wedding_id  uuid REFERENCES weddings,
  name        text,      -- "Table 1" | "Head Table" | "Kids Table"
  capacity    int,
  shape       text,      -- 'round' | 'rectangular' | 'square'
  position_x  float,     -- Canvas X coordinate
  position_y  float,     -- Canvas Y coordinate
  created_at  timestamptz
)

-- Guest-to-seat assignments
seat_assignments (
  id          uuid PRIMARY KEY,
  wedding_id  uuid REFERENCES weddings,
  guest_id    uuid REFERENCES guests,
  table_id    uuid REFERENCES tables,
  seat_number int,
  created_at  timestamptz,
  UNIQUE (guest_id, wedding_id)  -- a guest can only be assigned once
)

-- Seating rules (keep-apart / keep-together)
seating_rules (
  id          uuid PRIMARY KEY,
  wedding_id  uuid REFERENCES weddings,
  rule_type   text,  -- 'apart' | 'together'
  guest_ids   uuid[],
  note        text,
  created_at  timestamptz
)

-- RSVP email tokens
rsvp_tokens (
  id          uuid PRIMARY KEY,
  guest_id    uuid REFERENCES guests,
  wedding_id  uuid REFERENCES weddings,
  token       text UNIQUE,
  used        boolean DEFAULT false,
  expires_at  timestamptz,
  created_at  timestamptz
)

-- Public share codes for guest-facing views
share_codes (
  id          uuid PRIMARY KEY,
  wedding_id  uuid REFERENCES weddings,
  code        text UNIQUE,
  created_at  timestamptz
)
```

### Row Level Security Policies
Every table has RLS enabled. The key pattern:

```sql
-- Example for 'guests' table
CREATE POLICY "Users can manage their own wedding guests"
ON guests FOR ALL
USING (
  wedding_id IN (
    SELECT id FROM weddings WHERE user_id = auth.uid()
  )
);
```

Public/unauthenticated reads (RSVP page, share links) use the `anon` key with specific read-only policies on `share_codes` and `rsvp_tokens`.

---

## Data Flow Diagrams

### RSVP Flow

```
Couple                    Tablemate                     Guest
  │                           │                           │
  │── Send RSVP invite ───────▶│                           │
  │                           │── Generate token ─────────▶│
  │                           │── Send email ──────────────▶│
  │                           │                           │
  │                           │◀── Guest opens /rsvp/[token]│
  │                           │◀── Guest submits form ─────│
  │                           │   (attending, meal, +1)   │
  │                           │── Update guest row ───────▶│ (DB)
  │                           │── Mark token used ────────▶│ (DB)
  │◀── In-app notification ───│                           │
  │    (RSVP received)        │── Auto-add to canvas ─────▶│ (state)
```

### AI Seating Flow

```
PlannerClient
  │
  │── Click "AI Suggest" ──────────────────────────────────▶ /api/ai/seat
  │                                                         │
  │     Sends: { guests[], tables[], rules[], preferences } │
  │                                                         │── Build structured prompt
  │                                                         │── Call OpenAI gpt-4o-mini
  │                                                         │◀─ JSON response: assignments[]
  │                                                         │── Validate response structure
  │◀── Return: seat_assignments[] ─────────────────────────│
  │
  │── Apply to canvas (optimistic update) ─────────────────▶ /api/guests (PATCH each)
  │── Show "undo" option for 10 seconds
```

### Stripe Payment Flow

```
User                    Tablemate                      Stripe
  │                         │                            │
  │── Click "Upgrade" ──────▶│                            │
  │                         │── POST /api/stripe/checkout │
  │                         │── createCheckoutSession() ─▶│
  │                         │◀── {url: checkout.stripe.com/...}
  │◀── Redirect to Stripe ──│                            │
  │                         │                            │
  │── Complete payment ─────────────────────────────────▶│
  │◀── Redirect to /app/upgrade?success=true ───────────│
  │                         │◀── Webhook: checkout.session.completed
  │                         │── Update weddings: is_premium = true
```

---

## Authentication

Tablemate uses **Supabase Auth** with the `@supabase/ssr` package for session management in Next.js.

### Session Handling
- Sessions are stored in cookies (not localStorage) — required for SSR/RSC
- `lib/supabase/server.ts` creates a server client that reads cookies from the request
- `lib/supabase/client.ts` creates a browser client for client components
- The `auth/callback/route.ts` handles the OAuth code exchange

### Protected Routes
Routes under `/app/` check for an active session in the Server Component:
```typescript
// In a server component
const supabase = createServerClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
```

### OAuth Providers
Currently configured: Google OAuth via Supabase dashboard. Email/password also supported.

---

## API Design

All API routes are Next.js Route Handlers (`route.ts`) under `src/app/api/`.

### Conventions
- **Auth check first:** Every protected route validates the user session before any DB operation
- **Use server Supabase client:** Route handlers use `createServerClient()` for RLS enforcement
- **Return shape:** `{ data, error }` pattern matching Supabase's convention
- **HTTP status codes:** 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 500 Server Error

### Example route structure
```typescript
// src/app/api/guests/route.ts
export async function POST(request: Request) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  // validate body...

  const { data, error } = await supabase
    .from('guests')
    .insert({ ...body, wedding_id: body.wedding_id })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data }, { status: 201 })
}
```

---

## Payments (Stripe)

### Flow
1. Client calls `POST /api/stripe/checkout` with `{ priceId, weddingId }`
2. Server creates a Stripe Checkout Session with success/cancel URLs
3. Client is redirected to hosted Stripe Checkout
4. After payment, Stripe sends a `checkout.session.completed` webhook
5. Webhook handler verifies signature, updates `weddings.is_premium = true`

### Webhook Security
The webhook route uses `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET` to verify the request is genuinely from Stripe.

### Feature Gating
Premium features are gated by checking `wedding.is_premium` in both:
- **Server components:** Show/hide upgrade prompts
- **API routes:** Enforce limits (e.g., guest count > 75 requires premium)

---

## AI Seating Feature

`/api/ai/seat` accepts the full wedding context and returns a suggested seating arrangement.

### Prompt Design
The prompt sends:
- Guest list with meal choices, dietary tags, group affiliations
- Table list with names and capacities
- Seating rules (apart/together)
- Optional preferences ("keep families on the same side")

The model returns a structured JSON array of `{ guest_id, table_id, seat_number }`.

### Cost Control
- Model: `gpt-4o-mini` (~$0.00015/1K input tokens) — a 200-guest wedding costs ~$0.01
- Rate limiting: max N suggestions per wedding per day (stored in DB)
- Prompt is compressed: only IDs and relevant fields are sent, not full guest objects

---

## PDF Export

`lib/exportPDF.ts` uses **jsPDF** (client-side) to generate seating chart PDFs.

### Current output
- One page per table layout
- Guest names, seat numbers, meal choices
- Table name header

### Limitations & planned improvements
- Not print-production-quality (rasterized at screen resolution)
- No designer templates (planned for Q3 2025 — see ROADMAP.md)
- Future: server-side rendering with `@react-pdf/renderer` for high-fidelity output

---

## Key Design Decisions

### 1. Next.js App Router (not Pages Router)
**Decision:** Use the App Router introduced in Next.js 13+.
**Why:** React Server Components eliminate unnecessary client-side data fetching. The planner page (`/app/wedding/[id]`) loads all data server-side, so the canvas renders with full data on first paint (no loading spinners for the main content). This also improves SEO for public pages.

### 2. Supabase over a custom backend
**Decision:** Use Supabase as the backend rather than building a separate Express/Fastify API.
**Why:** Supabase provides auth, PostgreSQL, Row Level Security, and (in future) Realtime out of the box. For a team building a consumer app, the time savings are enormous. RLS means security is enforced at the database level — even if an API route has a bug, RLS prevents cross-user data leaks.

### 3. Client-side PDF generation (jsPDF)
**Decision:** Generate PDFs in the browser, not on the server.
**Why:** Avoids serverless function cold starts and memory limits for PDF generation. The tradeoff is lower print quality. This is acceptable for the current beta but will be revisited for designer template exports.

### 4. `@supabase/ssr` for session management
**Decision:** Store sessions in cookies, use `@supabase/ssr` library.
**Why:** Next.js App Router Server Components cannot access browser localStorage. Cookie-based sessions work in both RSC and client components, and `@supabase/ssr` handles the complexity of cookie synchronization between server and client contexts.

### 5. Stripe Checkout (hosted) over custom payment form
**Decision:** Use Stripe's hosted Checkout page rather than embedding a custom card form with Stripe Elements.
**Why:** PCI compliance, faster implementation, Stripe's built-in localization and fraud detection. The UX tradeoff (leaving the site briefly) is acceptable for a one-time upgrade event.

### 6. AI seating as API route, not client-side
**Decision:** OpenAI calls happen server-side in an API route.
**Why:** Keeps the OpenAI API key secret. Client-side AI calls would expose the key. The server route also allows rate limiting and logging.

---

## Deployment

### Vercel (Production)
- Automatic deployment from `main` branch
- Preview deployments for every pull request
- Environment variables set in Vercel dashboard (never committed to git)

### Environment Branches
| Branch | Environment | URL |
|--------|------------|-----|
| `main` | Production | tablemate-beta.vercel.app |
| `develop` | Staging | tablemate-staging.vercel.app (if configured) |
| PR branches | Preview | tablemate-git-[branch].vercel.app |

### Build Process
```
git push → Vercel detects push → npm install → next build → deploy
```

The `next build` step runs TypeScript compilation — any type errors fail the deployment, acting as a final safety check.

---

*For feature roadmap: see [ROADMAP.md](../ROADMAP.md)*
*For local dev setup: see [CONTRIBUTING.md](../CONTRIBUTING.md)*
