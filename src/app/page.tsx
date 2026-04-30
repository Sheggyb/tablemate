"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

const features = [
  { icon: "🍽️", title: "Drag & Drop Canvas", desc: "Place tables visually on your venue floor plan. Round, square, and banquet tables. Supports 500+ guests with ease." },
  { icon: "📧", title: "RSVP Portal", desc: "Send personalized email invites. Guests confirm attendance and meal choice — responses sync automatically to your chart." },
  { icon: "✨", title: "Smart Seating", desc: "Auto-arrange guests in seconds. Keeps families together, separates feuding relatives, and respects all your custom rules." },
  { icon: "🖨️", title: "Beautiful Exports", desc: "Print-ready seating charts, place cards, and table assignments. Share a PDF with your caterer or venue in one click." },
];

const reviews = [
  { quote: "TableMate made our 280-person wedding feel totally manageable. We had our chart done in an afternoon!", author: "Sophie & James", location: "London, UK" },
  { quote: "The drag-and-drop is so intuitive. We rearranged tables a dozen times and it never felt like a chore.", author: "Maria & Carlos", location: "Madrid, Spain" },
  { quote: "Our wedding planner was blown away when we showed her the printable chart. Absolutely worth it.", author: "Priya & Rohan", location: "Toronto, Canada" },
];

const faqs = [
  {
    q: "Is TableMate really free to start?",
    a: "Yes — the free plan supports up to 50 guests with no credit card required. You can plan your entire wedding and only upgrade if you need more.",
  },
  {
    q: "How many guests can I manage?",
    a: "The free tier supports up to 50 guests. Paid plans unlock unlimited guests, multiple venue floors, CSV import, and advanced export options.",
  },
  {
    q: "Can my partner or wedding planner collaborate with me?",
    a: "Absolutely. Share a live link with your partner, planner, or anyone else — changes sync in real time with presence indicators.",
  },
  {
    q: "Do guests need to create an account to RSVP?",
    a: "No. Guests receive a personalized link and can confirm attendance, choose a meal, and leave a message — completely account-free.",
  },
  {
    q: "What happens to my data after the wedding?",
    a: "Your seating chart and guest data stay in your account indefinitely. You can export everything at any time and delete your data whenever you like.",
  },
];

