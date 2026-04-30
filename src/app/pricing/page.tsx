"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

const plans = [
  {
    key: "free",
    name: "Free",
    price: "€0",
    period: "forever",
    badge: null,
    desc: "Perfect for small, intimate weddings.",
    features: [
      "Up to 50 guests",
      "Drag-and-drop seating chart",
      "RSVP tracking",
      "Meal preferences",
      "Export guest list (CSV)",
      "Wishing Wall",
    ],
    cta: "Get Started Free",
    ctaHref: "/signup",
    highlight: false,
  },
  {
    key: "couple",
    name: "Couple",
    price: "€29",
    period: "one-time",
    badge: null,
    desc: "Everything you need for your big day.",
    features: [
      "Unlimited guests",
      "All Free features",
      "Multiple venues / floors",
      "CSV import",
      "RSVP email invites",
      "Printable seating chart",
      "Priority support",
    ],
    cta: "Buy Couple",
    ctaHref: "/signup",
    highlight: true,
  },
  {
    key: "premium",
    name: "Premium",
    price: "€49",
    period: "one-time",
    badge: "Best Value",
    desc: "For larger weddings with complex seating.",
    features: [
      "Everything in Couple",
      "AI Smart Seating ✨",
      "Seating rules engine",
      "Group / party management",
      "Advanced export options",
      "Meal summary for caterer",
    ],
    cta: "Buy Premium",
    ctaHref: "/signup",
    highlight: false,
  },
  {
    key: "planner",
    name: "Planner",
    price: "€19",
    period: "per month",
    badge: "For Pros",
    desc: "Manage multiple events as a professional.",
    features: [
      "Everything in Premium",
      "Unlimited weddings",
      "Client sharing & collaboration",
      "White-label exports",
      "Dedicated support",
      "Early access to new features",
    ],
    cta: "Start Planner Trial",
    ctaHref: "/signup",
    highlight: false,
  },
];

export default function PricingPage() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("tm-theme");
    if (saved === "dark") setDark(true);
  }, []);

  const bg      = dark ? "bg-[#1A1618]" : "bg-[#FDFBF8]";
  const header  = dark ? "bg-[#1A1618]/90 border-[#3A3540]" : "bg-white/80 border-[#EDE8E0]";
  const text    = dark ? "text-[#F0EBE8]" : "text-[#2A2328]";
  const muted   = dark ? "text-[#9B9098]" : "text-[#6B6068]";
  const cardBg  = dark ? "bg-[#242028] border-[#3A3540]" : "bg-white border-[#EDE8E0]";
  const footerBorder = dark ? "border-[#3A3540]" : "border-[#EDE8E0]";

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-200`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 ${header} backdrop-blur border-b`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-[#C9956E] text-xl">♥</span>
            <span className={`font-playfair text-xl font-semibold ${text}`}>TableMate</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const next = !dark;
                setDark(next);
                localStorage.setItem("tm-theme", next ? "dark" : "light");
              }}
              className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${
                dark
                  ? "border-[#3A3540] bg-[#2A2630] text-yellow-300 hover:bg-[#3A3540]"
                  : "border-[#EDE8E0] bg-white text-[#6B6068] hover:border-[#C9956E]"
              }`}
            >
              {dark ? "☀️" : "🌙"}
            </button>
            <Link href="/login" className="px-4 py-2 text-sm font-medium rounded-lg border-2 border-[#C9956E] text-[#C9956E] hover:bg-[#C9956E] hover:text-white transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="px-4 py-2 bg-[#C9956E] hover:bg-[#B8845D] text-white text-sm font-medium rounded-lg transition-colors">
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-12 text-center">
        <h1 className={`font-playfair text-4xl md:text-5xl font-bold ${text} mb-4`}>
          Simple, honest <span className="text-[#C9956E]">pricing</span>
        </h1>
        <p className={`text-lg ${muted} max-w-xl mx-auto`}>
          Pay once and own it forever. No subscriptions surprises — except for the Planner pro plan.
        </p>
      </section>

      {/* Plans */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map(plan => (
            <div
              key={plan.key}
              className={`relative rounded-2xl border p-6 flex flex-col transition-shadow ${cardBg} ${
                plan.highlight
                  ? "border-[#C9956E] shadow-xl shadow-[#C9956E]/15 ring-2 ring-[#C9956E]/30"
                  : ""
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#C9956E] text-white text-xs font-bold rounded-full whitespace-nowrap">
                  {plan.badge}
                </div>
              )}
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#C9956E] text-white text-xs font-bold rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-4">
                <h2 className={`font-playfair text-xl font-bold ${text} mb-1`}>{plan.name}</h2>
                <p className={`text-xs ${muted} mb-3`}>{plan.desc}</p>
                <div className="flex items-baseline gap-1">
                  <span className={`font-playfair text-3xl font-bold ${text}`}>{plan.price}</span>
                  <span className={`text-sm ${muted}`}>/ {plan.period}</span>
                </div>
              </div>

              <ul className="flex-1 space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className={`flex items-start gap-2 text-sm ${muted}`}>
                    <span className="text-[#C9956E] mt-0.5 flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={`block text-center py-3 px-4 rounded-xl text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? "bg-[#C9956E] hover:bg-[#B8845D] text-white"
                    : dark
                    ? "bg-[#2A2630] hover:bg-[#3A3540] text-[#F0EBE8] border border-[#3A3540]"
                    : "bg-[#FAF7F4] hover:bg-[#F0EAE2] text-[#2A2328] border border-[#EDE8E0]"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ teaser */}
        <div className={`mt-16 rounded-2xl border ${cardBg} p-8 text-center`}>
          <h3 className={`font-playfair text-2xl font-bold ${text} mb-3`}>Questions?</h3>
          <p className={`${muted} mb-6 max-w-lg mx-auto`}>
            All paid plans include lifetime updates and access. You can upgrade at any time —
            just pay the difference. Stripe handles all payments securely.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            {[
              { q: "Can I try before buying?", a: "Yes — the free plan and demo are always available." },
              { q: "Is there a refund policy?", a: "30-day money-back guarantee, no questions asked." },
              { q: "Do prices include VAT?", a: "Prices shown exclude VAT where applicable." },
            ].map(item => (
              <div key={item.q} className={`max-w-xs text-left p-4 rounded-xl ${dark ? "bg-[#1A181C]" : "bg-[#FAF7F5]"}`}>
                <div className={`font-semibold text-sm ${text} mb-1`}>{item.q}</div>
                <div className={`text-xs ${muted}`}>{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t ${footerBorder} py-8`}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#C9956E]">♥</span>
            <span className={`font-playfair font-semibold ${text}`}>TableMate</span>
          </div>
          <div className="flex items-center gap-4">
            <p className={`text-sm ${dark ? "text-[#6B6068]" : "text-[#9B9098]"}`}>© 2025 TableMate. Made with love for couples everywhere.</p>
            <Link href="/privacy" className={`text-sm ${muted} hover:opacity-80 transition-opacity`}>Privacy</Link>
            <Link href="/terms"   className={`text-sm ${muted} hover:opacity-80 transition-opacity`}>Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
