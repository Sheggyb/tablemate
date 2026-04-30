"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AppDashboard() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("tm-theme") === "dark";
    return false;
  });
  const [weddings, setWeddings] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ctx, setCtx] = useState<{ x: number; y: number; wedding: any } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const ctxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  // close context menu on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ctxRef.current && !ctxRef.current.contains(e.target as Node)) setCtx(null); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const [{ data: prof }, { data: weds }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("weddings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setProfile(prof);
    setWeddings(weds ?? []);
    setLoading(false);
  }

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("tm-theme", next ? "dark" : "light");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const deleteWedding = async (id: string) => {
    setCtx(null);
    await supabase.from("weddings").delete().eq("id", id);
    setWeddings(prev => prev.filter(w => w.id !== id));
    setConfirmDeleteId(null);
  };

  const startRename = (w: any) => { setCtx(null); setRenaming({ id: w.id, name: w.name }); };

  const saveRename = async () => {
    if (!renaming) return;
    await supabase.from("weddings").update({ name: renaming.name }).eq("id", renaming.id);
    setWeddings(prev => prev.map(w => w.id === renaming.id ? { ...w, name: renaming.name } : w));
    setRenaming(null);
  };

  const bg = dark ? "bg-[#1A1618]" : "bg-[#FDFBF8]";
  const header = dark ? "bg-[#1A1618] border-[#3A3540]" : "bg-white border-[#EDE8E0]";
  const text = dark ? "text-[#F0EBE8]" : "text-[#2A2328]";
  const muted = dark ? "text-[#9B9098]" : "text-[#6B6068]";
  const card = dark ? "bg-[#242028] border-[#3A3540] hover:border-[#C9956E]" : "bg-white border-[#EDE8E0] hover:border-[#C9956E]";

  if (loading) return (
    <div className={`min-h-screen ${bg} flex items-center justify-center`}>
      <div className="text-[#C9956E] text-4xl animate-pulse">♥</div>
    </div>
  );

  const canCreate = profile?.plan !== "free" || weddings.length === 0;

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-200`}>
      {/* Header */}
      <header className={`${header} border-b sticky top-0 z-50`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#C9956E] text-xl">♥</span>
            <span className={`font-playfair text-xl font-semibold ${text}`}>TableMate</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleDark} className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${dark ? "border-[#3A3540] bg-[#2A2630] text-yellow-300 hover:bg-[#3A3540]" : "border-[#EDE8E0] bg-white text-[#6B6068] hover:border-[#C9956E]"}`}>
              {dark ? "☀️" : "🌙"}
            </button>
            {profile?.plan === "free" && (
              <Link href="/app/upgrade" className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 bg-[#FDF4EC] border border-[#EDD5BC] text-[#C9956E] text-xs font-semibold rounded-full hover:bg-[#FDE8D0] transition-colors">
                ✨ Upgrade
              </Link>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#C9956E] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {(profile?.full_name || profile?.email || "U")[0].toUpperCase()}
              </div>
              <span className={`hidden sm:block text-sm ${muted}`}>{profile?.full_name || profile?.email}</span>
            </div>
            <button onClick={signOut} className={`text-sm ${muted} hover:${text} transition-colors`}>Sign out</button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`font-playfair text-2xl font-bold ${text}`}>Your Weddings</h1>
            <p className={`text-sm ${muted} mt-1`}>
              {profile?.plan === "free" ? "Free plan · 1 wedding, up to 50 guests" : `${profile?.plan} plan`}
            </p>
          </div>
          {canCreate ? (
            <Link href="/app/new" className="px-4 py-2 bg-[#C9956E] hover:bg-[#B8845D] text-white text-sm font-semibold rounded-lg transition-colors">
              + New Wedding
            </Link>
          ) : (
            <Link href="/app/upgrade" className="px-4 py-2 bg-[#FDF4EC] border border-[#EDD5BC] text-[#C9956E] text-sm font-medium rounded-lg hover:bg-[#FDE8D0] transition-colors">
              ✨ Upgrade to add more
            </Link>
          )}
        </div>

        {weddings.length === 0 ? (
          <div className="flex flex-col items-center text-center py-20 px-4">
            {/* SVG Illustration – interlocked rings with flowers */}
            <svg width="180" height="120" viewBox="0 0 180 120" fill="none" className="mb-8 drop-shadow-sm" aria-hidden="true">
              {/* Left ring */}
              <circle cx="68" cy="60" r="36" stroke="#C9956E" strokeWidth="6" fill="none" />
              {/* Right ring */}
              <circle cx="112" cy="60" r="36" stroke="#D4A882" strokeWidth="6" fill="none" />
              {/* Tiny flower on left ring */}
              <g transform="translate(36,30)">
                {[0,60,120,180,240,300].map((deg, i) => (
                  <ellipse key={i} cx={Math.cos(deg * Math.PI/180) * 5} cy={Math.sin(deg * Math.PI/180) * 5} rx="4" ry="2.5" fill="#EDD5BC" transform={`rotate(${deg},0,0)`} />
                ))}
                <circle cx="0" cy="0" r="3" fill="#C9956E" />
              </g>
              {/* Tiny flower on right ring */}
              <g transform="translate(144,88)">
                {[0,60,120,180,240,300].map((deg, i) => (
                  <ellipse key={i} cx={Math.cos(deg * Math.PI/180) * 5} cy={Math.sin(deg * Math.PI/180) * 5} rx="4" ry="2.5" fill="#EDD5BC" transform={`rotate(${deg},0,0)`} />
                ))}
                <circle cx="0" cy="0" r="3" fill="#C9956E" />
              </g>
              {/* Small hearts */}
              <text x="86" y="65" fontSize="14" textAnchor="middle" fill="#C9956E">♥</text>
            </svg>

            <h2 className={`font-playfair text-3xl font-bold ${text} mb-3`}>Plan your perfect day</h2>
            <p className={`${muted} mb-8 max-w-sm mx-auto text-base leading-relaxed`}>
              Create your first wedding and let TableMate handle the seating chaos.
            </p>

            {/* Benefit bullets */}
            <ul className="mb-10 space-y-3 text-left max-w-xs w-full">
              {[
                { icon: "🪑", text: "AI-powered seating that respects your preferences" },
                { icon: "📩", text: "Beautiful RSVP links your guests will love" },
                { icon: "⚡", text: "Set up a full seating chart in minutes, not hours" },
              ].map(b => (
                <li key={b.icon} className="flex items-start gap-3">
                  <span className="text-xl leading-tight">{b.icon}</span>
                  <span className={`text-sm ${muted} leading-snug`}>{b.text}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/app/new"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#C9956E] hover:bg-[#B8845D] text-white font-semibold text-base rounded-xl transition-colors shadow-md hover:shadow-lg"
            >
              ✨ Create your first wedding
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {weddings.map(w => (
              <div
                key={w.id}
                className={`group relative ${card} rounded-2xl border transition-all hover:shadow-lg cursor-pointer`}
                onContextMenu={e => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY, wedding: w }); }}
              >
                <Link href={`/app/wedding/${w.id}`} className="block p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-[#FDF4EC] rounded-xl flex items-center justify-center text-xl">💍</div>
                    <span className={`text-xs ${muted}`}>{w.date ? new Date(w.date).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "Date TBD"}</span>
                  </div>
                  <h3 className={`font-playfair font-semibold ${text} text-lg mb-1 group-hover:text-[#C9956E] transition-colors`}>{w.name}</h3>
                  {w.couple_names && <p className={`text-sm ${muted}`}>{w.couple_names}</p>}
                  <div className={`mt-4 pt-4 border-t ${dark ? "border-[#3A3540]" : "border-[#EDE8E0]"} flex items-center gap-2 text-xs ${muted}`}>
                    <span>Right-click for options · Open planner →</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Right-click context menu */}
        {ctx && (
          <div
            ref={ctxRef}
            style={{ top: ctx.y, left: ctx.x }}
            className={`fixed z-50 rounded-xl shadow-2xl border py-1 min-w-[160px] ${dark ? "bg-[#242028] border-[#3A3540] text-[#F0EBE8]" : "bg-white border-[#EDE8E0] text-[#2A2328]"}`}
          >
            <button onClick={() => startRename(ctx.wedding)} className="w-full px-4 py-2 text-sm text-left hover:bg-[#C9956E]/10 flex items-center gap-2">
              ✏️ Rename
            </button>
            <Link href={`/app/wedding/${ctx.wedding.id}`} onClick={() => setCtx(null)} className="w-full px-4 py-2 text-sm text-left hover:bg-[#C9956E]/10 flex items-center gap-2 block">
              📋 Open planner
            </Link>
            <div className={`my-1 border-t ${dark ? "border-[#3A3540]" : "border-[#EDE8E0]"}`} />
            <button onClick={() => { setCtx(null); setConfirmDeleteId(ctx.wedding.id); }} className="w-full px-4 py-2 text-sm text-left hover:bg-red-500/10 text-red-500 flex items-center gap-2">
              🗑️ Delete
            </button>
          </div>
        )}

        {/* Rename modal */}
        {renaming && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className={`rounded-2xl p-6 w-80 shadow-2xl border ${dark ? "bg-[#242028] border-[#3A3540]" : "bg-white border-[#EDE8E0]"}`}>
              <h3 className={`font-playfair font-semibold text-lg mb-4 ${text}`}>Rename Wedding</h3>
              <input
                autoFocus
                value={renaming.name}
                onChange={e => setRenaming({ ...renaming, name: e.target.value })}
                onKeyDown={e => { if (e.key === "Enter") saveRename(); if (e.key === "Escape") setRenaming(null); }}
                className={`w-full px-3 py-2 rounded-lg border text-sm mb-4 outline-none focus:border-[#C9956E] ${dark ? "bg-[#1A1618] border-[#3A3540] text-[#F0EBE8]" : "bg-white border-[#EDE8E0] text-[#2A2328]"}`}
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setRenaming(null)} className={`px-4 py-2 text-sm rounded-lg border ${dark ? "border-[#3A3540] text-[#9B9098] hover:bg-[#3A3540]" : "border-[#EDE8E0] text-[#6B6068] hover:bg-[#F5F0EB]"} transition-colors`}>Cancel</button>
                <button onClick={saveRename} className="px-4 py-2 text-sm rounded-lg bg-[#C9956E] hover:bg-[#B8845D] text-white font-semibold transition-colors">Save</button>
              </div>
            </div>
          </div>
        )}
        {/* Delete confirmation dialog */}
        {confirmDeleteId && (() => {
          const w = weddings.find(w => w.id === confirmDeleteId);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className={`rounded-2xl p-6 w-80 shadow-2xl border ${dark ? "bg-[#242028] border-[#3A3540]" : "bg-white border-[#EDE8E0]"}`}>
                <h3 className={`font-playfair font-semibold text-lg mb-2 ${text}`}>Delete Wedding?</h3>
                <p className={`text-sm ${muted} mb-6`}>Are you sure you want to delete <span className={`font-medium ${text}`}>&ldquo;{w?.name}&rdquo;</span>? This cannot be undone.</p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setConfirmDeleteId(null)} className={`px-4 py-2 text-sm rounded-lg border transition-colors ${dark ? "border-[#3A3540] text-[#9B9098] hover:bg-[#3A3540]" : "border-[#EDE8E0] text-[#6B6068] hover:bg-[#F5F0EB]"}`}>Cancel</button>
                  <button onClick={() => deleteWedding(confirmDeleteId)} className="px-4 py-2 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors">Delete</button>
                </div>
              </div>
            </div>
          );
        })()}
      </main>
      <footer className={`border-t ${dark ? "border-[#3A3540]" : "border-[#EDE8E0]"} py-6 mt-auto`}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#C9956E]">♥</span>
            <span className={`font-semibold text-sm ${dark ? "text-white" : "text-[#1a1a1a]"}`}>TableMate</span>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-xs ${dark ? "text-[#6B6068]" : "text-[#9B9098]"}`}>© 2025 TableMate</span>
            <Link href="/privacy" className={`text-xs ${dark ? "text-[#6B6068] hover:text-[#9B9098]" : "text-[#9B9098] hover:text-[#6B6068]"} transition-colors`}>Privacy</Link>
            <Link href="/terms" className={`text-xs ${dark ? "text-[#6B6068] hover:text-[#9B9098]" : "text-[#9B9098] hover:text-[#6B6068]"} transition-colors`}>Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
