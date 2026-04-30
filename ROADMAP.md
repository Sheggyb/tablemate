# Tablemate Roadmap

> **Last updated:** May 2026 | **Live at:** tablemate-beta.vercel.app

---

## 🌟 Vision Statement

**Tablemate is the all-in-one wedding planning tool that makes guest logistics joyful, not stressful.**

We believe every couple deserves a beautifully simple way to collect RSVPs, manage their guest list, and build a perfect seating arrangement — without spreadsheets, without chaos, and without needing to juggle five different apps. Tablemate unifies the entire guest experience from "save the date" to "you may be seated," putting couples in control and delighting everyone they invite.

Our north star: **The wedding seating tool couples actually love using.**

---

## ✅ Q2 2025 — What's Already Built (Beta Foundation)

These features form the current working product at `tablemate-beta.vercel.app`:

| Feature | Status | Notes |
|---------|--------|-------|
| **User auth** (sign up / login / sign out) | ✅ Live | Supabase Auth with OAuth |
| **Wedding creation flow** | ✅ Live | `/app/new` — name, date, guest count |
| **Guest list management** | ✅ Live | `GuestPanel.tsx` — add, edit, remove guests |
| **Drag-and-drop seating chart** | ✅ Live | `ChartCanvas.tsx` — visual table placement |
| **RSVP page + email send** | ✅ Live | `/rsvp/[token]` + `/api/rsvp/send` |
| **Guest share page** | ✅ Live | `/guest/[shareCode]` — public RSVP view |
| **PDF export** | ✅ Live | `ExportPanel.tsx` + `lib/exportPDF.ts` (jsPDF) |
| **AI seating suggestions** | ✅ Live (beta) | `/api/ai/seat` — GPT-backed seating logic |
| **Seating rules panel** | ✅ Live | `RulesPanel.tsx` — keep apart / keep together |
| **Wishing wall** | ✅ Live | `WishingWell.tsx` — guest messages |
| **Mobile planner view** | ✅ Live | `MobilePlanner.tsx` — responsive layout |
| **Stripe payments** | ✅ Live | Checkout + webhook for premium upgrades |
| **Pricing page** | ✅ Live | `/pricing` — tiered plans |
| **Demo mode** | ✅ Live | `/demo` + `/app/demo` — unauthenticated preview |
| **Privacy & Terms pages** | ✅ Live | `/privacy`, `/terms` |

---

## 🚀 Q3 2025 Roadmap — 10 Features (Prioritized by Impact/Effort)

### Priority Matrix

| # | Feature | Impact | Effort | Target |
|---|---------|--------|--------|--------|
| 1 | Unified RSVP → Seating zero-re-entry flow | 🔴 Very High | Medium | Jul 2025 |
| 2 | Shareable view-only venue link | 🔴 Very High | Low | Jul 2025 |
| 3 | Dietary & accessibility tagging | 🔴 High | Medium | Jul 2025 |
| 4 | Homepage copy rewrite + social proof | 🔴 High | Low | Jul 2025 |
| 5 | Guest group / family tagging + color coding | 🟡 High | Medium | Aug 2025 |
| 6 | RSVP change notifications + auto-flag in chart | 🟡 High | Medium | Aug 2025 |
| 7 | SEO landing pages (low-competition keywords) | 🟡 High | Low | Aug 2025 |
| 8 | QR code for RSVP page | 🟡 Medium | Low | Aug 2025 |
| 9 | Designer print templates (5 styles) | 🟡 Medium | Medium | Sep 2025 |
| 10 | Post-wedding keepsake PDF + referral prompt | 🟢 Medium | Low | Sep 2025 |

---

### Detailed Feature Specs

#### 1. Unified RSVP → Seating Flow *(Jul 2025)*
When a guest submits an RSVP, they automatically appear in the drag-and-drop seating canvas with their meal choice, +1 name, and dietary tag pre-attached. **Zero data re-entry.** This is the core "10x better" experience that no competitor does seamlessly — Table Planner has no RSVP, RSVPify has weak seating. Couples currently export CSVs and import between tools.

