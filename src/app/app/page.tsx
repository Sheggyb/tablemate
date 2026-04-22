"use client";
import { useState, useEffect } from "react";
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

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

  const deleteWedding = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    await supabase.from("weddings").delete().eq("id", id);
    setWeddings(prev => prev.filter(w => w.id !== id));
    setDeletingId(null);
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
          <div className="text-center py-20">
            <div className="text-6xl mb-4">💍</div>
            <h2 className={`font-playfair text-2xl font-bold ${text} mb-2`}>Plan your perfect day</h2>
            <p className={`${muted} mb-8 max-w-sm mx-auto`}>Create your first wedding to start building your seating chart.</p>
            <Link href="/app/new" className="inline-block px-6 py-3 bg-[#C9956E] hover:bg-[#B8845D] text-white font-semibold rounded-xl transition-colors">
              Create Your Wedding
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {weddings.map(w => (
              <div key={w.id} className={`group relative ${card} rounded-2xl border transition-all hover:shadow-lg`}>
                <Link href={`/app/wedding/${w.id}`} className="block p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-[#FDF4EC] rounded-xl flex items-center justify-center text-xl">💍</div>
                    <span className={`text-xs ${muted}`}>{w.date ? new Date(w.date).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "Date TBD"}</span>
                  </div>
                  <h3 className={`font-playfair font-semibold ${text} text-lg mb-1 group-hover:text-[#C9956E] transition-colors`}>{w.name}</h3>
                  {w.couple_names && <p className={`text-sm ${muted}`}>{w.couple_names}</p>}
                  <div className={`mt-4 pt-4 border-t ${dark ? "border-[#3A3540]" : "border-[#EDE8E0]"} flex items-center gap-2 text-xs ${muted}`}>
                    <span>Open planner →</span>
                  </div>
                </Link>
                {/* Delete button */}
                <button
                  onClick={() => deleteWedding(w.id, w.name)}
                  disabled={deletingId === w.id}
                  className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center text-xs transition-all"
                  title="Delete wedding"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
