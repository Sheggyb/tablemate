"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("tablemate_dark");
    if (saved === "1") setDark(true);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("tablemate_dark", next ? "1" : "0");
  };

  const bg = dark ? "bg-[#1A1618]" : "bg-[#FDFBF8]";
  const card = dark ? "bg-[#242028] border-[#3A3540]" : "bg-white border-[#EDE8E0]";
  const header = dark ? "bg-[#1A1618]/90 border-[#3A3540]" : "bg-white/80 border-[#EDE8E0]";
  const text = dark ? "text-[#F0EBE8]" : "text-[#2A2328]";
  const muted = dark ? "text-[#9B9098]" : "text-[#6B6068]";
  const featureBg = dark ? "bg-[#1E1B1F] border-[#3A3540]" : "bg-[#FDFBF8] border-[#EDE8E0]";
  const sectionBg = dark ? "bg-[#1E1B1F] border-[#3A3540]" : "bg-white border-[#EDE8E0]";
  const footerBg = dark ? "border-[#3A3540]" : "border-[#EDE8E0]";

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-200`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 ${header} backdrop-blur border-b`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#C9956E] text-xl">♥</span>
            <span className={`font-playfair text-xl font-semibold ${text}`}>TableMate</span>
          </div>
          <nav className={`hidden md:flex items-center gap-8 text-sm ${muted}`}>
            <a href="#features" className={`hover:${text} transition-colors`}>Features</a>
            <a href="#pricing" className={`hover:${text} transition-colors`}>Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={toggleDark} className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${dark ? "border-[#3A3540] bg-[#2A2630] text-yellow-300 hover:bg-[#3A3540]" : "border-[#EDE8E0] bg-white text-[#6B6068] hover:border-[#C9956E]"}`}>
              {dark ? "☀️" : "🌙"}
            </button>
            <Link href="/login" className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors ${dark ? "border-[#C9956E] text-[#C9956E] hover:bg-[#C9956E] hover:text-white" : "border-[#C9956E] text-[#C9956E] hover:bg-[#C9956E] hover:text-white"}`}>Sign in</Link>
            <Link href="/signup" className="px-4 py-2 bg-[#C9956E] hover:bg-[#B8845D] text-white text-sm font-medium rounded-lg transition-colors">
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FDF4EC] border border-[#EDD5BC] rounded-full text-xs text-[#C9956E] font-medium mb-8">
          ✨ Free to start — no credit card required
        </div>
        <h1 className={`font-playfair text-5xl md:text-6xl font-bold ${text} leading-tight mb-6`}>
          Your perfect wedding<br/>
          <span className="text-[#C9956E]">seating chart</span>
        </h1>
        <p className={`text-lg ${muted} max-w-2xl mx-auto mb-10 leading-relaxed`}>
          Drag-and-drop tables, manage 500+ guests, handle meal preferences,
          send RSVP invites, and export beautiful printable charts.
          All in one place.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/signup" className="px-8 py-4 bg-[#C9956E] hover:bg-[#B8845D] text-white font-semibold rounded-xl text-lg transition-colors shadow-lg shadow-[#C9956E]/20">
            Start Planning Free
          </Link>
          <Link href="/demo" className={`px-8 py-4 border ${dark ? "border-[#3A3540] hover:border-[#C9956E] text-[#F0EBE8]" : "border-[#DDD7D0] hover:border-[#C9956E] text-[#2A2328]"} font-semibold rounded-xl text-lg transition-colors`}>
            Try the Demo →
          </Link>
        </div>
        <p className={`mt-4 text-sm ${dark ? "text-[#6B6068]" : "text-[#9B9098]"}`}>Free forever for small weddings · No account needed to try</p>
      </section>

      {/* Features */}
      <section id="features" className={`${sectionBg} py-20 border-y`}>
        <div className="max-w-6xl mx-auto px-6">
          <h2 className={`font-playfair text-3xl font-bold ${text} text-center mb-4`}>Everything you need</h2>
          <p className={`${muted} text-center mb-16 max-w-xl mx-auto`}>Built specifically for wedding seating. No generic project management nonsense.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map(f => (
              <div key={f.title} className={`p-6 rounded-2xl border ${featureBg}`}>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className={`font-semibold ${text} mb-2`}>{f.title}</h3>
                <p className={`text-sm ${muted} leading-relaxed`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className={`py-20 ${bg}`}>
        <div className="max-w-6xl mx-auto px-6">
          <h2 className={`font-playfair text-3xl font-bold ${text} text-center mb-4`}>Simple pricing</h2>
          <p className={`${muted} text-center mb-16`}>Pay once, own it forever. No surprise monthly bills.</p>
          <div className="grid md:grid-cols-4 gap-6">
            {plans.map(plan => (
              <div key={plan.name} className={`p-6 rounded-2xl border ${plan.highlighted ? `border-[#C9956E] shadow-xl shadow-[#C9956E]/10 ${dark ? "bg-[#242028]" : "bg-white"} relative` : card}`}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#C9956E] text-white text-xs font-semibold rounded-full">Most Popular</div>
                )}
                <h3 className={`font-playfair text-xl font-bold ${text} mb-1`}>{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`text-3xl font-bold ${text}`}>{plan.price}</span>
                  {plan.period && <span className={`text-sm ${dark ? "text-[#6B6068]" : "text-[#9B9098]"}`}>{plan.period}</span>}
                </div>
                <p className={`text-xs ${dark ? "text-[#6B6068]" : "text-[#9B9098]"} mb-6`}>{plan.subtitle}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${dark ? "text-[#C0BAB8]" : "text-[#4A4348]"}`}>
                      <span className="text-[#C9956E]">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block w-full text-center py-3 rounded-lg font-medium text-sm transition-colors ${
                    plan.highlighted
                      ? 'bg-[#C9956E] hover:bg-[#B8845D] text-white'
                      : `border ${dark ? "border-[#3A3540] hover:border-[#C9956E] text-[#F0EBE8]" : "border-[#DDD7D0] hover:border-[#C9956E] text-[#2A2328]"}`
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t ${footerBg} py-8`}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#C9956E]">♥</span>
            <span className={`font-playfair font-semibold ${text}`}>TableMate</span>
          </div>
          <p className={`text-sm ${dark ? "text-[#6B6068]" : "text-[#9B9098]"}`}>© 2025 TableMate. Made with love for couples everywhere.</p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  { icon: "🍽️", title: "Drag & Drop Canvas", desc: "Place tables visually on your venue floor plan. Round, square, and banquet tables. Supports up to 500+ guests." },
  { icon: "📧", title: "RSVP Portal", desc: "Send personalized email invites. Guests confirm attendance and meal choice. Responses sync automatically to your chart." },
  { icon: "🤖", title: "AI Seating Optimizer", desc: "Let AI arrange your guests in seconds. Keeps families together, separates feuding relatives, respects all your rules." },
  { icon: "🤝", title: "Real-time Collaboration", desc: "Share a link with your partner or wedding planner. Edit together live with presence indicators." },
  { icon: "🥗", title: "Meal Management", desc: "Track dietary requirements per guest. Visual meal summary shows totals. Export for your caterer." },
  { icon: "🖨️", title: "Beautiful Exports", desc: "Print-ready seating charts, place cards, and table assignments. PDF export coming soon." },
];

const plans = [
  {
    name: "Free", price: "€0", period: "", subtitle: "Forever free", highlighted: false, cta: "Start for Free", href: "/signup",
    features: ["1 wedding", "Up to 50 guests", "Drag & drop chart", "CSV import", "Print export"],
  },
  {
    name: "Couple", price: "€29", period: "one-time", subtitle: "Pay once, yours forever", highlighted: true, cta: "Get Couple", href: "/signup?plan=couple",
    features: ["1 wedding", "Unlimited guests", "Cloud save & sync", "RSVP portal", "Share link", "PDF export"],
  },
  {
    name: "Premium", price: "€49", period: "one-time", subtitle: "Everything for your big day", highlighted: false, cta: "Get Premium", href: "/signup?plan=premium",
    features: ["1 wedding", "Unlimited guests", "Everything in Couple", "AI seating optimizer", "Live collaboration", "Custom floor plans"],
  },
  {
    name: "Planner", price: "€19", period: "/month", subtitle: "For wedding professionals", highlighted: false, cta: "Start Trial", href: "/signup?plan=planner",
    features: ["Unlimited weddings", "Client portals", "White-label option", "Multi-wedding dashboard", "Priority support"],
  },
];