**Acceptance criteria:**
- RSVP submission triggers real-time update in the planner canvas
- Guest card in canvas shows: name, meal choice, dietary tags, +1 name
- Unassigned RSVP'd guests visible in a sidebar tray
- Declined guests automatically excluded from seating

#### 2. Shareable View-Only Venue Link *(Jul 2025)*
One-click "Share with Venue" generates a read-only, no-login-required link showing a beautiful print-ready chart with table numbers, guest names, and meal choices. Venue coordinators get exactly what they need without creating an account.

**Acceptance criteria:**
- Unique token-based URL (e.g., `/view/[shareToken]`)
- Print-optimized layout (A4/Letter)
- Shows table name, seats, guest name, meal, dietary tags
- Optional: expiry date on link

#### 3. Dietary & Accessibility Tagging *(Jul 2025)*
Per-guest tags: Vegan, Vegetarian, Gluten-Free, Nut Allergy, Halal, Kosher, Dairy-Free, Wheelchair Accessible. Tags appear visually on the seating canvas and in all exports.

**Acceptance criteria:**
- Tag picker in guest edit modal (multi-select)
- Visual tag badges on guest cards in canvas
- Tags included in PDF export and venue share link
- Filter guests by tag in the guest panel

#### 4. Homepage Copy + Social Proof Rewrite *(Jul 2025)*
Rewrite hero headline using pain-first/outcome-led copy. Add real testimonials with names and wedding dates. Add stats block ("12,400+ couples planned with Tablemate"). Add micro-copy under CTA ("No credit card required · Free up to 75 guests"). See `GROWTH_RESEARCH.md` Section 5 for exact copy.

#### 5. Guest Group / Family Tagging *(Aug 2025)*
Tag guests with named groups: "Bride's Family," "Groom's College Friends," "Work Colleagues," "Kids Table." Seating canvas highlights groups with distinct colors. Auto-suggest: "Keep this group together?" when dragging.

#### 6. RSVP Change Notifications *(Aug 2025)*
When a guest changes their RSVP (yes → no, or updates meal choice), the planner receives an in-app notification and the guest card is flagged in the seating canvas for reassignment.

#### 7. SEO Landing Pages *(Aug 2025)*
Create static, keyword-optimized pages targeting high-conversion low-competition queries identified in `GROWTH_RESEARCH.md` Section 3:
- `/free-wedding-rsvp-website`
- `/how-to-make-a-wedding-seating-chart`
- `/wedding-seating-chart-app`
- `/allseated-alternative`, `/rsvpify-alternative`, `/tableplanner-alternative`

#### 8. QR Code for RSVP Page *(Aug 2025)*
Generate a downloadable QR code for the RSVP link. Couples can include it on physical invitations or save-the-dates. Already have `qrcode` library in `package.json`.

#### 9. Designer Print Templates *(Sep 2025)*
5 designer-quality printable seating chart templates: Rustic, Modern, Floral, Minimalist, Black-Tie. Couples choose their wedding colors/fonts. Premium-tier feature. Export as high-res PDF.

#### 10. Post-Wedding Keepsake + Referral Prompt *(Sep 2025)*
48 hours after the wedding date, send an automated email prompting the couple to download a "Memory PDF" — who sat where, a timeline of their planning. Include a referral link: "Share Tablemate with your engaged friends → get 3 months free." This activates word-of-mouth at the highest emotional moment.

---

## 🏗️ Q4 2025 Roadmap — 8 Bigger Features

### 1. Real-Time Collaboration (Google Docs–style) *(Oct 2025)*
Two users — couple, or couple + planner — can edit the seating chart simultaneously with live presence indicators (cursors/avatars) and instant sync. Per-table comments/notes. Uses Supabase Realtime channels.

**Why now:** Wedding planning is inherently collaborative. Couples argue about seating over text. This is a major pain point and a strong differentiator vs. all consumer competitors.

