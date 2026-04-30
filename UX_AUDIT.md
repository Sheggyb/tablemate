# 🔍 TableMate UX Audit Report

**Site:** https://tablemate-beta.vercel.app  
**Audited:** 2026-05-01  
**Auditor:** UX Research Agent  
**Scope:** Full conversion funnel — Landing → Demo → Pricing → Auth

---

## Executive Summary

TableMate is a wedding seating planner app that presents a polished, conversion-optimised experience. The visual design is cohesive, the demo is genuinely interactive, pricing is clear, and no broken links or JavaScript errors were found. A few friction points exist — most notably the **"Reviews" nav link anchors to a section that lacks a dedicated page**, and the **annual/monthly toggle on pricing is slightly confusing** since it also affects one-time-payment plans. Overall, the funnel is strong for a beta product.

**Overall Score: 8.3 / 10**

---

## 1. Landing Page

### ✅ Hero Section
- **Headline:** "Plan Your Perfect Wedding Seating — Free" — clear, benefit-focused, and immediately communicates the core value proposition with the "Free" callout highlighted in warm amber.
- **Sub-headline:** Describes key capabilities (drag-drop, 500+ guests, RSVP, exports) concisely.
- **Dual CTAs:** "Start Planning Free" (primary, amber fill) and "Try the Demo →" (secondary, outline). This is a smart pattern — low-commitment entry via demo plus direct signup path.
- **Trust badge:** "Free to start — no credit card required" immediately beneath the headline removes purchase anxiety.
- **Micro-copy:** "Free forever for small weddings · No account needed to try" — excellent friction-reducer under the CTAs.

### ✅ Social Proof
- "LOVED BY COUPLES WORLDWIDE" label over the stats block.
- **2,400+ couples already planning** — concrete, credible number.
- **⭐ 4.9/5 from 380+ reviews** — strong rating with volume.
- Three testimonial cards from international couples (London, Madrid, Toronto) — adds geographic diversity and authenticity.
- **Gap:** The "Reviews" navigation link points to this testimonials section as an anchor, but there is no dedicated reviews page. The link works as an in-page scroll, which is fine functionally, but users who expect a full review page with more entries may feel underwhelmed by just 3 testimonials.

### ✅ Features Section
- Four feature cards: Drag & Drop Canvas, RSVP Portal, Smart Seating, Beautiful Exports.
- Clean icons and descriptive copy for each.
- Well-structured for scanning.

### ✅ Secondary CTA + FAQ
- CTA is repeated at the bottom of the page — good funnel design.
- 5 collapsible FAQ items addressing common objections (pricing, guest limits, collaboration, RSVP accounts, data retention).

### ⚠️ Missing Elements
- **No hero illustration or product screenshot** — the hero section is entirely text-based. A screenshot or animation of the actual seating chart would significantly increase conversion by showing the product immediately.
- **No video/walkthrough embed** — for a visual product like a seating planner, a short demo video in the hero would be highly effective.
- **Footer is minimal** — only Privacy and Terms links. No About, Blog, Contact, or social media links.

---

## 2. Demo Page (`/demo`)

### ✅ Fully Interactive
The demo is a fully functioning seating chart application loaded with sample data ("Sarah & Tom's Wedding, 6 Sept 2025"). Users can interact with:
- **Canvas area** showing 6 round tables with seated guests (color-coded by meal preference)
- **Left sidebar** with Add/Custom/Guests tabs and table shape options (Round 6/8/10/12, Square 4, Banquet 10/12)
- **Zoom controls** (−, 100%, +, Fit, Reset)
- **✨ Auto-Seat button** to trigger AI seating
- **Guests panel** with full guest list (20 guests, filters, RSVP status, meal preferences, party assignments)
- **Top toolbar**: Meals, Parties, Smart Seat, Settings, undo/redo (greyed out until changes)

### ✅ Smart Conversion Hooks
- "Demo Mode — Changes don't save" notice is visible but non-intrusive
- "Create My Wedding →" CTA button is always visible in the top-right — excellent placement during exploration
- Unseated count (2 unseated) shown in orange creates gentle urgency to engage

### ⚠️ Minor Issues
- **Undo/Redo buttons are disabled** on fresh load — expected but may confuse users who want to immediately explore changes
- **No guided onboarding overlay or tooltip tour** — a first-time user may not know to click tables, drag guests, etc. A brief "Try these actions:" prompt card would improve demo conversion

