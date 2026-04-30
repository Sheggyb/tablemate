"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const plans = [
  {
    key: "free",
    name: "Free",
    price: "Free",
    period: "",
    desc: "Get started with the basics",
    features: [
      "1 wedding",
      "Up to 50 guests",
      "Basic seating chart",
      "Drag & drop tables",
    ],
  },
  {
    key: "couple",
    name: "Couple",
    price: "€29",
    period: "one-time",
    desc: "Perfect for couples planning their big day",
    features: [
      "1 wedding",
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
      "999 weddings",
      "Unlimited guests",
      "Client portals",
      "White-label option",
      "Multi-wedding dashboard",
      "Everything in Premium",
    ],
  },
];

export default function UpgradePage() {
  const [dark, setDark] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string>("free");

  useEffect(() => {
    const saved = localStorage.getItem("tm-theme");
    if (saved === "dark") setDark(true);
    // Fetch the user's current plan
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single();
      if (data?.plan) setCurrentPlan(data.plan);
    });
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("tm-theme", next ? "dark" : "light");
  };

  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const handleUpgrade = async (plan: string) => {
    if (plan === "free") return;
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
  const shadowHighlight = dark ? "shadow-[#C9956E]/10" : "shadow-[#C9956E]/10";
  const featureText = dark ? "text-[#9B9098]" : "text-[#4A4348]";

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-200`}>
      <header className={`${headerBg} backdrop-blur border-b ${headerBorder} py-4 px-6`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-2">
            <span className="text-[#C9956E]">♥</span>
            <span className="font-playfair font-semibold" style={{ color: dark ? "#F0EBE8" : "#2A2328" }}>TableMate</span>
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={toggleDark}
              className="w-9 h-9 rounded-lg flex items-center justify-center border transition-colors"
              style={dark ? { borderColor: "#3A3540", backgroundColor: "#2A2630", color: "#F0EBE8" } : { borderColor: "#EDE8E0", backgroundColor: "white", color: "#6B6068" }}>
              {dark ? "☀️" : "🌙"}
            </button>
            <Link href="/app" className={`text-sm ${muted}`}>← Back</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-4">
          <h1 className={`font-playfair text-4xl font-bold mb-3 ${text}`}>Upgrade TableMate</h1>
          <p className={`${muted} max-w-lg mx-auto`}>One-time payment. No subscriptions for couples. Secure checkout via Stripe.</p>
        </div>

        {/* Beta notice */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{ background: "rgba(201,149,110,0.12)", color: "#C9956E", border: "1px solid rgba(201,149,110,0.3)" }}>
            🎉 <span><strong>Beta:</strong> all features are currently free for all users</span>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-5">
          {plans.map(plan => {
            const isCurrent = currentPlan === plan.key;
            const isHighlighted = plan.highlighted;
            return (
              <div key={plan.key} className={`rounded-2xl border p-6 relative flex flex-col ${
                isHighlighted
                  ? `border-[#C9956E] shadow-xl ${shadowHighlight} ${dark ? "bg-[#242028]" : "bg-white"}`
                  : card
              }`}>
                {isHighlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#C9956E] text-white text-xs font-bold rounded-full whitespace-nowrap">
                    ✨ Most Popular
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 right-4 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full whitespace-nowrap">
                    ✓ Current Plan
                  </div>
                )}
                <div className="flex-1">
                  <h2 className={`font-playfair text-xl font-bold mb-1 ${text}`}>{plan.name}</h2>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className={`text-2xl font-bold ${text}`}>{plan.price}</span>
                    {plan.period && <span className="text-sm text-[#9B9098]">{plan.period}</span>}
                  </div>
                  <p className={`text-sm ${muted} mb-5`}>{plan.desc}</p>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map(f => (
                      <li key={f} className={`flex items-start gap-2 text-sm ${featureText}`}>
                        <span className="text-[#C9956E] mt-0.5 flex-shrink-0">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => handleUpgrade(plan.key)}
                  disabled={loading === plan.key || isCurrent || plan.key === "free"}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 ${
                    isCurrent
                      ? "border"
                      : isHighlighted
                        ? "bg-[#C9956E] hover:bg-[#B8845D] text-white"
                        : "border hover:border-[#C9956E]"
                  }`}
                  style={(!isHighlighted || isCurrent) ? { color: dark ? "#F0EBE8" : "#2A2328", borderColor: "#DDD7D0" } : {}}
                >
                  {loading === plan.key
                    ? "Loading…"
                    : isCurrent
                      ? "Current Plan"
                      : plan.key === "free"
                        ? "Free Forever"
                        : `Get ${plan.name}`}
                </button>
              </div>
            );
          })}
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