### 2. Native Mobile App (iOS + Android) *(Oct–Nov 2025)*
A React Native (Expo) app wrapping the core planner with a dedicated **Day-of Check-In Mode**: coordinator opens the app at the reception door, searches guest name, sees table assignment instantly. Push notifications for RSVP changes.

**Why now:** 70%+ of initial traffic is mobile. The web app works responsively but a native app unlocks App Store distribution (organic discovery) and day-of use cases.

### 3. Wedding Planner / Pro Accounts *(Oct 2025)*
A "Planner" tier allowing professional wedding planners to manage multiple weddings from a single dashboard. Client handoff mode (transfer ownership to couple). White-label RSVP pages with planner branding. B2B pricing ($49–$99/mo).

### 4. Venue Floor Plan Import *(Nov 2025)*
Allow venues or couples to upload a floor plan image (PNG/PDF) as a background layer in the chart canvas. Tables are placed on top of the actual room layout. This is the #1 feature professionals want and a key differentiator vs. Table Planner.

### 5. Email Reminder Campaigns *(Nov 2025)*
Automated email sequences: RSVP reminder 4 weeks before deadline, "RSVP deadline approaching" 1 week out, "Thank you for RSVPing" confirmation, and wedding-day reminder with table assignment. Built on top of existing `/api/rsvp/send` infrastructure.

### 6. Meal Choice & Catering Export *(Nov 2025)*
A dedicated catering export: per-table meal count summary, total dietary breakdowns, printable per-table card showing each guest's meal. Formatted for venue/caterer delivery. This solves a real logistical pain point and increases the seating chart's practical value.

### 7. Stripe Subscription Management Portal *(Nov 2025)*
A self-serve billing portal (Stripe Customer Portal) for plan upgrades, downgrades, and cancellations. Currently billing is manual. Reduces support load and unlocks annual pricing.

### 8. Referral & Affiliate Program *(Dec 2025)*
Structured referral program: unique referral links, dashboard showing referred signups, rewards (free premium months). Affiliate tier for wedding bloggers, vendors, and planners who drive signups. This formalizes the organic referral loop already present in the product.

---

## 🔭 2026 Vision

These are larger platform bets requiring more research, partnership, or investment:

### 🤖 AI Wedding Planner (Full)
Expand beyond seating to a full AI planning assistant: budget tracking, vendor research, timeline builder, and a natural language chat interface ("Move the Johnsons away from the bar area and suggest alternatives"). Potentially powered by a fine-tuned model on wedding planning data.

### 🏛️ Venue Marketplace
A directory of partner venues with Tablemate integration. Venues upload their floor plans; couples select a venue and get a pre-configured canvas. Revenue model: venue subscription fee + referral commission from bookings. Positions Tablemate as a two-sided platform.

### 💌 Full Wedding Website Builder
A beautiful 1-page wedding website builder (5-minute setup) with RSVP embedded, countdown timer, couple story, photo gallery, and registry links. Makes Tablemate the "home base" for the entire wedding. Creates daily active use vs. current episodic use.

### 📸 Photo Memory Book
Post-wedding: couples and guests upload photos tagged to tables or moments. Tablemate auto-generates a shareable photo book keepsake. Viral sharing potential ("here's our table at the reception!"). Possible print-fulfillment partnership (Minted, Chatbooks).

### 🔗 Vendor Integrations
Native integrations with: The Knot (import guest list), Zola (registry + wedding website sync), Honeybook (planner workflow), Airtable (power users), and Google Sheets (two-way sync for spreadsheet-native users).

### 🌍 International & Multilingual Expansion
Localized versions for UK, Australia, India (high wedding market), and Western Europe. Currency localization, culturally-appropriate table layouts (e.g., head table configurations), and RTL support for Middle Eastern markets.

### 📊 Wedding Analytics Dashboard
Insights for couples: RSVP response rate over time, dietary breakdown percentages, table utilization heatmap. For Pro planners: cross-wedding analytics (average guest count, common dietary needs, RSVP response time benchmarks).

