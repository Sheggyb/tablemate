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

type Tab = "seat" | "wall";

export default function GuestPortal({ params }: { params: Promise<{ shareCode: string }> }) {
  const supabase = createClient();
  const [shareCode, setShareCode] = useState("");

  useEffect(() => {
    params.then(p => setShareCode(p.shareCode));
  }, []);

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("seat");

  // Table lookup
  const [search, setSearch] = useState("");
  const [foundGuest, setFoundGuest] = useState<Guest | null>(null);
  const [searched, setSearched] = useState(false);

  // Wish form
  const [wishName, setWishName] = useState("");
  const [wishMsg, setWishMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const wallRef = useRef<HTMLDivElement>(null);
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
        .on("postgres_changes", {
          event: "*",
          schema: "public",
          table: "wishes",
          filter: `wedding_id=eq.${w.id}`,
        }, (payload) => {
          if (payload.eventType === "INSERT") {
            const wish = payload.new as Wish;
            setWishes(prev => [wish, ...prev]);
            setNewIds(prev => new Set([...prev, wish.id]));
            setTimeout(() => setNewIds(prev => { const s = new Set(prev); s.delete(wish.id); return s; }), 3000);
            setTimeout(() => wallRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 50);
          } else if (payload.eventType === "DELETE") {
            // payload.old.id requires REPLICA IDENTITY FULL — use id if present, else refetch
            const deletedId = (payload.old as Partial<Wish>).id;
            if (deletedId) {
              setWishes(prev => prev.filter(w => w.id !== deletedId));
            } else {
              // fallback: refetch wishes
              supabase.from("wishes").select("*").eq("wedding_id", w.id).order("created_at", { ascending: false })
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
    setSending(false);
    setTimeout(() => setSent(false), 4000);
    // Switch to wall tab so they see their message appear live
    setActiveTab("wall");
    setTimeout(() => wallRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 200);
  }

  const foundTable = foundGuest?.table_id ? tables.find(t => t.id === foundGuest.table_id) : null;
  const mealLabel: Record<string, string> = {
    standard: "🍽 Standard", vegetarian: "🥗 Vegetarian", vegan: "🌱 Vegan",
    "gluten-free": "🌾 Gluten-Free", halal: "☪️ Halal", kosher: "✡️ Kosher", children: "👶 Children's",
  };

  const accent = "#C9956E";
  const bg = "#0f0c15";
  const surface = "#1a1625";
  const border = "#2a2438";
  const text = "#f0ece8";
  const muted = "#8a8090";
  const inputBg = "#12101a";

  if (loading) return (
    <div style={{ minHeight: "100dvh", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: accent, fontSize: 40, animation: "spin 1.5s linear infinite" }}>💍</div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: "100dvh", background: bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24 }}>
      <div style={{ fontSize: 48 }}>💔</div>
      <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>Link not found</h1>
      <p style={{ color: muted, textAlign: "center" }}>This wedding portal doesn't exist or the link has changed.</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100dvh", background: bg, color: text, fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column" }}>

      {/* ── Header ── */}
      <div style={{ background: surface, borderBottom: `1px solid ${border}`, padding: "20px 20px 16px", textAlign: "center", flexShrink: 0 }}>
        <div style={{ fontSize: 32, marginBottom: 6 }}>💍</div>
        <h1 style={{ color: text, fontSize: 22, fontWeight: 700, margin: 0 }}>
          {wedding?.couple_names ?? wedding?.name}
        </h1>
        {wedding?.date && (
          <p style={{ color: muted, fontSize: 13, margin: "6px 0 0" }}>
            {new Date(wedding.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}
      </div>

      {/* ── Tab Bar ── */}
      <div style={{ background: surface, borderBottom: `1px solid ${border}`, display: "flex", flexShrink: 0 }}>
        {([
          { key: "seat" as Tab, emoji: "🪑", label: "Find My Seat" },
          { key: "wall" as Tab, emoji: "🌸", label: `Wishing Wall${wishes.length > 0 ? ` (${wishes.length})` : ""}` },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: "14px 8px", background: "transparent", border: "none", cursor: "pointer",
              borderBottom: activeTab === tab.key ? `3px solid ${accent}` : "3px solid transparent",
              color: activeTab === tab.key ? accent : muted,
              fontWeight: activeTab === tab.key ? 700 : 400,
              fontSize: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, transition: "color 0.2s"
            }}>
            <span style={{ fontSize: 22 }}>{tab.emoji}</span>
            <span style={{ fontSize: 12 }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", maxWidth: 520, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>

        {/* ══ FIND MY SEAT ══ */}
        {activeTab === "seat" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Search card */}
            <div style={{ background: surface, borderRadius: 16, border: `1px solid ${border}`, overflow: "hidden" }}>
              <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${border}` }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: text }}>🪑 Find Your Seat</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: muted }}>Type your name to find your table</p>
              </div>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={search}
                    onChange={e => { setSearch(e.target.value); setSearched(false); setFoundGuest(null); }}
                    onKeyDown={e => e.key === "Enter" && doSearch()}
                    placeholder="Your name..."
                    autoFocus
                    style={{
                      flex: 1, padding: "12px 14px", borderRadius: 10, border: `1px solid ${border}`,
                      background: inputBg, color: text, fontSize: 15, outline: "none"
                    }}
                  />
                  <button onClick={doSearch}
                    style={{ padding: "12px 18px", borderRadius: 10, background: accent, color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>
                    Search
                  </button>
                </div>

                {searched && !foundGuest && search.trim() && (
                  <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(224,92,106,0.1)", border: "1px solid rgba(224,92,106,0.25)", color: "#e05c6a", fontSize: 13 }}>
                    😕 Couldn't find "{search}" — try a different spelling
                  </div>
                )}

                {foundGuest && (
                  <div style={{ padding: "16px", borderRadius: 12, background: "rgba(201,149,110,0.1)", border: `1px solid ${accent}`, display: "flex", flexDirection: "column", gap: 8 }}>
                    {foundTable ? (
                      <>
                        <div style={{ color: accent, fontWeight: 700, fontSize: 20 }}>
                          🎉 You're at {foundTable.name}!
                        </div>
                        {foundGuest.meal && (
                          <div style={{ color: muted, fontSize: 14 }}>
                            Meal: {mealLabel[foundGuest.meal] ?? foundGuest.meal}
                          </div>
                        )}
                        <button onClick={() => { setActiveTab("wall"); setWishName(`${foundGuest.first_name}${foundGuest.last_name ? " " + foundGuest.last_name : ""}`); }}
                          style={{ marginTop: 4, padding: "10px", borderRadius: 10, background: `${accent}20`, color: accent, fontWeight: 600, fontSize: 13, border: `1px solid ${accent}40`, cursor: "pointer" }}>
                          💌 Leave a wish for the couple →
                        </button>
                      </>
                    ) : (
                      <div style={{ color: muted, fontSize: 14 }}>
                        Hi {foundGuest.first_name}! Your table assignment is coming soon 🙏
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* CTA to wishing wall */}
            {!foundGuest && (
              <button onClick={() => setActiveTab("wall")}
                style={{ padding: "14px", borderRadius: 14, background: surface, border: `1px solid ${border}`, color: muted, fontSize: 14, cursor: "pointer", textAlign: "center" }}>
                🌸 View the Wishing Wall →
              </button>
            )}
          </div>
        )}

        {/* ══ WISHING WALL ══ */}
        {activeTab === "wall" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Leave a wish */}
            <div style={{ background: surface, borderRadius: 16, border: `1px solid ${border}`, overflow: "hidden" }}>
              <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${border}` }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: text }}>💌 Leave a Wish</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: muted }}>Your message appears on the wall instantly</p>
              </div>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  value={wishName}
                  onChange={e => setWishName(e.target.value)}
                  placeholder="Your name"
                  style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${border}`, background: inputBg, color: text, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" }}
                />
                <textarea
                  value={wishMsg}
                  onChange={e => setWishMsg(e.target.value)}
                  placeholder="Write something beautiful... 💍"
                  rows={3}
                  style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${border}`, background: inputBg, color: text, fontSize: 14, outline: "none", resize: "none", width: "100%", boxSizing: "border-box", lineHeight: 1.5 }}
                />
                <button onClick={sendWish} disabled={sending || !wishName.trim() || !wishMsg.trim()}
                  style={{ padding: "13px", borderRadius: 10, background: accent, color: "#fff", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", opacity: (sending || !wishName.trim() || !wishMsg.trim()) ? 0.5 : 1, transition: "opacity 0.2s" }}>
                  {sent ? "✅ Message sent!" : sending ? "Sending…" : "Send ❤️"}
                </button>
              </div>
            </div>

            {/* Live wall */}
            <div style={{ background: surface, borderRadius: 16, border: `1px solid ${border}`, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: text }}>🌸 Wishing Wall</h2>
                <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse 2s infinite" }} />
                  <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>Live</span>
                </span>
                <span style={{ background: `${accent}20`, color: accent, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>
                  {wishes.length} {wishes.length === 1 ? "wish" : "wishes"}
                </span>
              </div>

              <div ref={wallRef} style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                {wishes.length === 0 ? (
                  <div style={{ textAlign: "center", color: muted, padding: "32px 0", fontSize: 14 }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>🌸</div>
                    Be the first to leave a wish!
                  </div>
                ) : wishes.map((w, i) => (
                  <div key={w.id} style={{
                    padding: "13px 14px", borderRadius: 12,
                    background: newIds.has(w.id) ? "rgba(201,149,110,0.15)" : i === 0 ? "rgba(201,149,110,0.07)" : inputBg,
                    border: `1px solid ${newIds.has(w.id) ? accent : i === 0 ? accent + "40" : border}`,
                    transition: "background 0.5s, border-color 0.5s",
                    animation: newIds.has(w.id) ? "slideDown 0.4s ease" : "none"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${accent}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: accent, flexShrink: 0 }}>
                        {w.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 14, color: text }}>{w.name}</span>
                      <span style={{ marginLeft: "auto", color: muted, fontSize: 11 }}>
                        {new Date(w.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: "#d4ccc8", fontSize: 14, lineHeight: 1.6 }}>{w.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <p style={{ textAlign: "center", color: "#4a4258", fontSize: 12, marginTop: 16, paddingBottom: 8 }}>
          Powered by TableMate 💍
        </p>
      </div>

      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:none; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #4a4258; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #2a2438; border-radius: 4px; }
      `}</style>
    </div>
  );
}
