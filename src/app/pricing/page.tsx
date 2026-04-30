"use client";
import Link from "next/link";
import { useState } from "react";
import { useDarkMode } from "@/lib/darkmode";
import DarkModeToggle from "@/components/DarkModeToggle";
import { useRouter } from "next/navigation";

/* ─── Plan definitions ─────────────────────────────────── */
const plans = [
  {
    key: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    period: "forever",
    isForever: true,
    badge: null,
    mostPopular: false,
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
    monthlyPrice: 29,
    annualPrice: 23,
    period: "one-time",
    isForever: true,
    badge: null,
    mostPopular: true,
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
    monthlyPrice: 49,
    annualPrice: 39,
    period: "one-time",
    isForever: true,
    badge: "Best Value",
    mostPopular: false,
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
    monthlyPrice: 19,
    annualPrice: 15,
    period: "per month",
    isForever: false,
    badge: "For Pros",
    mostPopular: false,
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

/* ─── Comparison table rows ────────────────────────────── */
const comparisonRows: { label: string; free: string | boolean; couple: string | boolean; premium: string | boolean; planner: string | boolean }[] = [
  { label: "Guest limit",           free: "50 guests",   couple: "Unlimited",  premium: "Unlimited",  planner: "Unlimited" },
  { label: "Drag-and-drop chart",   free: true,          couple: true,         premium: true,         planner: true },
  { label: "RSVP tracking",         free: true,          couple: true,         premium: true,         planner: true },
  { label: "Meal preferences",      free: true,          couple: true,         premium: true,         planner: true },
  { label: "Wishing Wall",          free: true,          couple: true,         premium: true,         planner: true },
  { label: "CSV export",            free: true,          couple: true,         premium: true,         planner: true },
  { label: "Multiple venues/floors",free: false,         couple: true,         premium: true,         planner: true },
  { label: "CSV import",            free: false,         couple: true,         premium: true,         planner: true },
  { label: "RSVP email invites",    free: false,         couple: true,         premium: true,         planner: true },
  { label: "Printable seating chart",free: false,        couple: true,         premium: true,         planner: true },
  { label: "AI Smart Seating ✨",   free: false,         couple: false,        premium: true,         planner: true },
  { label: "Seating rules engine",  free: false,         couple: false,        premium: true,         planner: true },
  { label: "Group / party management", free: false,      couple: false,        premium: true,         planner: true },
  { label: "Meal summary for caterer", free: false,      couple: false,        premium: true,         planner: true },
  { label: "Unlimited weddings",    free: false,         couple: false,        premium: false,        planner: true },
  { label: "Client sharing & collab", free: false,       couple: false,        premium: false,        planner: true },
  { label: "White-label exports",   free: false,         couple: false,        premium: false,        planner: true },
  { label: "Priority / dedicated support", free: false,  couple: "Priority",   premium: "Priority",   planner: "Dedicated" },
];

const billingFaqs = [
  {
    q: "What does 'one-time payment' mean?",
    a: "For the Free, Couple and Premium plans you pay a single fee and own the plan forever — including all future updates. No recurring charges.",
  },
  {
    q: "How does the annual discount work?",
    a: "Switching to annual billing saves you 20% on the Planner plan. You're billed once per year instead of monthly, with the same features.",
  },
  {
    q: "Can I upgrade after purchasing?",
    a: "Yes. You can upgrade from Free → Couple → Premium at any time. You only pay the difference in price.",
  },
  {
    q: "What is your refund policy?",
    a: "We offer a 30-day money-back guarantee on all paid plans. No questions asked — just contact support and we'll refund you promptly.",
  },
];

/* ─── Component ────────────────────────────────────────── */
export default function PricingPage() {
  const router = useRouter();
  const { dark } = useDarkMode();
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const handleBuy = async (planKey: string) => {
    if (planKey === "free") { router.push("/signup"); return; }
    setLoadingPlan(planKey);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (res.status === 401) {
        // Not logged in — send to signup with plan hint
        router.push(`/signup?plan=${planKey}`);
      } else {
        setToast(data.error || "Checkout failed. Please try again.");
        setTimeout(() => setToast(null), 4000);
      }
    } catch {
      setToast("Network error. Please try again.");
      setTimeout(() => setToast(null), 4000);
    } finally {
      setLoadingPlan(null);
    }
  };

  const bg           = dark ? "bg-[#1A1618]"                  : "bg-[#FDFBF8]";
  const header       = dark ? "bg-[#1A1618]/90 border-[#3A3540]" : "bg-white/80 border-[#EDE8E0]";
  const text         = dark ? "text-[#F0EBE8]"                : "text-[#2A2328]";
  const muted        = dark ? "text-[#9B9098]"                : "text-[#6B6068]";
  const cardBg       = dark ? "bg-[#242028] border-[#3A3540]" : "bg-white border-[#EDE8E0]";
  const footerBorder = dark ? "border-[#3A3540]"              : "border-[#EDE8E0]";
  const tableBorder  = dark ? "border-[#3A3540]"              : "border-[#EDE8E0]";
  const tableHead    = dark ? "bg-[#1E1B1F]"                  : "bg-[#FAF7F4]";
  const tableStripe  = dark ? "bg-[#1A1618]"                  : "bg-[#FDFBF8]";

  const displayPrice = (plan: typeof plans[0]) => {
    if (plan.isForever && plan.key === "free") return "€0";
    if (plan.isForever) return `€${annual ? plan.annualPrice : plan.monthlyPrice}`;
    return `€${annual ? plan.annualPrice : plan.monthlyPrice}`;
  };

  const displayPeriod = (plan: typeof plans[0]) => {
    if (plan.key === "free") return "forever";
    if (plan.isForever) return "one-time";
    return annual ? "/ mo, billed annually" : "/ month";
  };

  const cellValue = (val: string | boolean) => {
    if (val === true)  return <span className="text-[#C9956E] font-bold">✓</span>;
    if (val === false) return <span className={`${muted}`}>—</span>;
    return <span className={`text-xs font-medium ${text}`}>{val}</span>;
  };

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
            <DarkModeToggle />
            <Link href="/login"  className="px-4 py-2 text-sm font-medium rounded-lg border-2 border-[#C9956E] text-[#C9956E] hover:bg-[#C9956E] hover:text-white transition-colors">Sign in</Link>
            <Link href="/signup" className="px-4 py-2 bg-[#C9956E] hover:bg-[#B8845D] text-white text-sm font-medium rounded-lg transition-colors">Get Started Free</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-12 text-center">
        <h1 className={`font-playfair text-4xl md:text-5xl font-bold ${text} mb-4`}>
          Simple, honest <span className="text-[#C9956E]">pricing</span>
        </h1>
        <p className={`text-lg ${muted} max-w-xl mx-auto mb-10`}>
          Pay once and own it forever. No subscription surprises — except for the Planner pro plan.
        </p>

        {/* Annual / Monthly toggle */}
        <div className="inline-flex items-center gap-3">
          <span className={`text-sm font-medium ${!annual ? text : muted}`}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-12 h-6 rounded-full transition-colors ${annual ? "bg-[#C9956E]" : dark ? "bg-[#3A3540]" : "bg-[#DDD7D0]"}`}
            aria-label="Toggle annual billing"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${annual ? "translate-x-6" : ""}`}
            />
          </button>
          <span className={`text-sm font-medium ${annual ? text : muted}`}>
            Annual
            <span className="ml-2 px-2 py-0.5 bg-[#FDF4EC] border border-[#EDD5BC] text-[#C9956E] text-xs font-semibold rounded-full">
              Save 20%
            </span>
          </span>
        </div>
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
              {/* Badge: Most Popular takes precedence over other badge */}
              {plan.mostPopular ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#C9956E] text-white text-xs font-bold rounded-full whitespace-nowrap">
                  Most Popular
                </div>
              ) : plan.badge ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#C9956E] text-white text-xs font-bold rounded-full whitespace-nowrap">
                  {plan.badge}
                </div>
              ) : null}

              <div className="mb-4">
                <h2 className={`font-playfair text-xl font-bold ${text} mb-1`}>{plan.name}</h2>
                <p className={`text-xs ${muted} mb-3`}>{plan.desc}</p>
                <div className="flex items-baseline gap-1">
                  <span className={`font-playfair text-3xl font-bold ${text}`}>{displayPrice(plan)}</span>
                  <span className={`text-sm ${muted}`}>{displayPeriod(plan)}</span>
                </div>
                {annual && !plan.isForever && plan.key !== "free" && (
                  <p className="text-xs text-[#C9956E] mt-1">Billed €{plan.annualPrice * 12}/yr</p>
                )}
              </div>

              <ul className="flex-1 space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className={`flex items-start gap-2 text-sm ${muted}`}>
                    <span className="text-[#C9956E] mt-0.5 flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleBuy(plan.key)}
                disabled={loadingPlan === plan.key}
                className={`w-full text-center py-3 px-4 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                  plan.highlight
                    ? "bg-[#C9956E] hover:bg-[#B8845D] text-white"
                    : dark
                    ? "bg-[#2A2630] hover:bg-[#3A3540] text-[#F0EBE8] border border-[#3A3540]"
                    : "bg-[#FAF7F4] hover:bg-[#F0EAE2] text-[#2A2328] border border-[#EDE8E0]"
                }`}
              >
                {loadingPlan === plan.key ? "Redirecting…" : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* ── Feature Comparison Table ── */}
        <div className="mt-20">
          <h2 className={`font-playfair text-2xl font-bold ${text} text-center mb-8`}>Full feature comparison</h2>
          <div className={`rounded-2xl border ${cardBg} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`${tableHead} border-b ${tableBorder}`}>
                    <th className={`py-4 px-6 text-left font-semibold ${text} w-1/3`}>Feature</th>
                    {plans.map(p => (
                      <th key={p.key} className={`py-4 px-4 text-center font-semibold ${p.highlight ? "text-[#C9956E]" : text}`}>
                        {p.name}
                        {p.mostPopular && <span className="block text-[10px] font-normal text-[#C9956E]">Most Popular</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr key={row.label} className={`border-b ${tableBorder} ${i % 2 === 1 ? tableStripe : ""}`}>
                      <td className={`py-3 px-6 ${muted}`}>{row.label}</td>
                      <td className="py-3 px-4 text-center">{cellValue(row.free)}</td>
                      <td className="py-3 px-4 text-center">{cellValue(row.couple)}</td>
                      <td className="py-3 px-4 text-center">{cellValue(row.premium)}</td>
                      <td className="py-3 px-4 text-center">{cellValue(row.planner)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Billing FAQ ── */}
        <div className="mt-16">
          <h2 className={`font-playfair text-2xl font-bold ${text} text-center mb-8`}>Billing questions</h2>
          <div className="space-y-3 max-w-3xl mx-auto">
            {billingFaqs.map((faq, i) => (
              <div key={i} className={`rounded-2xl border ${cardBg} overflow-hidden`}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className={`w-full text-left px-6 py-4 flex items-center justify-between font-semibold text-sm ${text}`}
                >
                  {faq.q}
                  <span className={`ml-4 flex-shrink-0 text-[#C9956E] transition-transform duration-200 ${openFaq === i ? "rotate-45" : ""}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className={`px-6 pb-5 text-sm ${muted} leading-relaxed border-t ${dark ? "border-[#3A3540]" : "border-[#EDE8E0]"}`}>
                    <p className="pt-4">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* General questions teaser */}
        <div className={`mt-12 rounded-2xl border ${cardBg} p-8 text-center`}>
          <h3 className={`font-playfair text-2xl font-bold ${text} mb-3`}>Still have questions?</h3>
          <p className={`${muted} mb-6 max-w-lg mx-auto`}>
            All paid plans include lifetime updates and access. You can upgrade at any time —
            just pay the difference. Stripe handles all payments securely.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            {[
              { q: "Can I try before buying?", a: "Yes — the free plan and demo are always available." },
              { q: "Is there a refund policy?",  a: "30-day money-back guarantee, no questions asked." },
              { q: "Do prices include VAT?",     a: "Prices shown exclude VAT where applicable." },
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

      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "#2C2628", color: "#EDE8E3", padding: "12px 24px", borderRadius: 12,
          fontSize: 14, fontWeight: 600, zIndex: 999, whiteSpace: "nowrap",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)",
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