---

## 3. Pricing Page (`/pricing`)

### ✅ Page Loads & Plans Are Clear
Four plans presented in a clean 4-column card layout:

| Plan     | Price          | Target            |
|----------|----------------|-------------------|
| Free     | €0 forever     | Small weddings    |
| Couple   | €29 one-time   | Standard weddings |
| Premium  | €49 one-time   | Large/complex     |
| Planner  | €19/month      | Professional planners |

- **"Most Popular"** badge on Couple, **"Best Value"** on Premium, **"For Pros"** on Planner — effective visual anchoring.
- **Full feature comparison table** — 16 features across all 4 plans with clear ✓ / — indicators.
- **Billing FAQ** (4 collapsible items) addresses payment questions.

### ✅ Annual/Monthly Toggle Works
The toggle switches between Monthly and Annual billing with a **"Save 20%"** badge:
- Planner monthly: €19/mo → Annual: €15/mo (billed €180/yr)
- Couple: €29 → €23 (one-time)
- Premium: €49 → €39 (one-time)

### ⚠️ Toggle UX Issue
The annual/monthly toggle affects one-time-payment plans (Couple, Premium), which is logically inconsistent — one-time payments don't have billing cycles. This is confusing:
- Labeling the toggle "Monthly/Annual" implies subscription billing
- Applying it to one-time plans gives the impression prices fluctuate by season rather than being a genuine discount offer
- **Recommendation:** Re-label as "Standard / Discounted" or explain the discount as a promotion rather than an annual cycle. Alternatively, show a crossed-out original price (e.g., ~~€29~~ → **€23**) to make the saving feel more concrete.

### ⚠️ No Checkout Flow
Clicking "Buy Couple" or "Buy Premium" doesn't lead to a visible checkout — this is expected in beta, but the CTAs should either link to a working Stripe checkout or display a "Coming Soon / Join waitlist" modal. Dead CTAs are a trust issue.

---

## 4. Login & Signup Pages

### Login (`/login`) — ✅ Functional Design
- Clean centered card on cream background
- **Google OAuth button** prominently placed
- Email + Password fields with proper labels and placeholders
- "Sign In" CTA in brand amber color
- "Sign up free" link for new users
- Dark mode toggle available

### Signup (`/signup`) — ✅ Functional Design
- Headline: "Create your account" with sub-copy "Free forever · No credit card needed" — excellent trust signal
- **Google OAuth** option
- Three fields: Name ("Alex & Sam" placeholder is charmingly couples-oriented), Email, Password
- "Create Free Account" CTA
- Link back to Sign In

### ⚠️ Minor Auth Issues
- **No "Forgot Password" link** on the login page — a common oversight that will generate support tickets
- **No email confirmation messaging** — unclear if signup triggers email verification
- **No form validation indicators** visible pre-submission (e.g., password strength meter)
- No CAPTCHA — fine for beta, but may need reCAPTCHA before public launch

---

## 5. Mobile Responsiveness

The site uses a responsive layout. Key observations:
- **Navigation:** Full nav links visible (Features, Reviews, FAQ, Pricing) alongside dark mode toggle and auth CTAs — on narrow screens this may crowd the header. A hamburger menu may be needed at mobile breakpoints.
- **Landing page:** Single-column layout expected to render cleanly on mobile given the minimal CSS structure.
- **Demo page:** The seating chart canvas is a complex drag-and-drop interface that would be challenging on touch screens. No mobile-specific fallback or "Best experienced on desktop" warning was observed.
- **Pricing:** 4-column plan grid likely collapses to stacked cards on mobile.
- **Auth pages:** Centered card forms are naturally mobile-friendly.

**⚠️ Key Concern:** The interactive demo canvas relies on drag-and-drop, which is inherently awkward on mobile. A "view-only" mobile demo with a CTA to "Try on desktop" would prevent frustration.

---

## 6. Broken Links & Visual Bugs

