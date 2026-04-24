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
      // Find wedding by share_code
      const { data: w } = await supabase
        .from("weddings")
        .select("id, name, date, couple_names")
        .eq("share_code", shareCode)
        .single();

      if (!w) { setNotFound(true); setLoading(false); return; }
      setWedding(w);

      // Load guests, tables, wishes in parallel
      const [gRes, tRes, wRes] = await Promise.all([
        supabase.from("guests").select("id,first_name,last_name,table_id,meal").eq("wedding_id", w.id),
        supabase.from("tables").select("id,name,capacity").in("venue_id",
          (await supabase.from("venues").select("id").eq("wedding_id", w.id)).data?.map((v: {id:string}) => v.id) ?? []
        ),
        supabase.from("wishes").select("*").eq("wedding_id", w.id).order("created_at", { ascending: false }),
      ]);

      setGuests(gRes.data ?? []);
      setTables(tRes.data ?? []);
      setWishes(wRes.data ?? []);
      setLoading(false);

      // Subscribe to new wishes — unique channel name to prevent duplicates
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
            setWishes(prev => prev.filter(w => w.id !== (payload.old as Wish).id));
          }
        })
        .subscribe();
      channelRef.current = channel;
    }
    load();
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
    // Scroll wall to top
    wallRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  const foundTable = foundGuest?.table_id ? tables.find(t => t.id === foundGuest.table_id) : null;
  const mealLabel: Record<string, string> = {
    standard: "🍽 Standard", vegetarian: "🥗 Vegetarian", vegan: "🌱 Vegan",
    "gluten-free": "🌾 Gluten-Free", halal: "☪️ Halal", kosher: "✡️ Kosher", children: "👶 Children's",
  };

  if (loading) return (
    <div style={{ minHeight: "100dvh", background: "#0f0c15", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#C9956E", fontSize: 32 }}>💍</div>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: "100dvh", background: "#0f0c15", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24 }}>
      <div style={{ fontSize: 48 }}>💔</div>
      <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>Link not found</h1>
      <p style={{ color: "#888", textAlign: "center" }}>This wedding portal doesn't exist or the link has changed.</p>
    </div>
  );

  const accent = "#C9956E";
  const bg = "#0f0c15";
  const surface = "#1a1625";
  const border = "#2a2438";
  const text = "#f0ece8";
  const muted = "#8a8090";

  return (
    <div style={{ minHeight: "100dvh", background: bg, color: text, fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: surface, borderBottom: `1px solid ${border}`, padding: "20px 20px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 4 }}>💍</div>
        <h1 style={{ color: text, fontSize: 22, fontWeight: 700, margin: 0 }}>
          {wedding?.couple_names ?? wedding?.name}
        </h1>
        {wedding?.date && (
          <p style={{ color: muted, fontSize: 13, margin: "4px 0 0" }}>
            {new Date(wedding.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Find Your Table */}
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
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 10, border: `1px solid ${border}`,
                  background: "#12101a", color: text, fontSize: 15, outline: "none"
                }}
              />
              <button
                onClick={doSearch}
                style={{ padding: "10px 18px", borderRadius: 10, background: accent, color: "#fff", fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer" }}>
                Search
              </button>
            </div>

            {searched && !foundGuest && search.trim() && (
              <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(224,92,106,0.1)", border: "1px solid rgba(224,92,106,0.25)", color: "#e05c6a", fontSize: 13 }}>
                😕 Couldn't find "{search}" — try a different spelling
              </div>
            )}

            {foundGuest && (
              <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(201,149,110,0.1)", border: `1px solid ${accent}`, display: "flex", flexDirection: "column", gap: 6 }}>
                {foundTable ? (
                  <>
                    <div style={{ color: accent, fontWeight: 700, fontSize: 18 }}>
                      🎉 You're at {foundTable.name}!
                    </div>
                    <div style={{ color: muted, fontSize: 13 }}>
                      {foundGuest.meal ? mealLabel[foundGuest.meal] ?? foundGuest.meal : ""}
                    </div>
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

        {/* Leave a Wish */}
        <div style={{ background: surface, borderRadius: 16, border: `1px solid ${border}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${border}` }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: text }}>💌 Leave a Wish</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: muted }}>Your message will appear on the live wall below</p>
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              value={wishName}
              onChange={e => setWishName(e.target.value)}
              placeholder="Your name"
              style={{
                padding: "10px 14px", borderRadius: 10, border: `1px solid ${border}`,
                background: "#12101a", color: text, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box"
              }}
            />
            <textarea
              value={wishMsg}
              onChange={e => setWishMsg(e.target.value)}
              placeholder="Write something beautiful... 💍"
              rows={3}
              style={{
                padding: "10px 14px", borderRadius: 10, border: `1px solid ${border}`,
                background: "#12101a", color: text, fontSize: 14, outline: "none",
                resize: "none", width: "100%", boxSizing: "border-box", lineHeight: 1.5
              }}
            />
            <button
              onClick={sendWish}
              disabled={sending || !wishName.trim() || !wishMsg.trim()}
              style={{
                padding: "12px", borderRadius: 10, background: accent, color: "#fff",
                fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer",
                opacity: (sending || !wishName.trim() || !wishMsg.trim()) ? 0.5 : 1
              }}>
              {sent ? "✅ Message sent!" : sending ? "Sending…" : "Send ❤️"}
            </button>
          </div>
        </div>

        {/* Live Wishing Wall */}
        <div style={{ background: surface, borderRadius: 16, border: `1px solid ${border}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: text }}>🌸 Wishing Wall</h2>
            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>Live</span>
            </span>
            <span style={{ background: "rgba(201,149,110,0.15)", color: accent, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>
              {wishes.length} {wishes.length === 1 ? "wish" : "wishes"}
            </span>
          </div>

          <div ref={wallRef} style={{ maxHeight: 420, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
            {wishes.length === 0 ? (
              <div style={{ textAlign: "center", color: muted, padding: "24px 0", fontSize: 14 }}>
                Be the first to leave a wish! 🌸
              </div>
            ) : wishes.map((w, i) => (
              <div key={w.id} style={{
                padding: "12px 14px", borderRadius: 12,
                background: newIds.has(w.id) ? "rgba(201,149,110,0.15)" : i === 0 ? "rgba(201,149,110,0.08)" : "#12101a",
                border: `1px solid ${newIds.has(w.id) ? accent : i === 0 ? accent + "40" : border}`,
                transition: "background 0.5s, border-color 0.5s",
                animation: i === 0 ? "fadeIn 0.4s ease" : "none"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${accent}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: accent }}>
                    {w.name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 14, color: text }}>{w.name}</span>
                  <span style={{ marginLeft: "auto", color: muted, fontSize: 11 }}>
                    {new Date(w.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p style={{ margin: 0, color: "#d4ccc8", fontSize: 14, lineHeight: 1.5 }}>{w.message}</p>
              </div>
            ))}
          </div>
        </div>

        <p style={{ textAlign: "center", color: "#4a4258", fontSize: 12, marginTop: 8 }}>
          Powered by TableMate 💍
        </p>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        * { -webkit-tap-highlight-color: transparent; }
        input::placeholder, textarea::placeholder { color: #4a4258; }
      `}</style>
    </div>
  );
}
