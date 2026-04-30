"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface Guest {
  id: string;
  first_name: string;
  last_name?: string | null;
  table_id?: string | null;
  meal?: string | null;
}

interface Table {
  id: string;
  name: string;
  capacity: number;
}

interface Wish {
  id: string;
  name: string;
  message: string;
  created_at: string;
}

interface Wedding {
  id: string;
  name: string;
  date?: string | null;
  couple_names?: string | null;
}

type Tab = "seat" | "wish" | "wall";

// ── Color tokens (wedding-themed) ──────────────────────────────────────
const C = {
  cream:       "#FAF6F0",
  creamDark:   "#F5EEE8",
  sage:        "#7A9E7E",
  sageDark:    "#5A7E5E",
  sageLight:   "#EDF7ED",
  rose:        "#C4848E",
  roseDark:    "#A86470",
  roseLight:   "#FDF0F2",
  gold:        "#C9956E",
  goldLight:   "#FDF4EC",
  white:       "#FFFFFF",
  border:      "#EDE4DC",
  text:        "#2A1F24",
  muted:       "#8B7878",
  mutedLight:  "#C8B8B8",
  surface:     "#FFFFFF",
  inputBg:     "#FDFAF8",
};

// 40 confetti pieces
const CONFETTI = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  color: [C.rose, C.sage, C.gold, "#E8C4A0", "#A8C4A8", "#D4849C", "#F0D0B8", "#8AB4A8"][i % 8],
  shape: ["circle","square","rect"][i % 3],
  left:  (i * 97 + 13) % 100,
  delay: (i * 137) % 3000,
  dur:   2400 + (i * 89) % 1600,
  size:  6 + (i % 5) * 2,
  rot:   (i * 53) % 360,
}));

function Confetti() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:999, overflow:"hidden" }}>
      {CONFETTI.map(p => (
        <div key={p.id} style={{
          position:"absolute", top:"-20px", left:`${p.left}%`,
          width: p.shape === "rect" ? p.size * 2.5 : p.size, height: p.size,
          borderRadius: p.shape === "circle" ? "50%" : 2,
          background: p.color, opacity:0,
          animation: `confettiFall ${p.dur}ms ${p.delay}ms ease-in forwards`,
          transform: `rotate(${p.rot}deg)`,
        }} />
      ))}
      <style>{`
        @keyframes confettiFall {
          0%   { transform:translateY(0) rotate(0deg) scale(1); opacity:1; }
          80%  { opacity:1; }
          100% { transform:translateY(110vh) rotate(720deg) scale(0.5); opacity:0; }
        }
      `}</style>
    </div>
  );
}

const MEAL_OPTIONS = [
  { value:"meat",       label:"Meat",       icon:"🍖" },
  { value:"fish",       label:"Fish",        icon:"🐟" },
  { value:"vegan",      label:"Vegan",       icon:"🥗" },
  { value:"vegetarian", label:"Vegetarian",  icon:"🌿" },
];

const mealLabel: Record<string, string> = {
  meat:"🍖 Meat", fish:"🐟 Fish", vegan:"🥗 Vegan", vegetarian:"🌿 Vegetarian",
  standard:"🍽 Standard", "gluten-free":"🌾 Gluten-Free", halal:"☪️ Halal", kosher:"✡️ Kosher", children:"👶 Children's",
};

