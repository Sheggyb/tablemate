# Tablemate 💍

> The all-in-one wedding planning tool that makes guest logistics joyful, not stressful.

**Live:** [tablemate-beta.vercel.app](https://tablemate-beta.vercel.app)

---

## What is Tablemate?

Tablemate helps couples manage their wedding from invite to seating — collect RSVPs, manage the guest list, build a drag-and-drop seating chart, and send it all from one place. No spreadsheets. No chaos.

---

## Features

- 🔐 **Auth** — Sign up / login via Supabase Auth (email + OAuth)
- 👥 **Guest management** — Add, edit, remove guests with dietary/RSVP tracking
- 🪑 **Drag-and-drop seating chart** — Visual table placement on a canvas
- 🤖 **AI seating suggestions** — GPT-powered seat assignment based on your rules
- 📋 **Seating rules** — Keep apart / keep together logic
- 📧 **RSVP emails** — Send personalized RSVP links to guests
- 🌐 **Guest share page** — Public RSVP view for guests
- 💌 **Wishing wall** — Guest messages and well-wishes
- 📄 **PDF export** — Export seating chart and guest list
- 📱 **Mobile responsive** — Full mobile planner view
- 💳 **Stripe subscriptions** — Free + Pro tier billing

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router) |
| UI | React 19 + Tailwind CSS v4 |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Payments | Stripe |
| AI | OpenAI (GPT) |
| Deployment | Vercel |

---

## Project Structure

```
src/
├── app/
│   ├── app/              # Authenticated app (dashboard, planner, upgrade)
│   │   └── wedding/[id]/ # Core planner: canvas, guests, rules, export
│   ├── api/              # API routes (guests, RSVP, Stripe, AI)
│   ├── rsvp/[token]/     # Public RSVP page
│   ├── guest/[shareCode] # Guest share page
│   └── (public pages)    # Landing, pricing, blog, login, signup
├── components/           # Shared UI components
└── lib/                  # Supabase client, Stripe, export utils, types
```

---

## Deployment

This project is deployed on **Vercel** and connected to **Supabase** as the backend.

There is no local dev setup required — the live app at [tablemate-beta.vercel.app](https://tablemate-beta.vercel.app) is the working product.

### Environment Variables

Required in Vercel dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
OPENAI_API_KEY=
```

---

## Docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Full system architecture
- [`ROADMAP.md`](ROADMAP.md) — Feature roadmap and status
- [`supabase/schema.sql`](supabase/schema.sql) — Database schema