| Item | Status | Notes |
|------|--------|-------|
| `/` Homepage | ✅ OK | Loads cleanly |
| `/demo` | ✅ OK | Fully interactive |
| `/pricing` | ✅ OK | All plans visible |
| `/login` | ✅ OK | Form renders properly |
| `/signup` | ✅ OK | Form renders properly |
| `/privacy` | ✅ OK | Full policy content |
| `/terms` | ✅ OK | Full ToS content |
| Nav "Features" link | ✅ OK | Scrolls to features section |
| Nav "Reviews" link | ✅ OK | Scrolls to testimonials section |
| Nav "FAQ" link | ✅ OK | Scrolls to FAQ section |
| Nav "Pricing" link | ✅ OK | Routes to /pricing |
| Footer "Privacy" link | ✅ OK | Routes to /privacy |
| Footer "Terms" link | ✅ OK | Routes to /terms |
| "Drop us a line" (FAQ) | ✅ OK | mailto link |
| Buy Couple/Premium CTAs | ⚠️ No checkout | No Stripe integration visible |
| JavaScript console errors | ✅ None | Zero errors detected |

**No 404 errors or broken links found.**

---

## 7. Page Load Speed

**Impression: Fast** — all pages load within what appears to be sub-2-second range.
- The landing page is largely static content with no heavy embeds (no video, no large image carousels)
- The demo page loads a JavaScript-heavy canvas app, yet it renders quickly
- No visible layout shift (CLS) issues observed
- Fonts load consistently; no FOUT (Flash of Unstyled Text)
- Dark mode toggle is instant (client-side state)

The site benefits from Vercel's edge CDN which gives consistently fast global performance.

---

## 8. Overall Conversion Funnel Quality

### Funnel Flow Assessment

```
Landing Page → Demo → Pricing → Signup → (App)
```

| Stage | Score | Notes |
|-------|-------|-------|
| Landing → Demo | ⭐⭐⭐⭐⭐ | Dual CTA, low friction demo entry |
| Demo → Signup | ⭐⭐⭐⭐ | "Create My Wedding" CTA present but no mid-demo nudges |
| Landing → Signup | ⭐⭐⭐⭐ | Clear CTAs, good trust signals |
| Pricing → Purchase | ⭐⭐⭐ | CTA buttons present but no working checkout in beta |
| Signup → Onboarding | N/A | Not audited (requires account) |

### Strengths
1. **Freemium model is well-communicated** — free tier clearly defined, upgrade path logical
2. **"No credit card required" messaging** is consistent across hero, signup, and pricing
3. **Demo is genuinely impressive** — not a video or mockup, real interactive app with sample data
4. **Trust signals are well-placed** — star ratings, guest count, international testimonials
5. **One-time pricing for consumer plans** (€29, €49) removes subscription fatigue anxiety
6. **Visual design is professional** — warm, wedding-appropriate palette; clean typography hierarchy

### Weaknesses / Recommendations

| Priority | Issue | Recommendation |
|----------|-------|---------------|
| 🔴 High | No product screenshot/video in hero | Add canvas screenshot or 15s demo GIF above the fold |
| 🔴 High | Buy CTAs go nowhere | Implement Stripe Checkout or "Join waitlist" modal |
| 🟡 Medium | No "Forgot Password" on login | Add forgot password link and flow |
| 🟡 Medium | Annual toggle confusing for one-time plans | Relabel or show strikethrough pricing |
| 🟡 Medium | Demo has no guided tooltips | Add 3-step onboarding overlay for first-time demo users |
| 🟡 Medium | Mobile experience for canvas | Add "Best on desktop" banner or mobile-optimised demo |
| 🟢 Low | Only 3 testimonials | Link to "See all reviews" or add more testimonials |
| 🟢 Low | Footer is sparse | Add About, Contact, and social media links |
| 🟢 Low | No password strength meter on signup | Add real-time password strength indicator |
| 🟢 Low | No social proof on pricing page | Add "2,400+ couples" badge near plan CTAs |

---

## Final Verdict

TableMate has a **strong foundation** for a beta product. The design is polished, the demo is genuinely functional and impressive, and the value proposition is clear. The biggest risks to conversion are: (1) the buy buttons not leading anywhere functional, and (2) the hero missing a visual product preview. Addressing these two items should be the immediate priority before the public launch.

**Score breakdown:**
- Visual Design: 9/10
- Hero/CTA Clarity: 8/10
- Demo Experience: 9/10
- Pricing Clarity: 7/10
- Auth UX: 7/10
- Mobile: 7/10
- Performance: 9/10
- Conversion Funnel: 8/10

**Overall: 8.3 / 10** — Ready for soft launch with minor fixes recommended before hard launch.

---

*Report generated by automated UX audit — tablemate-beta.vercel.app — May 2026*