export default function GuestPortal({ params }: { params: Promise<{ shareCode: string }> }) {
  const supabase = createClient();
  const [shareCode, setShareCode] = useState("");

  useEffect(() => { params.then(p => setShareCode(p.shareCode)); }, []);

  const [wedding, setWedding]   = useState<Wedding | null>(null);
  const [guests, setGuests]     = useState<Guest[]>([]);
  const [tables, setTables]     = useState<Table[]>([]);
  const [wishes, setWishes]     = useState<Wish[]>([]);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("seat");

  // Table lookup
  const [search, setSearch]         = useState("");
  const [foundGuest, setFoundGuest] = useState<Guest | null>(null);
  const [searched, setSearched]     = useState(false);

  // Wish form
  const [wishName, setWishName] = useState("");
  const [wishMsg, setWishMsg]   = useState("");
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const wallRef    = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!shareCode) return;
    async function load() {
      const { data: w } = await supabase
        .from("weddings")
        .select("id, name, date, couple_names")
        .eq("share_code", shareCode)
        .single();

      if (!w) { setNotFound(true); setLoading(false); return; }
      setWedding(w);

      const [gRes, tRes, wRes] = await Promise.all([
        supabase.from("guests").select("id,first_name,last_name,table_id,meal").eq("wedding_id", w.id),
        supabase.from("tables").select("id,name,capacity").in("venue_id",
          (await supabase.from("venues").select("id").eq("wedding_id", w.id)).data?.map((v: { id: string }) => v.id) ?? []
        ),
        supabase.from("wishes").select("*").eq("wedding_id", w.id).order("created_at", { ascending: false }),
      ]);

      setGuests(gRes.data ?? []);
      setTables(tRes.data ?? []);
      setWishes(wRes.data ?? []);
      setLoading(false);

      if (channelRef.current) supabase.removeChannel(channelRef.current);
      const channel = supabase
        .channel(`wishes-guest-${w.id}-${Date.now()}`)
        .on("postgres_changes", { event:"*", schema:"public", table:"wishes", filter:`wedding_id=eq.${w.id}` },
          (payload) => {
            if (payload.eventType === "INSERT") {
              const wish = payload.new as Wish;
              setWishes(prev => [wish, ...prev]);
              setNewIds(prev => new Set([...prev, wish.id]));
              setTimeout(() => setNewIds(prev => { const s = new Set(prev); s.delete(wish.id); return s; }), 3000);
              setTimeout(() => wallRef.current?.scrollTo({ top:0, behavior:"smooth" }), 50);
            } else if (payload.eventType === "DELETE") {
              const deletedId = (payload.old as Partial<Wish>).id;
              if (deletedId) {
                setWishes(prev => prev.filter(w => w.id !== deletedId));
              } else {
                supabase.from("wishes").select("*").eq("wedding_id", w.id).order("created_at", { ascending:false })
                  .then(({ data }) => { if (data) setWishes(data as Wish[]); });
              }
            }
          })
        .subscribe();
      channelRef.current = channel;
    }
    load();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [shareCode]);

  function doSearch() {
    setSearched(true);
    const q = search.trim().toLowerCase();
    if (!q) return;
    const match = guests.find(g =>
      `${g.first_name} ${g.last_name ?? ""}`.toLowerCase().includes(q) ||
      g.first_name.toLowerCase().includes(q) ||
      (g.last_name ?? "").toLowerCase().includes(q)
    );
    setFoundGuest(match ?? null);
    if (match) setWishName(`${match.first_name}${match.last_name ? " " + match.last_name : ""}`);
  }

  async function sendWish() {
    if (!wishName.trim() || !wishMsg.trim() || !wedding) return;
    setSending(true);
    await supabase.from("wishes").insert({
      id: crypto.randomUUID(),
      wedding_id: wedding.id,
      name: wishName.trim(),
      message: wishMsg.trim(),
    });
    setWishMsg("");
    setSent(true);
    setShowConfetti(true);
    setSending(false);
    setTimeout(() => setSent(false), 4000);
    setTimeout(() => setShowConfetti(false), 5000);
    setActiveTab("wall");
    setTimeout(() => wallRef.current?.scrollTo({ top:0, behavior:"smooth" }), 200);
  }

  const foundTable = foundGuest?.table_id ? tables.find(t => t.id === foundGuest.table_id) : null;

  if (loading) return (
    <div style={{ minHeight:"100dvh", background:C.cream, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:16, animation:"spin 3s linear infinite" }}>💍</div>
        <p style={{ color:C.muted, fontFamily:"Georgia, serif", fontSize:15 }}>Loading your portal…</p>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight:"100dvh", background:C.cream, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, padding:24, fontFamily:"Georgia, serif" }}>
      <div style={{ fontSize:52 }}>💔</div>
      <h1 style={{ color:C.text, fontSize:22, fontWeight:700, margin:0 }}>Link not found</h1>
      <p style={{ color:C.muted, textAlign:"center", fontSize:14, maxWidth:280 }}>This wedding portal doesn't exist or the link has changed.</p>
    </div>
  );

  return (
    <div style={{
      minHeight: "100dvh",
      background: `linear-gradient(160deg, ${C.cream} 0%, ${C.creamDark} 60%, #EFE4DE 100%)`,
      color: C.text,
      fontFamily: "Georgia, 'Times New Roman', serif",
      display: "flex",
      flexDirection: "column",
    }}>
      {showConfetti && <Confetti />}

      {/* ── Hero Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #C4848E 0%, #D4849C 45%, #C9956E 100%)",
        padding: "32px 20px 24px",
        textAlign: "center",
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:150, height:150, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }} />
        <div style={{ position:"absolute", bottom:-30, left:-30, width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        <div style={{ fontSize:36, marginBottom:8, position:"relative" }}>💍</div>
        <h1 style={{ color:"#fff", fontSize:24, fontWeight:700, margin:"0 0 6px", letterSpacing:"-0.2px", position:"relative" }}>
          {wedding?.couple_names ?? wedding?.name}
        </h1>
        {wedding?.date && (
          <p style={{ color:"rgba(255,255,255,0.82)", fontSize:13, margin:0, position:"relative" }}>
            {new Date(wedding.date).toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
          </p>
        )}
      </div>

      {/* ── Tab Bar ── */}
      <div style={{
        background: C.white,
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        flexShrink: 0,
        boxShadow: "0 2px 10px rgba(180,140,120,0.08)",
      }}>
        {([
          { key:"seat" as Tab, emoji:"🪑", label:"Find Seat" },
          { key:"wish" as Tab, emoji:"💌", label:"Leave Wish" },
          { key:"wall" as Tab, emoji:"🌸", label:`Wall${wishes.length > 0 ? ` (${wishes.length})` : ""}` },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              flex:1, padding:"14px 8px",
              background: activeTab === tab.key ? C.roseLight : "transparent",
              border:"none", cursor:"pointer",
              borderBottom: activeTab === tab.key ? `3px solid ${C.rose}` : "3px solid transparent",
              color: activeTab === tab.key ? C.rose : C.muted,
              fontWeight: activeTab === tab.key ? 700 : 400,
              fontSize:12, display:"flex", flexDirection:"column", alignItems:"center", gap:4,
              transition:"all 0.2s", fontFamily:"Georgia, serif",
            }}>
            <span style={{ fontSize:22 }}>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div style={{ flex:1, overflowY:"auto", padding:"20px 16px", maxWidth:520, margin:"0 auto", width:"100%", boxSizing:"border-box" }}>

        {/* ══ FIND MY SEAT ══ */}
        {activeTab === "seat" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ background:C.white, borderRadius:20, border:`1px solid ${C.border}`, overflow:"hidden", boxShadow:"0 4px 20px rgba(180,140,120,0.1)" }}>
              <div style={{ background:"linear-gradient(135deg, #F5EEE8, #F8F0EC)", padding:"20px 20px 16px", borderBottom:`1px solid ${C.border}` }}>
                <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:C.text }}>🪑 Find Your Seat</h2>
                <p style={{ margin:"5px 0 0", fontSize:13, color:C.muted, lineHeight:1.5 }}>Search your name below to see where you're seated</p>
              </div>
              <div style={{ padding:20, display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ display:"flex", gap:8 }}>
                  <input
                    value={search}
                    onChange={e => { setSearch(e.target.value); setSearched(false); setFoundGuest(null); }}
                    onKeyDown={e => e.key === "Enter" && doSearch()}
                    placeholder="Your name…"
                    style={{
                      flex:1, padding:"14px 16px", borderRadius:12, border:`1.5px solid ${C.border}`,
                      background:C.inputBg, color:C.text, fontSize:15, outline:"none",
                      fontFamily:"Georgia, serif",
                    }}
                  />
                  <button onClick={doSearch}
                    style={{
                      padding:"14px 20px", borderRadius:12,
                      background:`linear-gradient(135deg, ${C.rose}, ${C.gold})`,
                      color:"#fff", fontWeight:700, fontSize:14, border:"none", cursor:"pointer",
                      boxShadow:"0 4px 15px rgba(196,132,142,0.35)",
                      fontFamily:"Georgia, serif",
                    }}>
                    Search
                  </button>
                </div>

                {searched && !foundGuest && search.trim() && (
                  <div style={{ padding:"14px 16px", borderRadius:12, background:"#FEF2F4", border:`1px solid ${C.rose}40`, color:C.roseDark, fontSize:13 }}>
                    😕 Couldn't find "{search}" — try a different spelling
                  </div>
                )}

                {foundGuest && (
                  <div style={{ padding:20, borderRadius:16, background:C.roseLight, border:`1.5px solid ${C.rose}`, display:"flex", flexDirection:"column", gap:10 }}>
                    {foundTable ? (
                      <>
                        <div style={{ color:C.rose, fontWeight:700, fontSize:22, textAlign:"center" }}>
                          🎉 You're at {foundTable.name}!
                        </div>
                        {foundGuest.meal && (
                          <div style={{ color:C.muted, fontSize:14, textAlign:"center" }}>
                            Meal: {mealLabel[foundGuest.meal] ?? foundGuest.meal}
                          </div>
                        )}
                        <button onClick={() => { setActiveTab("wish"); setWishName(`${foundGuest.first_name}${foundGuest.last_name ? " " + foundGuest.last_name : ""}`); }}
                          style={{ marginTop:4, padding:"12px", borderRadius:12, background:C.white, color:C.rose, fontWeight:600, fontSize:13, border:`1.5px solid ${C.rose}50`, cursor:"pointer", fontFamily:"Georgia, serif" }}>
                          💌 Leave a wish for the couple →
                        </button>
                      </>
                    ) : (
                      <div style={{ color:C.muted, fontSize:14, textAlign:"center" }}>
                        Hi {foundGuest.first_name}! Your table assignment is coming soon 🙏
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {!foundGuest && (
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => setActiveTab("wish")}
                  style={{ flex:1, padding:"16px", borderRadius:16, background:C.white, border:`1px solid ${C.border}`, color:C.muted, fontSize:13, cursor:"pointer", textAlign:"center", fontFamily:"Georgia, serif" }}>
                  💌 Leave a Wish →
                </button>
                <button onClick={() => setActiveTab("wall")}
                  style={{ flex:1, padding:"16px", borderRadius:16, background:C.white, border:`1px solid ${C.border}`, color:C.muted, fontSize:13, cursor:"pointer", textAlign:"center", fontFamily:"Georgia, serif" }}>
                  🌸 Wishing Wall →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ LEAVE A WISH ══ */}
        {activeTab === "wish" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ background:C.white, borderRadius:20, border:`1px solid ${C.border}`, overflow:"hidden", boxShadow:"0 4px 20px rgba(180,140,120,0.1)" }}>
              <div style={{ background:"linear-gradient(135deg, #F5EEE8, #F8F0EC)", padding:"20px 20px 16px", borderBottom:`1px solid ${C.border}` }}>
                <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:C.text }}>💌 Leave a Wish</h2>
                <p style={{ margin:"5px 0 0", fontSize:13, color:C.muted, lineHeight:1.5 }}>Your message appears on the wall instantly for everyone to see 🌸</p>
              </div>
              <div style={{ padding:20, display:"flex", flexDirection:"column", gap:12 }}>
                <input
                  value={wishName}
                  onChange={e => setWishName(e.target.value)}
                  placeholder="Your name"
                  style={{ padding:"14px 16px", borderRadius:12, border:`1.5px solid ${C.border}`, background:C.inputBg, color:C.text, fontSize:15, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"Georgia, serif" }}
                />
                <textarea
                  value={wishMsg}
                  onChange={e => setWishMsg(e.target.value)}
                  placeholder="Write something beautiful… 💍"
                  rows={4}
                  style={{ padding:"14px 16px", borderRadius:12, border:`1.5px solid ${C.border}`, background:C.inputBg, color:C.text, fontSize:15, outline:"none", resize:"none", width:"100%", boxSizing:"border-box", lineHeight:1.7, fontFamily:"Georgia, serif" }}
                />
                <button onClick={sendWish} disabled={sending || !wishName.trim() || !wishMsg.trim()}
                  style={{
                    padding:"16px", borderRadius:14,
                    background:(sending || !wishName.trim() || !wishMsg.trim()) ? "#D4A4A8" : `linear-gradient(135deg, ${C.rose}, ${C.gold})`,
                    color:"#fff", fontWeight:700, fontSize:15, border:"none",
                    cursor:(sending || !wishName.trim() || !wishMsg.trim()) ? "not-allowed" : "pointer",
                    boxShadow:(sending || !wishName.trim() || !wishMsg.trim()) ? "none" : "0 4px 20px rgba(196,132,142,0.35)",
                    transition:"all 0.2s",
                    fontFamily:"Georgia, serif",
                  }}>
                  {sent ? "✅ Wish sent!" : sending ? "Sending…" : "Send My Wish 💌"}
                </button>
              </div>
            </div>
            <button onClick={() => setActiveTab("wall")}
              style={{ padding:"16px", borderRadius:16, background:C.white, border:`1px solid ${C.rose}40`, color:C.rose, fontSize:14, fontWeight:600, cursor:"pointer", textAlign:"center", fontFamily:"Georgia, serif" }}>
              🌸 View the Wishing Wall →
            </button>
          </div>
        )}

        {/* ══ WISHING WALL ══ */}
        {activeTab === "wall" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ background:C.white, borderRadius:20, border:`1px solid ${C.border}`, overflow:"hidden", boxShadow:"0 4px 20px rgba(180,140,120,0.1)" }}>
              <div style={{ background:"linear-gradient(135deg, #F5EEE8, #F8F0EC)", padding:"16px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:8 }}>
                <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:C.text }}>🌸 Wishing Wall</h2>
                <span style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:C.sage, display:"inline-block", animation:"pulse 2s infinite" }} />
                  <span style={{ fontSize:11, color:C.sage, fontWeight:600 }}>Live</span>
                </span>
                <span style={{ background:C.roseLight, color:C.rose, borderRadius:20, padding:"3px 12px", fontSize:12, fontWeight:700 }}>
                  {wishes.length} {wishes.length === 1 ? "wish" : "wishes"}
                </span>
              </div>

              <div ref={wallRef} style={{ padding:"16px 20px", display:"flex", flexDirection:"column", gap:12, maxHeight:420, overflowY:"auto" }}>
                {wishes.length === 0 ? (
                  <div style={{ textAlign:"center", color:C.muted, padding:"36px 0", fontSize:14 }}>
                    <div style={{ fontSize:40, marginBottom:12 }}>🌸</div>
                    Be the first to leave a wish!
                  </div>
                ) : wishes.map((w, i) => (
                  <div key={w.id} style={{
                    padding:"16px", borderRadius:14,
                    background: newIds.has(w.id) ? C.roseLight : i === 0 ? "#FDFAF8" : C.inputBg,
                    border:`1.5px solid ${newIds.has(w.id) ? C.rose : i === 0 ? C.rose+"40" : C.border}`,
                    transition:"background 0.5s, border-color 0.5s",
                    animation: newIds.has(w.id) ? "slideDown 0.4s ease" : "none",
                  }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                      <div style={{ width:34, height:34, borderRadius:"50%", background:`linear-gradient(135deg, ${C.rose}, ${C.gold})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#fff", flexShrink:0 }}>
                        {w.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight:700, fontSize:14, color:C.text }}>{w.name}</span>
                      <span style={{ marginLeft:"auto", color:C.mutedLight, fontSize:11 }}>
                        {new Date(w.created_at).toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" })}
                      </span>
                    </div>
                    <p style={{ margin:0, color:C.muted, fontSize:14, lineHeight:1.7 }}>{w.message}</p>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setActiveTab("wish")}
              style={{ padding:"16px", borderRadius:16, background:`linear-gradient(135deg, ${C.roseLight}, ${C.goldLight})`, border:`1.5px solid ${C.rose}50`, color:C.rose, fontSize:14, fontWeight:700, cursor:"pointer", textAlign:"center", boxShadow:"0 2px 10px rgba(196,132,142,0.15)", fontFamily:"Georgia, serif" }}>
              💌 Leave your own wish →
            </button>
          </div>
        )}

        <p style={{ textAlign:"center", color:C.mutedLight, fontSize:12, marginTop:20, paddingBottom:8 }}>
          Powered by{" "}
          <span style={{ color:C.rose }}>TableMate</span> 💍
        </p>
      </div>

      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:none; } }
        @keyframes pulse    { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #C8B8B8; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #EDE4DC; border-radius: 4px; }
      `}</style>
    </div>
  );
}
