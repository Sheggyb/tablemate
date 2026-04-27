"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function NewWeddingPage() {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [form, setForm] = useState({ name: "", couple_names: "", date: "", venue_name: "", location: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Please give your wedding a name."); return; }
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
    }).select().single();

    if (we || !wedding) { setError("Failed to create wedding. Please try again."); setLoading(false); return; }

    const venueName = form.venue_name.trim() || "Main Hall";
    await supabase.from("venues").insert({ wedding_id: wedding.id, name: venueName });

    router.push(`/app/wedding/${wedding.id}`);
  };

  const bg = dark ? "#1A1718" : "#FDFBF8";
  const cardBg = dark ? "#2A2328" : "#ffffff";
  const cardBorder = dark ? "#3D3540" : "#EDE8E0";
  const textColor = dark ? "#F0EBE6" : "#2A2328";
  const subColor = dark ? "#9B9098" : "#6B6068";
  const headerBg = dark ? "#211E1F" : "#ffffff";
  const headerBorder = dark ? "#3D3540" : "#EDE8E0";
  const inputStyle = dark
    ? { background: "#2A2328", borderColor: "#3D3540", color: "#F0EBE6", colorScheme: "dark" as const }
    : { background: "#ffffff", borderColor: "#DDD7D0", color: "#2A2328", colorScheme: "light" as const };

  return (
    <div style={{ minHeight: "100vh", background: bg }}>
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
            <Link href="/app" style={{ fontSize: 14, color: subColor, textDecoration: "none" }}>← Cancel</Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 672, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: textColor, fontSize: 30, fontWeight: 700, margin: 0 }}>Create a new wedding</h1>
          <p style={{ color: subColor, fontSize: 14, marginTop: 4 }}>Fill in what you know — you can edit everything inside the planner.</p>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, padding: 32 }}>
          {error && <div style={{ marginBottom: 20, padding: 12, background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 8, fontSize: 14, color: "#DC2626" }}>{error}</div>}

          <form onSubmit={handleCreate}>
            <Section title="The Basics" textColor={textColor} subColor={subColor}>
              <Field label="Wedding name *" hint="e.g. 'Smith & Johnson Wedding'" textColor={textColor} subColor={subColor}>
                <input type="text" value={form.name} onChange={e => set("name", e.target.value)} required
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
            </Section>

            <div style={{ height: 1, background: cardBorder, margin: "24px 0" }} />

            <Section title="Venue (optional)" textColor={textColor} subColor={subColor}>
              <Field label="Venue name" textColor={textColor} subColor={subColor}>
                <input type="text" value={form.venue_name} onChange={e => set("venue_name", e.target.value)}
                  style={{ ...inputStyle, width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${inputStyle.borderColor}`, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  placeholder="Grand Hotel Ballroom" />
              </Field>
              <Field label="Location" textColor={textColor} subColor={subColor}>
                <input type="text" value={form.location} onChange={e => set("location", e.target.value)}
                  style={{ ...inputStyle, width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${inputStyle.borderColor}`, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  placeholder="Stockholm, Sweden" />
              </Field>
            </Section>

            <div style={{ marginTop: 32 }}>
              <button type="submit" disabled={loading}
                style={{ width: "100%", padding: "14px 0", background: loading ? "#D4A88A" : "#C9956E", color: "#fff", fontWeight: 600, fontSize: 15, borderRadius: 12, border: "none", cursor: loading ? "not-allowed" : "pointer", transition: "background 0.2s" }}>
                {loading ? "Creating…" : "Create Wedding & Open Planner →"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function Section({ title, textColor, subColor, children }: { title: string; textColor: string; subColor: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <h2 style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: subColor, marginBottom: 16 }}>{title}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>
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
