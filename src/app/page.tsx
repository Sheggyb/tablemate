import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF8]">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-[#EDE8E0]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#C9956E] text-xl">♥</span>
            <span className="font-playfair text-xl font-semibold text-[#2A2328]">TableMate</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-[#6B6068]">
            <a href="#features" className="hover:text-[#2A2328] transition-colors">Features</a>
            <a href="#pricing" className="hover:text-[#2A2328] transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[#6B6068] hover:text-[#2A2328] transition-colors">Sign in</Link>
            <Link href="/signup" className="px-4 py-2 bg-[#C9956E] hover:bg-[#B8845D] text-white text-sm font-medium rounded-lg transition-colors">
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FDF4EC] border border-[#EDD5BC] rounded-full text-xs text-[#C9956E] font-medium mb-8">
          ✨ Free to start — no credit card required
        </div>
        <h1 className="font-playfair text-5xl md:text-6xl font-bold text-[#2A2328] leading-tight mb-6">
          Your perfect wedding<br/>
          <span className="text-[#C9956E]">seating chart</span>
        </h1>
        <p className="text-lg text-[#6B6068] max-w-2xl mx-auto mb-10 leading-relaxed">
          Drag-and-drop tables, manage 500+ guests, handle meal preferences,
          send RSVP invites, and export beautiful printable charts.
          All in one place.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/signup" className="px-8 py-4 bg-[#C9956E] hover:bg-[#B8845D] text-white font-semibold rounded-xl text-lg transition-colors shadow-lg shadow-[#C9956E]/20">
            Start Planning Free
          </Link>
          <Link href="/app/demo" className="px-8 py-4 border border-[#DDD7D0] hover:border-[#C9956E] text-[#2A2328] font-semibold rounded-xl text-lg transition-colors">
            Try the Demo →
          </Link>
        </div>
        <p className="mt-4 text-sm text-[#9B9098]">Free forever for small weddings · No account needed to try</p>
      </section>

      {/* ── Feature highlights ── */}
      <section id="features" className="bg-white py-20 border-y border-[#EDE8E0]">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-playfair text-3xl font-bold text-[#2A2328] text-center mb-4">Everything you need</h2>
          <p className="text-[#6B6068] text-center mb-16 max-w-xl mx-auto">Built specifically for wedding seating. No generic project management nonsense.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map(f => (
              <div key={f.title} className="p-6 rounded-2xl border border-[#EDE8E0] bg-[#FDFBF8]">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-[#2A2328] mb-2">{f.title}</h3>
                <p className="text-sm text-[#6B6068] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-playfair text-3xl font-bold text-[#2A2328] text-center mb-4">Simple pricing</h2>
          <p className="text-[#6B6068] text-center mb-16">Pay once, own it forever. No surprise monthly bills.</p>
          <div className="grid md:grid-cols-4 gap-6">
            {plans.map(plan => (
              <div key={plan.name} className={`p-6 rounded-2xl border ${plan.highlighted ? 'border-[#C9956E] shadow-xl shadow-[#C9956E]/10 bg-white relative' : 'border-[#EDE8E0] bg-white'}`}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#C9956E] text-white text-xs font-semibold rounded-full">Most Popular</div>
                )}
                <h3 className="font-playfair text-xl font-bold text-[#2A2328] mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold text-[#2A2328]">{plan.price}</span>
                  {plan.period && <span className="text-sm text-[#9B9098]">{plan.period}</span>}
                </div>
                <p className="text-xs text-[#9B9098] mb-6">{plan.subtitle}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[#4A4348]">
                      <span className="text-[#C9956E]">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block w-full text-center py-3 rounded-lg font-medium text-sm transition-colors ${
                    plan.highlighted
                      ? 'bg-[#C9956E] hover:bg-[#B8845D] text-white'
                      : 'border border-[#DDD7D0] hover:border-[#C9956E] text-[#2A2328]'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#EDE8E0] py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#C9956E]">♥</span>
            <span className="font-playfair font-semibold text-[#2A2328]">TableMate</span>
          </div>
          <p className="text-sm text-[#9B9098]">© 2025 TableMate. Made with love for couples everywhere.</p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  { icon: "🪑", title: "Drag & Drop Canvas", desc: "Place tables visually on your venue floor plan. Round, square, and banquet tables. Supports up to 500+ guests." },
  { icon: "📧", title: "RSVP Portal", desc: "Send personalized email invites. Guests confirm attendance and meal choice. Responses sync automatically to your chart." },
  { icon: "🤖", title: "AI Seating Optimizer", desc: "Let AI arrange your guests in seconds. Keeps families together, separates feuding relatives, respects all your rules." },
  { icon: "🤝", title: "Real-time Collaboration", desc: "Share a link with your partner or wedding planner. Edit together live with presence indicators." },
  { icon: "🍽️", title: "Meal Management", desc: "Track dietary requirements per guest. Visual meal summary shows totals. Export for your caterer." },
  { icon: "🖨️", title: "Beautiful Exports", desc: "Print-ready seating charts, place cards, and table assignments. PDF export coming soon." },
];

const plans = [
  {
    name: "Free",
    price: "€0",
    period: "",
    subtitle: "Forever free",
    highlighted: false,
    cta: "Start for Free",
    href: "/signup",
    features: ["1 wedding", "Up to 50 guests", "Drag & drop chart", "CSV import", "Print export"],
  },
  {
    name: "Couple",
    price: "€29",
    period: "one-time",
    subtitle: "Pay once, yours forever",
    highlighted: true,
    cta: "Get Couple",
    href: "/signup?plan=couple",
    features: ["1 wedding", "Unlimited guests", "Cloud save & sync", "RSVP portal", "Share link", "PDF export"],
  },
  {
    name: "Premium",
    price: "€49",
    period: "one-time",
    subtitle: "Everything for your big day",
    highlighted: false,
    cta: "Get Premium",
    href: "/signup?plan=premium",
    features: ["1 wedding", "Unlimited guests", "Everything in Couple", "AI seating optimizer", "Live collaboration", "Custom floor plans"],
  },
  {
    name: "Planner",
    price: "€19",
    period: "/month",
    subtitle: "For wedding professionals",
    highlighted: false,
    cta: "Start Trial",
    href: "/signup?plan=planner",
    features: ["Unlimited weddings", "Client portals", "White-label option", "Multi-wedding dashboard", "Priority support"],
  },
];
