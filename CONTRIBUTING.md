# Contributing to Tablemate

Welcome! We're glad you're here. This guide gets you from zero to a running local dev environment as fast as possible.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Setup](#local-setup)
3. [Environment Variables](#environment-variables)
4. [Running the Dev Server](#running-the-dev-server)
5. [Project Structure](#project-structure)
6. [Database Setup (Supabase)](#database-setup-supabase)
7. [Stripe Setup (Payments)](#stripe-setup-payments)
8. [AI Features (OpenAI)](#ai-features-openai)
9. [Code Style & Conventions](#code-style--conventions)
10. [Making a Pull Request](#making-a-pull-request)
11. [Useful Scripts](#useful-scripts)

---

## Prerequisites

Make sure you have the following installed:

| Tool | Version | Notes |
|------|---------|-------|
| **Node.js** | 20.x LTS or higher | Use [nvm](https://github.com/nvm-sh/nvm) to manage versions |
| **npm** | 10.x+ | Comes with Node |
| **Git** | Latest | — |

Optional but recommended:
- **Supabase CLI** — for local database development (`npm install -g supabase`)
- **Stripe CLI** — for local webhook testing (`brew install stripe/stripe-cli/stripe` or see [docs](https://stripe.com/docs/stripe-cli))

---

## Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/tablemate.git
cd tablemate

# 2. Install dependencies
npm install

# 3. Copy the environment template
cp .env.example .env.local
# Then fill in your values — see "Environment Variables" section below

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the Tablemate landing page.

---

## Environment Variables

Create a `.env.local` file in the project root. **Never commit this file.** (It's already in `.gitignore`.)

```env
# ─── Supabase ───────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ─── Stripe ─────────────────────────────────────────────────
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ─── OpenAI (AI Seating Feature) ────────────────────────────
OPENAI_API_KEY=sk-...

# ─── App ────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Where to get these values

**Supabase:**
1. Go to [supabase.com](https://supabase.com) → New Project
2. Project Settings → API → copy `URL` and `anon public` key
3. For `SERVICE_ROLE_KEY`: same page → `service_role` key (keep secret!)

**Stripe:**
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Developers → API Keys → copy publishable + secret keys (use test mode keys locally)
3. For webhook secret: see [Stripe Setup](#stripe-setup-payments) below

**OpenAI:**
1. Go to [platform.openai.com](https://platform.openai.com)
2. API Keys → Create new secret key

---

## Running the Dev Server

```bash
npm run dev        # Start Next.js development server (http://localhost:3000)
npm run build      # Production build (checks for type errors)
npm run start      # Run the production build locally
npm run lint       # Run ESLint
```

The dev server uses Next.js Fast Refresh — your changes appear instantly in the browser without losing component state.

---

## Project Structure

```
tablemate/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # Landing page (/)
│   │   ├── layout.tsx                # Root layout, fonts, metadata
│   │   ├── globals.css               # Global styles (Tailwind base)
│   │   │
│   │   ├── login/page.tsx            # Login page
│   │   ├── signup/page.tsx           # Signup page
│   │   ├── pricing/page.tsx          # Pricing tiers
│   │   ├── demo/page.tsx             # Public demo (no auth)
│   │   │
│   │   ├── app/                      # Authenticated app shell
│   │   │   ├── page.tsx              # Dashboard — list of weddings
│   │   │   ├── new/page.tsx          # Create new wedding
│   │   │   ├── demo/page.tsx         # In-app demo mode
│   │   │   ├── upgrade/page.tsx      # Upgrade to premium
│   │   │   └── wedding/[id]/         # Per-wedding planner
│   │   │       ├── page.tsx          # Server component — loads wedding data
│   │   │       ├── PlannerClient.tsx # Main planner UI (client component)
│   │   │       ├── ChartCanvas.tsx   # Drag-and-drop seating chart
│   │   │       ├── GuestPanel.tsx    # Guest list sidebar
│   │   │       ├── RulesPanel.tsx    # Seating rules (keep apart/together)
│   │   │       ├── ExportPanel.tsx   # PDF export controls
│   │   │       ├── WishingWall.tsx   # Guest message wall
│   │   │       ├── MobilePlanner.tsx # Mobile-optimized planner view
│   │   │       └── MobileWishes.tsx  # Mobile wishing wall
│   │   │
│   │   ├── api/                      # API Routes (Next.js Route Handlers)
│   │   │   ├── ai/seat/route.ts      # POST — AI seating suggestion
│   │   │   ├── guests/route.ts       # GET/POST/PATCH/DELETE — guest CRUD
│   │   │   ├── rsvp/send/route.ts    # POST — send RSVP email
│   │   │   └── stripe/
│   │   │       ├── checkout/route.ts # POST — create Stripe checkout session
│   │   │       └── webhook/route.ts  # POST — handle Stripe events
│   │   │
│   │   ├── auth/
│   │   │   ├── callback/route.ts     # Supabase OAuth callback
│   │   │   └── signout/route.ts      # Sign out handler
│   │   │
│   │   ├── guest/[shareCode]/page.tsx # Public guest RSVP view
│   │   ├── rsvp/[token]/page.tsx      # RSVP form page
│   │   ├── privacy/page.tsx
│   │   └── terms/page.tsx
│   │
│   └── lib/
│       ├── types.ts                   # Shared TypeScript interfaces
│       ├── stripe.ts                  # Stripe client initialization
│       ├── exportPDF.ts               # jsPDF export logic
│       └── supabase/
│           ├── client.ts              # Browser Supabase client
│           └── server.ts              # Server-side Supabase client (SSR)
│
├── public/                            # Static assets
├── docs/                              # Project documentation
│   └── ARCHITECTURE.md
├── ROADMAP.md
├── CONTRIBUTING.md
├── GROWTH_RESEARCH.md
├── package.json
├── tailwind.config.ts (if present)
├── tsconfig.json
└── next.config.ts (if present)
```

---

## Database Setup (Supabase)

Tablemate uses **Supabase** as its backend (PostgreSQL + Auth + Realtime).

### Option A: Use the hosted Supabase project (recommended for contributors)
Ask a maintainer for access to the development Supabase project, or create your own free project at [supabase.com](https://supabase.com).

### Option B: Run Supabase locally
```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase (requires Docker)
supabase start

# Output will include your local URL and anon key — use these in .env.local
```

### Core Database Tables

| Table | Purpose |
|-------|---------|
| `weddings` | One row per wedding event (name, date, owner user_id) |
| `guests` | Guests per wedding (name, email, rsvp_status, meal_choice, dietary_tags) |
| `tables` | Table configurations per wedding (name, capacity, position on canvas) |
| `seat_assignments` | Maps guests to table seats |
| `seating_rules` | Keep-apart / keep-together rules per wedding |
| `rsvp_tokens` | Unique tokens for RSVP email links |
| `share_codes` | Public share codes for guest-facing views |

> **Note:** Full migration SQL will be in `supabase/migrations/` (coming soon). For now, ask a maintainer for the schema dump.

### Row Level Security
All tables use RLS. A user can only read/write their own wedding data. The `service_role_key` bypasses RLS and is used only in server-side API routes.

---

## Stripe Setup (Payments)

Tablemate uses **Stripe Checkout** for premium upgrades.

### Local webhook testing with Stripe CLI

```bash
# Install Stripe CLI (macOS)
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy the webhook signing secret output and add to .env.local:
# STRIPE_WEBHOOK_SECRET=whsec_...
```

### Test card numbers
Use Stripe's test cards for local payment testing:
- **Success:** `4242 4242 4242 4242` (any future expiry, any CVC)
- **Declined:** `4000 0000 0000 0002`

---

## AI Features (OpenAI)

The `/api/ai/seat` route calls the OpenAI API to generate seating suggestions.

- Model: `gpt-4o-mini` (fast and cost-effective for this use case)
- **Rate limiting:** Each user gets a limited number of AI suggestions per wedding (enforced in the API route)
- If you don't have an OpenAI key, the AI seating button will fail gracefully — all other features work normally

---

## Code Style & Conventions

### TypeScript
- Strict mode is enabled. Avoid `any` — use proper types from `lib/types.ts`
- Prefer `interface` over `type` for object shapes
- Server components are the default; add `"use client"` only when needed (event handlers, hooks, browser APIs)

### React / Next.js
- Use the **App Router** (not Pages Router)
- Data fetching in Server Components when possible (no loading waterfalls)
- Client components live alongside their server parent, named `*Client.tsx`

### Styling
- **Tailwind CSS v4** for all styling — no CSS modules, no inline styles
- Follow existing component patterns for spacing, colors, and responsiveness
- Dark mode support planned — avoid hardcoded light-only colors

### File naming
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Route handlers: `route.ts` (Next.js convention)

### Commits
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add dietary tagging to guest panel
fix: correct PDF export page margin
docs: update architecture diagram
chore: bump supabase-js to 2.105
refactor: decompose PlannerClient into smaller components
```

---

## Making a Pull Request

1. **Fork** the repo and create a branch: `git checkout -b feat/your-feature-name`
2. Make your changes — keep PRs focused on one thing
3. Run `npm run lint` and fix any issues
4. Run `npm run build` — ensure there are no TypeScript errors
5. Write a clear PR description: what changed, why, and how to test it
6. Request review from a maintainer

### PR Checklist
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds with no errors
- [ ] No `.env.local` or secret keys committed
- [ ] New features have been tested locally end-to-end
- [ ] UI changes look correct on mobile (375px) and desktop (1280px)

---

## Useful Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Run ESLint

# Supabase (if using CLI)
supabase start       # Start local Supabase
supabase stop        # Stop local Supabase
supabase db reset    # Reset local DB to latest migrations

# Stripe (if using CLI)
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## Getting Help

- Open an issue for bugs or feature requests
- Check `ROADMAP.md` for upcoming features before building something new
- Check `docs/ARCHITECTURE.md` for system design context

Thanks for contributing to Tablemate! 🎉
