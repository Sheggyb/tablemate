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
    const saved = localStorage.getItem("tablemate-dark");
    if (saved === "true") setDark(true);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("tablemate-dark", String(next));
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

  const bg = dark ? "bg-[#1A1718]" : "bg-[#FDFBF8]";
  const card = dark ? "bg-[#2A2328] border-[#3D3540]" : "bg-white border-[#EDE8E0]";
  const text = dark ? "text-[#F0EBE6]" : "text-[#2A2328]";
  const sub = dark ? "text-[#9B9098]" : "text-[#6B6068]";
  const header = dark ? "bg-[#211E1F] border-[#3D3540]" : "bg-white border-[#EDE8E0]";
  const inputCls = dark
    ? "w-full px-3 py-2.5 rounded-lg border border-[#3D3540] bg-[#1A1718] text-[#F0EBE6] text-sm outline-none focus:border-[#C9956E]"
    : "w-full px-3 py-2.5 rounded-lg border border-[#DDD7D0] bg-white text-[#2A2328] text-sm outline-none focus:border-[#C9956E]";

  return (
    <div className={`min-h-screen ${bg}`}>
      <header className={`${header} border-b h-16 flex items-center px-6`}>
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-2">
            <span className="text-[#C9956E]">♥</span>
            <span className={`font-playfair font-semibold ${text}`}>TableMate</span>
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={toggleDark} className={`text-lg px-2 py-1 rounded-lg ${dark ? "bg-[#3D3540]" : "bg-[#F5F0EB]"}`}>
              {dark ? "☀️" : "🌙"}
            </button>
            <Link href="/app" className={`text-sm ${sub} hover:${text}`}>← Cancel</Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className={`font-playfair text-3xl font-bold ${text}`}>Create a new wedding</h1>
          <p className={`${sub} text-sm mt-1`}>Fill in what you know — you can edit everything inside the planner.</p>
        </div>

        <div className={`${card} rounded-2xl border p-8 shadow-sm`}>
          {error && <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

          <form onSubmit={handleCreate} className="space-y-6">
            <Section title="The Basics" dark={dark}>
              <Field label="Wedding name *" hint="e.g. 'Smith & Johnson Wedding'" dark={dark}>
                <input type="text" value={form.name} onChange={e => set("name", e.target.value)} required className={inputCls} placeholder="Our Special Day"/>
              </Field>
              <Field label="Couple names" hint="Shown to guests on RSVP invites" dark={dark}>
                <input type="text" value={form.couple_names} onChange={e => set("couple_names", e.target.value)} className={inputCls} placeholder="Alex & Sam"/>
              </Field>
              <Field label="Wedding date" dark={dark}>
                <input type="date" value={form.date} onChange={e => set("date", e.target.value)} className={inputCls}/>
              </Field>
            </Section>

            <Section title="Venue (optional)" dark={dark}>
              <Field label="Venue name" dark={dark}>
                <input type="text" value={form.venue_name} onChange={e => set("venue_name", e.target.value)} className={inputCls} placeholder="Grand Hotel Ballroom"/>
              </Field>
              <Field label="Location" dark={dark}>
                <input type="text" value={form.location} onChange={e => set("location", e.target.value)} className={inputCls} placeholder="Stockholm, Sweden"/>
              </Field>
            </Section>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-[#C9956E] hover:bg-[#B8845D] disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm">
              {loading ? "Creating…" : "Create Wedding & Open Planner →"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

function Section({ title, dark, children }: { title: string; dark: boolean; children: React.ReactNode }) {
  return (
    <div>
      <h2 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${dark ? "text-[#6B6068]" : "text-[#9B9098]"}`}>{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, dark, children }: { label: string; hint?: string; dark: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className={`block text-sm font-medium mb-1 ${dark ? "text-[#F0EBE6]" : "text-[#2A2328]"}`}>{label}</label>
      {children}
      {hint && <p className={`text-xs mt-1 ${dark ? "text-[#6B6068]" : "text-[#9B9098]"}`}>{hint}</p>}
    </div>
  );
}
