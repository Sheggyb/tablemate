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
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className={`font-playfair text-3xl font-bold ${text} mb-4`}>Simple pricing</h2>
          <p className={`${muted} mb-12`}>Pay once, own it forever. No surprise monthly bills.</p>

          {/* Coming soon card */}
          <div className={`relative rounded-3xl border border-[#C9956E] shadow-xl shadow-[#C9956E]/10 p-10 ${dark ? "bg-[#242028]" : "bg-white"}`}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#C9956E] text-white text-xs font-semibold rounded-full tracking-wide">Coming Soon</div>

            <div className="text-5xl mb-4">💍</div>
            <h3 className={`font-playfair text-2xl font-bold ${text} mb-3`}>Pricing is on the way</h3>
            <p className={`${muted} mb-8 max-w-md mx-auto leading-relaxed`}>
              We&apos;re still working out the details to make sure it&apos;s fair and simple.
              One thing is certain — <span className="text-[#C9956E] font-medium">you&apos;ll pay once and own it forever.</span> No subscriptions, no surprise bills.
            </p>

            {/* Teaser features */}
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: "🆓", label: "Free tier", desc: "Always free to get started" },
                { icon: "💳", label: "One-time payment", desc: "Pay once, yours forever" },
                { icon: "🎯", label: "Fair pricing", desc: "Built for real couples" },
              ].map(item => (
                <div key={item.label} className={`rounded-xl p-4 ${dark ? "bg-[#1A181C]" : "bg-[#FAF7F5]"}`}>
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className={`text-sm font-semibold ${text} mb-0.5`}>{item.label}</div>
                  <div className={`text-xs ${muted}`}>{item.desc}</div>
                </div>
              ))}
            </div>

            <p className={`text-xs ${muted} mb-6`}>In the meantime, everything is completely free during our beta.</p>

            <Link
              href="/signup"
              className="inline-block px-8 py-3 bg-[#C9956E] hover:bg-[#B8845D] text-white font-medium rounded-lg transition-colors"
            >
              Get Started Free →
            </Link>
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


