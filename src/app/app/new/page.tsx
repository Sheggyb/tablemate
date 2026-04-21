"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function NewWeddingPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    couple_names: "",
    date: "",
    venue_name: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Please give your wedding a name."); return; }
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Create wedding
    const { data: wedding, error: we } = await supabase.from("weddings").insert({
      user_id:      user.id,
      name:         form.name.trim(),
      couple_names: form.couple_names.trim() || null,
      date:         form.date || null,
    }).select().single();

    if (we || !wedding) { setError("Failed to create wedding. Please try again."); setLoading(false); return; }

    // Create default venue
    if (form.venue_name.trim()) {
      await supabase.from("venues").insert({
        wedding_id: wedding.id,
        name:       form.venue_name.trim(),
        location:   form.location.trim() || null,
      });
    }

    router.push(`/app/wedding/${wedding.id}`);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF8]">
      <header className="bg-white border-b border-[#EDE8E0] h-16 flex items-center px-6">
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-2">
            <span className="text-[#C9956E]">♥</span>
            <span className="font-playfair font-semibold text-[#2A2328]">TableMate</span>
          </Link>
          <Link href="/app" className="text-sm text-[#6B6068] hover:text-[#2A2328]">← Cancel</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="font-playfair text-3xl font-bold text-[#2A2328]">Plan a new wedding 💍</h1>
          <p className="text-[#6B6068] text-sm mt-1">You can change everything later.</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#EDE8E0] p-8 shadow-sm">
          {error && <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

          <form onSubmit={handleCreate} className="space-y-6">
            <Section title="The Basics">
              <Field label="Wedding name *" hint="e.g. 'Smith & Johnson Wedding'">
                <input type="text" value={form.name} onChange={e => set("name", e.target.value)} required
                  className="input" placeholder="Our Special Day"/>
              </Field>
              <Field label="Couple names" hint="Shown to guests on RSVP invites">
                <input type="text" value={form.couple_names} onChange={e => set("couple_names", e.target.value)}
                  className="input" placeholder="Alex & Sam"/>
              </Field>
              <Field label="Wedding date">
                <input type="date" value={form.date} onChange={e => set("date", e.target.value)}
                  className="input"/>
              </Field>
            </Section>

            <Section title="Venue (optional)">
              <Field label="Venue name">
                <input type="text" value={form.venue_name} onChange={e => set("venue_name", e.target.value)}
                  className="input" placeholder="Grand Hotel Ballroom"/>
              </Field>
              <Field label="Location">
                <input type="text" value={form.location} onChange={e => set("location", e.target.value)}
                  className="input" placeholder="Stockholm, Sweden"/>
              </Field>
            </Section>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-[#C9956E] hover:bg-[#B8845D] disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm">
              {loading ? "Creating…" : "Create Wedding & Open Planner →"}
            </button>
          </form>
        </div>
      </main>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #DDD7D0;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          background: white;
          color: #2A2328;
        }
        .input:focus { border-color: #C9956E; }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-[#9B9098] uppercase tracking-wider mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#2A2328] mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-[#9B9098] mt-1">{hint}</p>}
    </div>
  );
}
