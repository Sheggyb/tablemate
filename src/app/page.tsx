"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

/* ── Seating Chart Mockup ── */
function SeatingChartMockup({ dark }: { dark: boolean }) {
  const tables = [
    { id: 1, cx: 130, cy: 120, label: "Table 1", seats: [
      { angle: 0,   color: "#C9956E" },
      { angle: 60,  color: "#A8C5A0" },
      { angle: 120, color: "#C9956E" },
      { angle: 180, color: "#E8B4A0" },
      { angle: 240, color: "#A8C5A0" },
      { angle: 300, color: "#C9956E" },
    ]},
    { id: 2, cx: 310, cy: 120, label: "Table 2", seats: [
      { angle: 0,   color: "#A8C5A0" },
      { angle: 60,  color: "#C9956E" },
      { angle: 120, color: "#E8B4A0" },
      { angle: 180, color: "#C9956E" },
      { angle: 240, color: "#A8C5A0" },
      { angle: 300, color: "#E8B4A0" },
    ]},
    { id: 3, cx: 130, cy: 270, label: "Table 3", seats: [
      { angle: 0,   color: "#E8B4A0" },
      { angle: 60,  color: "#C9956E" },
      { angle: 120, color: "#A8C5A0" },
      { angle: 180, color: "#C9956E" },
      { angle: 240, color: "#E8B4A0" },
      { angle: 300, color: "#A8C5A0" },
    ]},
    { id: 4, cx: 310, cy: 270, label: "Table 4", seats: [
      { angle: 30,  color: "#C9956E" },
      { angle: 90,  color: "#A8C5A0" },
      { angle: 150, color: "#C9956E" },
      { angle: 210, color: "#E8B4A0" },
      { angle: 270, color: "#A8C5A0" },
      { angle: 330, color: "#C9956E" },
    ]},
  ];

  const panelBg  = dark ? "#1E1B1F" : "#FDFBF8";
  const panelBorder = dark ? "#3A3540" : "#EDE8E0";
  const canvasBg = dark ? "#161316" : "#F5F0EB";
  const tableFill = dark ? "#2A2630" : "#FFFFFF";
  const tableStroke = dark ? "#4A4450" : "#DDD7D0";
  const labelColor = dark ? "#9B9098" : "#6B6068";
  const tickBg = dark ? "#2A2630" : "#FFFFFF";

  return (
    <div className="relative w-full max-w-[480px] mx-auto select-none" aria-hidden="true">
      {/* Browser chrome */}
      <div
        className="rounded-2xl overflow-hidden shadow-2xl border"
        style={{ borderColor: panelBorder, background: panelBg }}
      >
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: panelBorder }}>
          <span className="w-3 h-3 rounded-full bg-red-400 opacity-80" />
          <span className="w-3 h-3 rounded-full bg-yellow-400 opacity-80" />
          <span className="w-3 h-3 rounded-full bg-green-400 opacity-80" />
          <div className="flex-1 mx-3 h-5 rounded-md text-xs flex items-center px-2 opacity-50" style={{ background: canvasBg, color: labelColor }}>
            tablemate.app/app/demo
          </div>
        </div>

        {/* App chrome: sidebar + canvas */}
        <div className="flex" style={{ minHeight: 340 }}>
          {/* Sidebar */}
          <div className="w-28 border-r flex-shrink-0 p-3 flex flex-col gap-2" style={{ borderColor: panelBorder, background: panelBg }}>
            <p className="text-xs font-semibold mb-1" style={{ color: labelColor }}>Guest List</p>
            {[
              { name: "Alice & Bob",  color: "#C9956E" },
              { name: "Chen Family", color: "#A8C5A0" },
              { name: "Rivera +2",   color: "#E8B4A0" },
              { name: "Patel Party", color: "#C9956E" },
              { name: "Kim & Lee",   color: "#A8C5A0" },
            ].map((g, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs" style={{ background: canvasBg }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: g.color }} />
                <span className="truncate" style={{ color: labelColor }}>{g.name}</span>
              </div>
            ))}
          </div>

          {/* Canvas */}
          <div className="flex-1 relative overflow-hidden" style={{ background: canvasBg }}>
            <svg viewBox="0 0 440 390" className="w-full h-full" style={{ minHeight: 310 }}>
              {/* Grid dots */}
              {Array.from({ length: 10 }).map((_, row) =>
                Array.from({ length: 14 }).map((_, col) => (
                  <circle
                    key={`${row}-${col}`}
                    cx={col * 34 + 10} cy={row * 40 + 10}
                    r={1} fill={dark ? "#3A3540" : "#DDD7D0"} opacity={0.5}
                  />
                ))
              )}

              {tables.map((t) => {
                const R = 36; // table radius
                const sr = 10; // seat radius offset from table edge
                return (
                  <g key={t.id}>
                    {/* Seats */}
                    {t.seats.map((s, si) => {
                      const rad = (s.angle * Math.PI) / 180;
                      const sx = t.cx + (R + sr) * Math.cos(rad);
                      const sy = t.cy + (R + sr) * Math.sin(rad);
                      return (
                        <circle key={si} cx={sx} cy={sy} r={7} fill={s.color} opacity={0.9}>
                          <animate
                            attributeName="opacity"
                            values="0.9;0.65;0.9"
                            dur={`${2.4 + si * 0.3}s`}
                            repeatCount="indefinite"
                            begin={`${si * 0.15}s`}
                          />
                          <animate
                            attributeName="r"
                            values="7;7.8;7"
                            dur={`${2.4 + si * 0.3}s`}
                            repeatCount="indefinite"
                            begin={`${si * 0.15}s`}
                          />
                        </circle>
                      );
                    })}
                    {/* Table circle */}
                    <circle cx={t.cx} cy={t.cy} r={R} fill={tableFill} stroke={tableStroke} strokeWidth={1.5} />
                    <text x={t.cx} y={t.cy - 6} textAnchor="middle" fontSize={9} fill={labelColor} fontWeight="600">{t.label}</text>
                    <text x={t.cx} y={t.cy + 7} textAnchor="middle" fontSize={8} fill={labelColor} opacity={0.7}>{t.seats.length} seats</text>
                  </g>
                );
              })}

              {/* Dragging guest card animation */}
              <g>
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="220,330; 230,260; 248,200; 250,145"
                  keyTimes="0;0.3;0.6;1"
                  dur="3s"
                  repeatCount="indefinite"
                  calcMode="spline"
                  keySplines="0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1"
                />
                <rect x={-38} y={-14} width={76} height={26} rx={6}
                  fill={dark ? "#2A2630" : "#FFFFFF"}
                  stroke="#C9956E" strokeWidth={1.5}
                  style={{ filter: "drop-shadow(0 2px 6px rgba(201,149,110,0.35))" }}
                />
                <circle cx={-22} cy={0} r={5} fill="#C9956E" />
                <rect x={-12} y={-4} width={38} height={4} rx={2} fill={dark ? "#4A4450" : "#DDD7D0"} />
                <rect x={-12} y={3} width={24} height={3} rx={1.5} fill={dark ? "#3A3540" : "#EDE8E0"} />
              </g>

              {/* Tick badge on table 2 */}
              <g transform="translate(342, 90)">
                <circle r={11} fill={tickBg} stroke="#A8C5A0" strokeWidth={1.5} />
                <text textAnchor="middle" y={4} fontSize={11} fill="#A8C5A0">✓</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Status bar */}
        <div className="px-4 py-2 border-t flex items-center gap-3 text-xs" style={{ borderColor: panelBorder, color: labelColor }}>
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <span>24 / 50 guests seated</span>
          <span className="ml-auto">4 tables · 2 unassigned</span>
        </div>
      </div>

      {/* Floating decorative badge */}
      <div
        className="absolute -bottom-4 -left-4 px-3 py-2 rounded-xl border shadow-lg text-xs font-semibold hidden sm:flex items-center gap-2"
        style={{ background: panelBg, borderColor: panelBorder, color: "#C9956E" }}
      >
        🎉 Drag & drop ready
      </div>
    </div>
  );
}

