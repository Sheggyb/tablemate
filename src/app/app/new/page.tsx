     1|"use client";
     2|
     3|import { useState, useEffect } from "react";
     4|import { useRouter } from "next/navigation";
     5|import Link from "next/link";
     6|import { createClient } from "@/lib/supabase/client";
     7|
     8|export default function NewWeddingPage() {
     9|  const router = useRouter();
    10|  const [dark, setDark] = useState(false);
    11|  const [form, setForm] = useState({ name: "", couple_names: "", date: "", venue_name: "", location: "" });
    12|  const [loading, setLoading] = useState(false);
    13|  const [error, setError] = useState("");
    14|
    15|  useEffect(() => {
    16|    const saved = localStorage.getItem("tablemate-dark");
    17|    if (saved === "true") setDark(true);
    18|  }, []);
    19|
    20|  const toggleDark = () => {
    21|    const next = !dark;
    22|    setDark(next);
    23|    localStorage.setItem("tablemate-dark", String(next));
    24|  };
    25|
    26|  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
    27|
    28|  const handleCreate = async (e: React.FormEvent) => {
    29|    e.preventDefault();
    30|    if (!form.name.trim()) { setError("Please give your wedding a name."); return; }
    31|    setLoading(true);
    32|    setError("");
    33|
    34|    const supabase = createClient();
    35|    const { data: { user } } = await supabase.auth.getUser();
    36|    if (!user) { router.push("/login"); return; }
    37|
    38|    const { data: wedding, error: we } = await supabase.from("weddings").insert({
    39|      user_id:      user.id,
    40|      name:         form.name.trim(),
    41|      couple_names: form.couple_names.trim() || null,
    42|      date:         form.date || null,
    43|    }).select().single();
    44|
    45|    if (we || !wedding) { setError("Failed to create wedding. Please try again."); setLoading(false); return; }
    46|
    47|    const venueName = form.venue_name.trim() || "Main Hall";
    48|    await supabase.from("venues").insert({ wedding_id: wedding.id, name: venueName });
    49|
    50|    router.push(`/app/wedding/${wedding.id}`);
    51|  };
    52|
    53|  const bg = dark ? "bg-[#1A1718]" : "bg-[#FDFBF8]";
    54|  const card = dark ? "bg-[#2A2328] border-[#3D3540]" : "bg-white border-[#EDE8E0]";
    55|  const text = dark ? "text-[#F0EBE6]" : "text-[#2A2328]";
    56|  const sub = dark ? "text-[#9B9098]" : "text-[#6B6068]";
    57|  const header = dark ? "bg-[#211E1F] border-[#3D3540]" : "bg-white border-[#EDE8E0]";
    58|  const inputCls = "w-full px-3 py-2.5 rounded-lg border text-sm outline-none";
    59|  const inputStyle = dark
    60|    ? { background: "#1A1718", borderColor: "#3D3540", color: "#F0EBE6", colorScheme: "dark" as const }
    61|    : { background: "#ffffff", borderColor: "#DDD7D0", color: "#2A2328", colorScheme: "light" as const };
    65|
    66|  return (
    67|    <div className={`min-h-screen ${bg}`}>
    68|      <header className={`${header} border-b h-16 flex items-center px-6`}>
    69|        <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
    70|          <Link href="/app" className="flex items-center gap-2">
    71|            <span className="text-[#C9956E]">♥</span>
    72|            <span className={`font-playfair font-semibold ${text}`}>TableMate</span>
    73|          </Link>
    74|          <div className="flex items-center gap-3">
    75|            <button onClick={toggleDark} className={`text-lg px-2 py-1 rounded-lg ${dark ? "bg-[#3D3540]" : "bg-[#F5F0EB]"}`}>
    76|              {dark ? "☀️" : "🌙"}
    77|            </button>
    78|            <Link href="/app" className={`text-sm ${sub} hover:${text}`}>← Cancel</Link>
    79|          </div>
    80|        </div>
    81|      </header>
    82|
    83|      <main className="max-w-2xl mx-auto px-6 py-12">
    84|        <div className="mb-8">
    85|          <h1 className={`font-playfair text-3xl font-bold ${text}`}>Create a new wedding</h1>
    86|          <p className={`${sub} text-sm mt-1`}>Fill in what you know — you can edit everything inside the planner.</p>
    87|        </div>
    88|
    89|        <div className={`${card} rounded-2xl border p-8 shadow-sm`}>
    90|          {error && <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
    91|
    92|          <form onSubmit={handleCreate} className="space-y-6">
    93|            <Section title="The Basics" dark={dark}>
    94|              <Field label="Wedding name *" hint="e.g. 'Smith & Johnson Wedding'" dark={dark}>
    95|                <input type="text" value={form.name} onChange={e => set("name", e.target.value)} required className={inputCls} style={inputStyle} placeholder="Our Special Day"/>
    96|              </Field>
    97|              <Field label="Couple names" hint="Shown to guests on RSVP invites" dark={dark}>
    98|                <input type="text" value={form.couple_names} onChange={e => set("couple_names", e.target.value)} className={inputCls} style={inputStyle} placeholder="Alex & Sam"/>
    99|              </Field>
   100|              <Field label="Wedding date" dark={dark}>
   101|                <input type="date" value={form.date} onChange={e => set("date", e.target.value)} className={inputCls} style={inputStyle}/>
   102|              </Field>
   103|            </Section>
   104|
   105|            <Section title="Venue (optional)" dark={dark}>
   106|              <Field label="Venue name" dark={dark}>
   107|                <input type="text" value={form.venue_name} onChange={e => set("venue_name", e.target.value)} className={inputCls} style={inputStyle} placeholder="Grand Hotel Ballroom"/>
   108|              </Field>
   109|              <Field label="Location" dark={dark}>
   110|                <input type="text" value={form.location} onChange={e => set("location", e.target.value)} className={inputCls} style={inputStyle} placeholder="Stockholm, Sweden"/>
   111|              </Field>
   112|            </Section>
   113|
   114|            <button type="submit" disabled={loading}
   115|              className="w-full py-3.5 bg-[#C9956E] hover:bg-[#B8845D] disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm">
   116|              {loading ? "Creating…" : "Create Wedding & Open Planner →"}
   117|            </button>
   118|          </form>
   119|        </div>
   120|      </main>
   121|    </div>
   122|  );
   123|}
   124|
   125|function Section({ title, dark, children }: { title: string; dark: boolean; children: React.ReactNode }) {
   126|  return (
   127|    <div>
   128|      <h2 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${dark ? "text-[#6B6068]" : "text-[#9B9098]"}`}>{title}</h2>
   129|      <div className="space-y-4">{children}</div>
   130|    </div>
   131|  );
   132|}
   133|
   134|function Field({ label, hint, dark, children }: { label: string; hint?: string; dark: boolean; children: React.ReactNode }) {
   135|  return (
   136|    <div>
   137|      <label className={`block text-sm font-medium mb-1 ${dark ? "text-[#F0EBE6]" : "text-[#2A2328]"}`}>{label}</label>
   138|      {children}
   139|      {hint && <p className={`text-xs mt-1 ${dark ? "text-[#6B6068]" : "text-[#9B9098]"}`}>{hint}</p>}
   140|    </div>
   141|  );
   142|}
   143|