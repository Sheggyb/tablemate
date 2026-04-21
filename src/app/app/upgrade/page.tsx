"use client";

import { useState } from "react";
import Link from "next/link";

const plans = [
  {
    key: "couple",
    name: "Couple",
    price: "€29",
    period: "one-time",
    desc: "Perfect for couples planning their big day",
    features: [
      "Unlimited guests",
      "Cloud save & sync across devices",
      "Share link with partner/planner",
      "RSVP portal — email invites to guests",
      "PDF export for caterer",
    ],
  },
  {
    key: "premium",
    name: "Premium",
    price: "€49",
    period: "one-time",
    desc: "Everything for a perfect wedding",
    features: [
      "Everything in Couple",
      "🤖 AI seating optimizer",
      "Live collaboration (real-time editing)",
      "Custom floor plan backgrounds",
      "Priority support",
    ],
    highlighted: true,
  },
  {
    key: "planner",
    name: "Planner Pro",
    price: "€19",
    period: "/month",
    desc: "For wedding professionals",
    features: [
      "Unlimited weddings",
      "Client portals",
      "White-label option",
      "Multi-wedding dashboard",
      "Everything in Premium",
    ],
  },
];

export default function UpgradePage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (plan: string) => {
    setLoading(plan);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else { alert("Checkout failed. Please try again."); setLoading(null); }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF8]">
      <header className="bg-white border-b border-[#EDE8E0] py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-2">
            <span className="text-[#C9956E]">♥</span>
            <span className="font-playfair font-semibold text-[#2A2328]">TableMate</span>
          </Link>
          <Link href="/app" className="text-sm text-[#6B6068] hover:text-[#2A2328]">← Back</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="font-playfair text-4xl font-bold text-[#2A2328] mb-3">Upgrade TableMate</h1>
          <p className="text-[#6B6068] max-w-lg mx-auto">One-time payment. No subscriptions for couples. Secure checkout via Stripe.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan.key} className={`bg-white rounded-2xl border p-8 relative ${plan.highlighted ? "border-[#C9956E] shadow-xl shadow-[#C9956E]/10" : "border-[#EDE8E0]"}`}>
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#C9956E] text-white text-xs font-bold rounded-full whitespace-nowrap">
                  ✨ Most Popular
                </div>
              )}
              <h2 className="font-playfair text-2xl font-bold text-[#2A2328] mb-1">{plan.name}</h2>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-[#2A2328]">{plan.price}</span>
                <span className="text-sm text-[#9B9098]">{plan.period}</span>
              </div>
              <p className="text-sm text-[#6B6068] mb-6">{plan.desc}</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#4A4348]">
                    <span className="text-[#C9956E] mt-0.5 flex-shrink-0">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgrade(plan.key)}
                disabled={loading === plan.key}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 ${
                  plan.highlighted
                    ? "bg-[#C9956E] hover:bg-[#B8845D] text-white"
                    : "border border-[#DDD7D0] hover:border-[#C9956E] text-[#2A2328]"
                }`}
              >
                {loading === plan.key ? "Loading…" : `Get ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-[#9B9098] mt-8">
          🔒 Secure checkout via Stripe · 30-day money-back guarantee
        </p>
      </main>
    </div>
  );
}