const BASE_URL = "https://tablemate-beta.vercel.app";

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TableMate",
  url: BASE_URL,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  description:
    "Free wedding seating chart planner. Drag-and-drop tables, manage 500+ guests, collect RSVPs, track meal preferences, and export beautiful printable charts — all in one place.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free plan available for up to 50 guests. No credit card required.",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "380",
    bestRating: "5",
    worstRating: "1",
  },
  featureList: [
    "Drag-and-drop seating chart builder",
    "RSVP collection and management",
    "Guest list management for 500+ guests",
    "Meal preference and dietary tracking",
    "Real-time collaboration",
    "Printable and exportable charts",
    "Shareable venue coordinator link",
  ],
  screenshot: `${BASE_URL}/og-image.png`,
  softwareVersion: "1.0",
  author: {
    "@type": "Organization",
    name: "TableMate",
    url: BASE_URL,
  },
};

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
  const [mobileBanner, setMobileBanner] = useState(true);

  // Build FAQPage JSON-LD from faqs array
  const faqPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

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
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd) }}
      />
      {/* Canonical URL */}
      <link rel="canonical" href={BASE_URL} />
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
            <Link href="/blog"    className="hover:text-[#C9956E] transition-colors">Blog</Link>
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

      {/* Mobile desktop banner */}
      {mobileBanner && (
        <div className="md:hidden flex items-center justify-between gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-sm">
          <span>💻 <strong>Best experienced on desktop</strong> — full drag-and-drop on a bigger screen.</span>
          <button
            onClick={() => setMobileBanner(false)}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-amber-200 transition-colors font-bold text-amber-600"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left: text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FDF4EC] border border-[#EDD5BC] rounded-full text-xs text-[#C9956E] font-medium mb-8">
              ✨ Free to start — no credit card required
            </div>
            <h1 className={`font-playfair text-5xl md:text-6xl font-bold ${text} leading-tight mb-6`}>
              Seat Every Guest Perfectly.<br/>
              <span className="text-[#C9956E]">No Stress. No Spreadsheets.</span>
            </h1>
            <p className={`text-lg ${muted} max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed`}>
              Turn the most dreaded part of wedding planning into a 10-minute task.
              Drag guests into tables, track dietary needs, collect RSVPs, and share
              export-ready charts with your venue — all free.
            </p>
            <div className="flex items-center justify-center lg:justify-start gap-4 flex-wrap mb-4">
              <Link href="/signup"   className="px-8 py-4 bg-[#C9956E] hover:bg-[#B8845D] text-white font-semibold rounded-xl text-lg transition-colors shadow-lg shadow-[#C9956E]/20">
                Start Planning Free
              </Link>
              <Link href="/app/demo" className={`px-8 py-4 border ${dark ? "border-[#3A3540] hover:border-[#C9956E] text-[#F0EBE8]" : "border-[#DDD7D0] hover:border-[#C9956E] text-[#2A2328]"} font-semibold rounded-xl text-lg transition-colors`}>
                Try the Demo →
              </Link>
            </div>
            <p className={`text-sm ${dark ? "text-[#6B6068]" : "text-[#9B9098]"}`}>Free forever for small weddings · No account needed to try</p>
          </div>

          {/* Right: animated mockup */}
          <div className="hidden md:flex flex-1 items-center justify-center lg:justify-end">
            <SeatingChartMockup dark={dark} />
          </div>
        </div>
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
          <div className="space-y-3" itemScope itemType="https://schema.org/FAQPage">
            {faqs.map((faq, i) => (
              <div key={i} className={`rounded-2xl border ${card} overflow-hidden`} itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className={`w-full text-left px-6 py-4 flex items-center justify-between font-semibold text-sm ${text}`}
                >
                  <span itemProp="name">{faq.q}</span>
                  <span className={`ml-4 flex-shrink-0 text-[#C9956E] transition-transform duration-200 ${openFaq === i ? "rotate-45" : ""}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className={`px-6 pb-5 text-sm ${muted} leading-relaxed border-t ${dark ? "border-[#3A3540]" : "border-[#EDE8E0]"}`} itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                    <p className="pt-4" itemProp="text">{faq.a}</p>
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