export default function LandingPage() {
  const [dark, setDark] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("tm-theme");
    if (saved === "dark") setDark(true);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("tm-theme", next ? "dark" : "light");
  };

  const bg        = dark ? "bg-[#1A1618]"               : "bg-[#FDFBF8]";
  const card      = dark ? "bg-[#242028] border-[#3A3540]" : "bg-white border-[#EDE8E0]";
  const header    = dark ? "bg-[#1A1618]/90 border-[#3A3540]" : "bg-white/80 border-[#EDE8E0]";
  const text      = dark ? "text-[#F0EBE8]"             : "text-[#2A2328]";
  const muted     = dark ? "text-[#9B9098]"             : "text-[#6B6068]";
  const featureBg = dark ? "bg-[#1E1B1F] border-[#3A3540]" : "bg-[#FDFBF8] border-[#EDE8E0]";
  const sectionBg = dark ? "bg-[#1E1B1F] border-[#3A3540]" : "bg-white border-[#EDE8E0]";
  const footerBg  = dark ? "border-[#3A3540]"           : "border-[#EDE8E0]";
  const altBg     = dark ? "bg-[#242028]"               : "bg-[#FAF7F4]";

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
            <a href="/#features" className="hover:text-[#C9956E] transition-colors">Features</a>
            <a href="/#reviews"  className="hover:text-[#C9956E] transition-colors">Reviews</a>
            <a href="/#faq"      className="hover:text-[#C9956E] transition-colors">FAQ</a>
            <Link href="/pricing" className="hover:text-[#C9956E] transition-colors">Pricing</Link>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleDark}
              className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${
                dark
                  ? "border-[#3A3540] bg-[#2A2630] text-yellow-300 hover:bg-[#3A3540]"
                  : "border-[#EDE8E0] bg-white text-[#6B6068] hover:border-[#C9956E]"
              }`}
            >
              {dark ? "☀️" : "🌙"}
            </button>
            <Link href="/login"  className="px-4 py-2 text-sm font-medium rounded-lg border-2 border-[#C9956E] text-[#C9956E] hover:bg-[#C9956E] hover:text-white transition-colors">Sign in</Link>
            <Link href="/signup" className="px-4 py-2 bg-[#C9956E] hover:bg-[#B8845D] text-white text-sm font-medium rounded-lg transition-colors">Get Started Free</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FDF4EC] border border-[#EDD5BC] rounded-full text-xs text-[#C9956E] font-medium mb-8">
          ✨ Free to start — no credit card required
        </div>
        <h1 className={`font-playfair text-5xl md:text-6xl font-bold ${text} leading-tight mb-6`}>
          Plan Your Perfect Wedding<br/>
          <span className="text-[#C9956E]">Seating — Free</span>
        </h1>
        <p className={`text-lg ${muted} max-w-2xl mx-auto mb-10 leading-relaxed`}>
          Drag-and-drop tables, manage 500+ guests, handle meal preferences,
          send RSVP invites, and export beautiful printable charts — all in one place.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap mb-4">
          <Link href="/signup"   className="px-8 py-4 bg-[#C9956E] hover:bg-[#B8845D] text-white font-semibold rounded-xl text-lg transition-colors shadow-lg shadow-[#C9956E]/20">
            Start Planning Free
          </Link>
          <Link href="/app/demo" className={`px-8 py-4 border ${dark ? "border-[#3A3540] hover:border-[#C9956E] text-[#F0EBE8]" : "border-[#DDD7D0] hover:border-[#C9956E] text-[#2A2328]"} font-semibold rounded-xl text-lg transition-colors`}>
            Try the Demo →
          </Link>
        </div>
        <p className={`text-sm ${dark ? "text-[#6B6068]" : "text-[#9B9098]"}`}>Free forever for small weddings · No account needed to try</p>
      </section>

      {/* ── Social Proof ── */}
      <section id="reviews" className={`${sectionBg} py-20 border-y`}>
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-[#C9956E] font-semibold text-sm uppercase tracking-widest mb-3">Loved by couples worldwide</p>
          <h2 className={`font-playfair text-3xl font-bold ${text} mb-2`}>2,400+ couples already planning</h2>
          <p className={`${muted} mb-12`}>Join thousands of soon-to-be-weds who said goodbye to spreadsheet chaos.</p>

          {/* Stars + count */}
          <div className="flex items-center justify-center gap-2 mb-12">
            <span className="text-yellow-400 text-xl tracking-tight">★★★★★</span>
            <span className={`text-sm font-semibold ${text}`}>4.9 / 5</span>
            <span className={`text-sm ${muted}`}>from 380+ reviews</span>
          </div>

          {/* Review cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map(r => (
              <div key={r.author} className={`p-6 rounded-2xl border ${card} text-left`}>
                <div className="text-yellow-400 text-sm mb-3">★★★★★</div>
                <p className={`text-sm ${muted} leading-relaxed mb-4`}>&ldquo;{r.quote}&rdquo;</p>
                <div>
                  <p className={`text-sm font-semibold ${text}`}>{r.author}</p>
                  <p className={`text-xs ${muted}`}>{r.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className={`py-20 ${bg}`}>
        <div className="max-w-6xl mx-auto px-6">
          <h2 className={`font-playfair text-3xl font-bold ${text} text-center mb-4`}>Everything you need</h2>
          <p className={`${muted} text-center mb-16 max-w-xl mx-auto`}>Built specifically for wedding seating. No generic project management nonsense.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* ── Mid-page CTA ── */}
      <section className={`${sectionBg} border-y py-16`}>
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className={`font-playfair text-3xl font-bold ${text} mb-4`}>Ready to seat your guests in style?</h2>
          <p className={`${muted} mb-8`}>Start for free — upgrade only when you need more. No credit card required.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/signup"   className="px-8 py-4 bg-[#C9956E] hover:bg-[#B8845D] text-white font-semibold rounded-xl text-lg transition-colors shadow-lg shadow-[#C9956E]/20">
              Get Started Free
            </Link>
            <Link href="/app/demo" className={`px-8 py-4 border ${dark ? "border-[#3A3540] hover:border-[#C9956E] text-[#F0EBE8]" : "border-[#DDD7D0] hover:border-[#C9956E] text-[#2A2328]"} font-semibold rounded-xl text-lg transition-colors`}>
              Try the Demo →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className={`py-20 ${bg}`}>
        <div className="max-w-3xl mx-auto px-6">
          <h2 className={`font-playfair text-3xl font-bold ${text} text-center mb-4`}>Frequently asked questions</h2>
          <p className={`${muted} text-center mb-12`}>Still have questions? <a href="mailto:hello@tablemate.app" className="text-[#C9956E] hover:underline">Drop us a line</a>.</p>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className={`rounded-2xl border ${card} overflow-hidden`}>
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
      </section>

      {/* Footer */}
      <footer className={`border-t ${footerBg} py-8`}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#C9956E]">♥</span>
            <span className={`font-playfair font-semibold ${text}`}>TableMate</span>
          </div>
          <div className="flex items-center gap-4">
            <p className={`text-sm ${dark ? "text-[#6B6068]" : "text-[#9B9098]"}`}>© 2025 TableMate. Made with love for couples everywhere.</p>
            <Link href="/privacy" className={`text-sm ${dark ? "text-[#6B6068] hover:text-[#9B9098]" : "text-[#9B9098] hover:text-[#6B6068]"} transition-colors`}>Privacy</Link>
            <Link href="/terms"   className={`text-sm ${dark ? "text-[#6B6068] hover:text-[#9B9098]" : "text-[#9B9098] hover:text-[#6B6068]"} transition-colors`}>Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
