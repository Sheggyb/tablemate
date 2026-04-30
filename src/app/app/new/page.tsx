"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const STEPS = ["Wedding Details", "Guest Count", "Quick Start", "All Set!"];

const PLAN_TIERS = [
  { max: 50,   label: "Free",       color: "#6B6068", badge: "bg-gray-100 text-gray-600",         desc: "Up to 50 guests" },
  { max: 150,  label: "Starter",    color: "#C9956E", badge: "bg-orange-100 text-orange-700",    desc: "Up to 150 guests · AI seating" },
  { max: 500,  label: "Pro",        color: "#8B5CF6", badge: "bg-purple-100 text-purple-700",    desc: "Up to 500 guests · Priority support" },
  { max: 9999, label: "Enterprise", color: "#0EA5E9", badge: "bg-sky-100 text-sky-700",          desc: "Unlimited guests · Dedicated support" },
];

function getPlan(count: number) {
  return PLAN_TIERS.find(t => count <= t.max) ?? PLAN_TIERS[PLAN_TIERS.length - 1];
}

export default function NewWeddingPage() {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", couple_names: "", date: "", venue_name: "", location: "" });
  const [guestCount, setGuestCount] = useState(80);
  const [startOption, setStartOption] = useState<"csv" | "manual" | "demo" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [weddingId, setWeddingId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("tm-theme");
    if (saved === "dark") setDark(true);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("tm-theme", next ? "dark" : "light");
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // ── Step 1 → 2 ──────────────────────────────────────────────────────────────
  const goStep2 = () => {
    if (!form.name.trim()) { setError("Please give your wedding a name."); return; }
    setError("");
    setStep(2);
  };

  // ── Step 2 → 3 ──────────────────────────────────────────────────────────────
  const goStep3 = () => setStep(3);

  // ── Step 3 → 4: Create the wedding then show confirmation ────────────────────
  const handleCreate = async (option: "csv" | "manual" | "demo") => {
    setStartOption(option);
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: wedding, error: we } = await supabase.from("weddings").insert({
      user_id:      user.id,
      name:         form.name.trim(),
      couple_names: form.couple_names.trim() || null,
      date:         form.date || null,
      location:     form.location.trim() || null,
    }).select().single();

    if (we || !wedding) { setError("Failed to create wedding. Please try again."); setLoading(false); return; }

    const venueName = form.venue_name.trim() || "Main Hall";
    await supabase.from("venues").insert({ wedding_id: wedding.id, name: venueName });

    setWeddingId(wedding.id);
    setLoading(false);
    setStep(4);
  };

  // ── Colours ──────────────────────────────────────────────────────────────────
  const bg        = dark ? "#1A1718" : "#FDFBF8";
  const cardBg    = dark ? "#2A2328" : "#ffffff";
  const cardBorder= dark ? "#3D3540" : "#EDE8E0";
  const textColor = dark ? "#F0EBE6" : "#2A2328";
  const subColor  = dark ? "#9B9098" : "#6B6068";
  const headerBg  = dark ? "#211E1F" : "#ffffff";
  const headerBorder = dark ? "#3D3540" : "#EDE8E0";
  const inputStyle = dark
    ? { background: "#2A2328", borderColor: "#3D3540", color: "#F0EBE6", colorScheme: "dark" as const }
    : { background: "#ffffff", borderColor: "#DDD7D0", color: "#2A2328", colorScheme: "light" as const };

  const plan = getPlan(guestCount);
  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div style={{ minHeight: "100vh", background: bg }}>
      {/* Header */}
      <header style={{ background: headerBg, borderBottom: `1px solid ${headerBorder}`, height: 64, display: "flex", alignItems: "center", padding: "0 24px" }}>
        <div style={{ maxWidth: 672, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/app" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ color: "#C9956E" }}>♥</span>
            <span style={{ color: textColor, fontWeight: 600, fontSize: 16 }}>TableMate</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={toggleDark} style={{ fontSize: 18, padding: "4px 8px", borderRadius: 8, background: dark ? "#3D3540" : "#F5F0EB", border: "none", cursor: "pointer" }}>
              {dark ? "☀️" : "🌙"}
            </button>
            {step < 4 && (
              <Link href="/app" style={{ fontSize: 14, color: subColor, textDecoration: "none" }}>← Cancel</Link>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 672, margin: "0 auto", padding: "48px 24px" }}>
        {/* Step labels */}
        <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
          {STEPS.map((label, i) => (
            <span key={label} style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: step === i + 1 ? "#C9956E" : step > i + 1 ? "#C9956E" : subColor, opacity: step > i + 1 ? 0.6 : 1 }}>
              {i + 1}. {label}
            </span>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, borderRadius: 99, background: dark ? "#3D3540" : "#EDE8E0", marginBottom: 36, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#C9956E,#D4A882)", borderRadius: 99, transition: "width 0.4s ease" }} />
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, padding: 32 }}>
          {error && (
            <div style={{ marginBottom: 20, padding: 12, background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 8, fontSize: 14, color: "#DC2626" }}>
              {error}
            </div>
          )}

          {/* ── STEP 1: Wedding Details ─────────────────────────────────────── */}
          {step === 1 && (
            <>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ color: textColor, fontSize: 26, fontWeight: 700, margin: 0 }}>Tell us about the wedding</h1>
                <p style={{ color: subColor, fontSize: 14, marginTop: 6 }}>You can always edit these details later inside the planner.</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <Field label="Wedding name *" hint="e.g. 'Smith & Johnson Wedding'" textColor={textColor} subColor={subColor}>
                  <input type="text" value={form.name} onChange={e => set("name", e.target.value)}
                    onKeyDown={e => e.key === "Enter" && goStep2()}
                    style={{ ...inputStyle, width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${inputStyle.borderColor}`, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    placeholder="Our Special Day" />
                </Field>
                <Field label="Couple names" hint="Shown to guests on RSVP invites" textColor={textColor} subColor={subColor}>
                  <input type="text" value={form.couple_names} onChange={e => set("couple_names", e.target.value)}
                    style={{ ...inputStyle, width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${inputStyle.borderColor}`, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    placeholder="Alex & Sam" />
                </Field>
                <Field label="Wedding date" textColor={textColor} subColor={subColor}>
                  <input type="date" value={form.date} onChange={e => set("date", e.target.value)}
                    style={{ ...inputStyle, width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${inputStyle.borderColor}`, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </Field>
                <Field label="Venue name" textColor={textColor} subColor={subColor}>
                  <input type="text" value={form.venue_name} onChange={e => set("venue_name", e.target.value)}
                    style={{ ...inputStyle, width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${inputStyle.borderColor}`, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    placeholder="Grand Hotel Ballroom" />
                </Field>
              </div>

              <button onClick={goStep2}
                style={{ marginTop: 28, width: "100%", padding: "14px 0", background: "#C9956E", color: "#fff", fontWeight: 600, fontSize: 15, borderRadius: 12, border: "none", cursor: "pointer" }}>
                Next: Guest Count →
              </button>
            </>
          )}

          {/* ── STEP 2: Guest Count ─────────────────────────────────────────── */}
          {step === 2 && (
            <>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ color: textColor, fontSize: 26, fontWeight: 700, margin: 0 }}>How many guests are you expecting?</h1>
                <p style={{ color: subColor, fontSize: 14, marginTop: 6 }}>This helps us recommend the right plan for you.</p>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <label style={{ fontSize: 14, fontWeight: 500, color: textColor }}>Estimated guest count</label>
                  <span style={{ fontSize: 22, fontWeight: 700, color: "#C9956E" }}>{guestCount}</span>
                </div>
                <input type="range" min={10} max={500} step={5} value={guestCount} onChange={e => setGuestCount(+e.target.value)}
                  style={{ width: "100%", accentColor: "#C9956E", cursor: "pointer" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: subColor, marginTop: 4 }}>
                  <span>10</span><span>250</span><span>500+</span>
                </div>
              </div>

              {/* Plan recommendation */}
              <div style={{ background: dark ? "#1A1718" : "#FDF8F5", border: `1px solid ${dark ? "#3D3540" : "#EDD5BC"}`, borderRadius: 12, padding: "16px 20px", marginBottom: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: subColor }}>Recommended plan</span>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: plan.label === "Free" ? (dark ? "#3D3540" : "#F5F0EB") : "#FDF4EC", color: plan.color }}>{plan.label}</span>
                </div>
                <p style={{ fontSize: 14, color: textColor, margin: 0, fontWeight: 500 }}>{plan.desc}</p>
                {plan.label !== "Free" && (
                  <p style={{ fontSize: 12, color: subColor, marginTop: 4 }}>
                    <Link href="/app/upgrade" style={{ color: "#C9956E", textDecoration: "none" }}>✨ View upgrade options →</Link>
                  </p>
                )}
              </div>

              {/* Tier overview */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
                {PLAN_TIERS.map(t => (
                  <div key={t.label} style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${t.label === plan.label ? "#C9956E" : (dark ? "#3D3540" : "#EDE8E0")}`, background: t.label === plan.label ? (dark ? "#2A2328" : "#FDF4EC") : "transparent", transition: "border-color 0.2s" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: t.color }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: subColor, marginTop: 2 }}>{t.desc}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setStep(1)} style={{ flex: "0 0 auto", padding: "14px 20px", background: "transparent", color: subColor, fontWeight: 500, fontSize: 14, borderRadius: 12, border: `1px solid ${cardBorder}`, cursor: "pointer" }}>← Back</button>
                <button onClick={goStep3} style={{ flex: 1, padding: "14px 0", background: "#C9956E", color: "#fff", fontWeight: 600, fontSize: 15, borderRadius: 12, border: "none", cursor: "pointer" }}>
                  Next: Quick Start →
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: Quick Start ─────────────────────────────────────────── */}
          {step === 3 && (
            <>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ color: textColor, fontSize: 26, fontWeight: 700, margin: 0 }}>How would you like to start?</h1>
                <p style={{ color: subColor, fontSize: 14, marginTop: 6 }}>Choose how to get your guest list going. You can switch methods anytime.</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
                {[
                  { key: "csv",    icon: "📥", title: "Import CSV",           desc: "Upload a spreadsheet of guests in seconds." },
                  { key: "manual", icon: "✏️",  title: "Add manually",         desc: "Type in guests one by one at your own pace." },
                  { key: "demo",   icon: "✨",  title: "Start with demo data", desc: "Explore with 50 sample guests already seated." },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => !loading && handleCreate(opt.key as "csv" | "manual" | "demo")}
                    disabled={loading}
                    style={{
                      display: "flex", alignItems: "center", gap: 16, padding: "18px 20px",
                      background: startOption === opt.key ? (dark ? "#3D3540" : "#FDF4EC") : (dark ? "#1A1718" : "#FDFBF8"),
                      border: `1px solid ${startOption === opt.key ? "#C9956E" : (dark ? "#3D3540" : "#EDE8E0")}`,
                      borderRadius: 12, cursor: loading ? "not-allowed" : "pointer", textAlign: "left",
                      transition: "all 0.15s", opacity: loading && startOption !== opt.key ? 0.5 : 1,
                    }}
                  >
                    <span style={{ fontSize: 28 }}>{opt.icon}</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: textColor }}>{opt.title}</div>
                      <div style={{ fontSize: 13, color: subColor, marginTop: 2 }}>{opt.desc}</div>
                    </div>
                    {loading && startOption === opt.key && (
                      <span style={{ marginLeft: "auto", fontSize: 13, color: subColor }}>Creating…</span>
                    )}
                  </button>
                ))}
              </div>

              <button onClick={() => setStep(2)} style={{ width: "100%", padding: "12px 0", background: "transparent", color: subColor, fontWeight: 500, fontSize: 14, borderRadius: 12, border: `1px solid ${cardBorder}`, cursor: "pointer" }}>← Back</button>
            </>
          )}

          {/* ── STEP 4: Confirmation ────────────────────────────────────────── */}
          {step === 4 && weddingId && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              {/* Confetti-like rings SVG */}
              <svg width="120" height="80" viewBox="0 0 120 80" fill="none" style={{ margin: "0 auto 24px", display: "block" }}>
                <circle cx="44" cy="40" r="26" stroke="#C9956E" strokeWidth="5" fill="none" />
                <circle cx="76" cy="40" r="26" stroke="#D4A882" strokeWidth="5" fill="none" />
                <circle cx="44" cy="40" r="26" stroke="#C9956E" strokeWidth="5" fill="none" strokeDasharray="3 6" strokeDashoffset="0">
                  <animate attributeName="stroke-dashoffset" from="0" to="36" dur="3s" repeatCount="indefinite" />
                </circle>
              </svg>

              <h1 style={{ color: textColor, fontSize: 28, fontWeight: 700, margin: "0 0 12px" }}>You&apos;re all set! 🎉</h1>
              <p style={{ color: subColor, fontSize: 15, maxWidth: 400, margin: "0 auto 28px", lineHeight: 1.6 }}>
                <strong style={{ color: textColor }}>{form.name}</strong> has been created.
                {startOption === "demo" && " We've added 50 sample guests to help you explore the planner."}
                {startOption === "csv" && " Head to the planner to import your guest CSV."}
                {startOption === "manual" && " Head to the planner to start adding your guests."}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 320, margin: "0 auto" }}>
                <Link href={`/app/wedding/${weddingId}`}
                  style={{ display: "block", padding: "15px 0", background: "#C9956E", color: "#fff", fontWeight: 700, fontSize: 15, borderRadius: 12, textDecoration: "none", textAlign: "center" }}>
                  Open Wedding Planner →
                </Link>
                <Link href="/app"
                  style={{ display: "block", padding: "13px 0", background: "transparent", color: subColor, fontWeight: 500, fontSize: 14, borderRadius: 12, textDecoration: "none", textAlign: "center", border: `1px solid ${cardBorder}` }}>
                  Back to Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Field({ label, hint, textColor, subColor, children }: { label: string; hint?: string; textColor: string; subColor: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: textColor, marginBottom: 4 }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 12, color: subColor, marginTop: 4 }}>{hint}</p>}
    </div>
  );
}
