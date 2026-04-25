"use client";

import { useState, useEffect } from "react";
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
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("tm-theme");
    if (saved === "dark") setDark(true);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("tm-theme", next ? "dark" : "light");
  };

  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const handleUpgrade = async (plan: string) => {
    setLoading(plan);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else { setLoading(null); setToast("Checkout failed. Please try again."); setTimeout(() => setToast(null), 3000); }
  };

  const bg       = dark ? "bg-[#1A1718]" : "bg-[#FDFBF8]";
  const headerBg = dark ? "bg-[#1A1718]/90" : "bg-white/80";
  const headerBorder = dark ? "border-[#3A3540]" : "border-[#EDE8E0]";
  const text     = dark ? "text-[#F0EBE8]" : "text-[#2A2328]";
  const muted    = dark ? "text-[#9B9098]" : "text-[#6B6068]";
  const card     = dark ? "bg-[#242028] border-[#3A3540]" : "bg-white border-[#EDE8E0]";
  const cardHighlight = dark ? "bg-[#242028] border-[#C9956E]" : "bg-white border-[#C9956E]";
  const shadowHighlight = dark ? "shadow-[#C9956E]/10" : "shadow-[#C9956E]/10";
  const featureText = dark ? "text-[#9B9098]" : "text-[#4A4348]";
  const footerBorder = dark ? "border-[#3A3540]" : "border-[#EDE8E0]";

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-200`}>
      <header className={`${headerBg} backdrop-blur border-b ${headerBorder} py-4 px-6`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-2">
            <span className="text-[#C9956E]">♥</span>
            <span className="font-playfair font-semibold" style={{ color: text }}>TableMate</span>
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={toggleDark}
              className="w-9 h-9 rounded-lg flex items-center justify-center border transition-colors"
              style={dark ? { borderColor: "#3A3540", backgroundColor: "#2A2630", color: "#F0EBE8" } : { borderColor: "#EDE8E0", backgroundColor: "white", color: "#6B6068" }}>
              {dark ? "☀️" : "🌙"}
            </button>
            <Link href="/app" className="text-sm" style={{ color: muted }}>← Back</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="font-playfair text-4xl font-bold mb-3" style={{ color: text }}>Upgrade TableMate</h1>
          <p className={muted + " max-w-lg mx-auto"}>One-time payment. No subscriptions for couples. Secure checkout via Stripe.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan.key} className={`rounded-2xl border p-8 relative ${plan.highlighted ? "border-[#C9956E] shadow-xl " + shadowHighlight : card}`}>
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#C9956E] text-white text-xs font-bold rounded-full whitespace-nowrap">
                  ✨ Most Popular
                </div>
              )}
              <h2 className="font-playfair text-2xl font-bold mb-1" style={{ color: text }}>{plan.name}</h2>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold" style={{ color: text }}>{plan.price}</span>
                <span className="text-sm text-[#9B9098]">{plan.period}</span>
              </div>
              <p className={`text-sm ${muted} mb-6`}>{plan.desc}</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map(f => (
                  <li key={f} className={`flex items-start gap-2 text-sm ${featureText}`}>
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
                    : "border hover:border-[#C9956E]"
                }`}
                style={!plan.highlighted ? { color: text, borderColor: "#DDD7D0" } : {}}
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

      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "#2C2628", color: "#EDE8E3", padding: "12px 24px", borderRadius: 12,
          fontSize: 14, fontWeight: 600, zIndex: 999, whiteSpace: "nowrap",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)"
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}