---

## 🔧 Technical Debt Backlog

Issues to address alongside feature development:

| Priority | Item | Notes |
|----------|------|-------|
| 🔴 High | **Supabase Row Level Security (RLS) audit** | Ensure all tables have proper RLS policies; critical before scaling |
| 🔴 High | **API route error handling standardization** | Inconsistent error responses across routes; add unified error middleware |
| 🔴 High | **Environment variable validation at startup** | Add runtime check for required env vars (Supabase, Stripe, OpenAI keys) |
| 🟡 Med | **`PlannerClient.tsx` decomposition** | This component is likely too large; extract `TableCard`, `SeatSlot`, `CanvasControls` |
| 🟡 Med | **Type safety in `lib/types.ts`** | Expand shared types; eliminate `any` casts in API routes |
| 🟡 Med | **jsPDF export quality** | Current PDF export is functional but not print-production-quality; consider `react-pdf` or server-side rendering |
| 🟡 Med | **AI route rate limiting** | `/api/ai/seat` has no rate limiting; add per-user limit to prevent abuse and runaway OpenAI costs |
| 🟡 Med | **Stripe webhook idempotency** | Ensure webhook handler is idempotent for retry scenarios |
| 🟢 Low | **Add `eslint` rules for hooks exhaustive-deps** | Likely missing in current eslint config |
| 🟢 Low | **Unit tests for core logic** | No test suite currently; add Vitest for `lib/` utilities and API route handlers |
| 🟢 Low | **Lighthouse performance budget** | Enforce <2.5s LCP in CI; critical for SEO ranking of key landing pages |
| 🟢 Low | **`tsconfig.tsbuildinfo` in `.gitignore`** | Build artifact being committed; should be excluded |

---

## ⚔️ Competitor Differentiation Strategy

### Our Position
**Tablemate is the only consumer wedding tool that unifies RSVP collection and seating chart building with equal quality in both.**

Every competitor has a fatal flaw:
- **Table Planner** — great seating, zero RSVP
- **RSVPify** — great RSVP, weak seating
- **WeddingWire** — brand recognition, terrible seating UX
- **AllSeated / Social Tables** — enterprise-grade, consumer-hostile

### The Three Moats We're Building

#### 1. Product Moat: The Unified Flow
The moment RSVP data flows directly into the seating canvas with zero re-entry, we have a workflow no competitor can match without a full rebuild. This is our core loop:
> **Guest RSVPs → Auto-appears on canvas with meal/dietary data → Couple drags to table → PDF export to venue**

Every coupling is a data handoff competitors require manually.

#### 2. Experience Moat: Consumer-Grade Design
AllSeated has the features but the UX is enterprise-cold. Couples abandon it. Our design principle: **powerful enough for professionals, joyful enough for anyone.** This is a positioning choice reflected in every interaction, copy line, and color palette.

#### 3. Distribution Moat: Post-Wedding Virality
Weddings are social events. Every couple who uses Tablemate attends weddings with other engaged or recently-engaged people. The post-wedding referral prompt (keepsake PDF + referral link) activates this network at the highest emotional moment. This is a distribution flywheel built into the product lifecycle, not a bolt-on growth hack.

### SEO Attack Strategy
Target the competitor brand keywords with highest conversion intent:
- `allseated alternative` (~medium competition, very high intent)
- `rsvpify alternative`
- `tableplanner alternative`
- `free wedding rsvp website` (low competition, 4,000–7,000/mo)

These searchers already know they need a tool — they just tried a competitor and want something better.

### Pricing Wedge
One-event, no-credit-card-required free tier (up to 75 guests) reduces friction to near-zero. Once couples are in the product and have their guest data loaded, switching costs are high. Our paid conversion event is the moment they exceed 75 guests or need premium exports — which happens naturally as the wedding approaches.

---

*Roadmap is a living document. Priorities shift based on user feedback, growth metrics, and market conditions.*
*See `GROWTH_RESEARCH.md` for the research underlying these decisions.*
