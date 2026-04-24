"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface Wish {
  id: string;
  name: string;
  message: string;
  created_at: string;
}

interface Props {
  weddingId: string;
  shareCode: string | null;
  dark: boolean;
  isDemo?: boolean;
}

const DEMO_WISHES: Wish[] = [
  { id: "1", name: "Maria H.", message: "Congratulations! Wishing you a lifetime of happiness together! 🥂", created_at: new Date(Date.now() - 120000).toISOString() },
  { id: "2", name: "Erik S.", message: "So happy for you both! Best day ever! 🎉", created_at: new Date(Date.now() - 300000).toISOString() },
  { id: "3", name: "Jonas L.", message: "Finally! 😂❤️ Love you guys!", created_at: new Date(Date.now() - 480000).toISOString() },
];

export default function MobileWishes({ weddingId, shareCode, dark, isDemo }: Props) {
  const supabase = createClient();
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const wallRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const accent = "#C9956E";
  const bg = dark ? "#0f0c15" : "#f5f2ef";
  const card = dark ? "#1a1625" : "#ffffff";
  const border = dark ? "#2a2438" : "#e8e0d8";
  const text = dark ? "#f0ece8" : "#1a1412";
  const muted = dark ? "#8a8090" : "#9a8878";
  const input = dark ? "#12101a" : "#f0ece8";

  const guestLink = shareCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/guest/${shareCode}`
    : null;

  useEffect(() => {
    if (isDemo) { setLoading(false); return; }

    // Load existing wishes
    supabase
      .from("wishes")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setWishes(data ?? []);
        setLoading(false);
      });

    // Clean up previous channel before creating new one
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Subscribe to live inserts
    const channel = supabase
      .channel(`mobile-wishes-${weddingId}-${Date.now()}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "wishes",
        filter: `wedding_id=eq.${weddingId}`,
      }, (payload) => {
        const wish = payload.new as Wish;
        setWishes(prev => [wish, ...prev]);
        setNewIds(prev => new Set([...prev, wish.id]));
        // Fade out highlight after 3s
        setTimeout(() => setNewIds(prev => { const s = new Set(prev); s.delete(wish.id); return s; }), 3000);
        // Scroll to top smoothly
        setTimeout(() => wallRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 50);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [weddingId, isDemo]);

  async function deleteWish(id: string) {
    if (isDemo) return;
    await supabase.from("wishes").delete().eq("id", id);
    setWishes(prev => prev.filter(w => w.id !== id));
  }

  function copyLink() {
    if (!guestLink) return;
    navigator.clipboard.writeText(guestLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const displayWishes = isDemo ? DEMO_WISHES : wishes;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: bg, overflow: "hidden" }}>

      {/* Share Link Card */}
      <div style={{ background: card, borderBottom: `1px solid ${border}`, padding: "14px 16px", flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: text, marginBottom: 6 }}>🔗 Guest Portal Link</div>
        <div style={{ fontSize: 12, color: muted, marginBottom: 10 }}>
          Share this link — guests can find their table and leave wishes
        </div>
        {isDemo ? (
          <a href="/signup" style={{
            display: "block", textAlign: "center", padding: "10px",
            borderRadius: 10, background: `${accent}20`, color: accent,
            fontWeight: 600, fontSize: 13, border: `1px solid ${accent}40`, textDecoration: "none"
          }}>
            🔒 Sign up to get your guest link
          </a>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{
              flex: 1, padding: "9px 12px", borderRadius: 10, background: input,
              border: `1px solid ${border}`, fontSize: 11, color: muted,
              fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
            }}>
              {guestLink?.replace("https://", "") ?? "generating..."}
            </div>
            <button onClick={copyLink} style={{
              padding: "9px 14px", borderRadius: 10, background: accent, color: "#fff",
              fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", flexShrink: 0
            }}>
              {copied ? "✅" : "Copy"}
            </button>
            {guestLink && (
              <a href={guestLink} target="_blank" rel="noopener noreferrer" style={{
                padding: "9px 12px", borderRadius: 10, background: input, color: text,
                fontWeight: 600, fontSize: 13, border: `1px solid ${border}`, textDecoration: "none", flexShrink: 0
              }}>
                👁
              </a>
            )}
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div style={{
        background: card, borderBottom: `1px solid ${border}`,
        padding: "8px 16px", flexShrink: 0, display: "flex", alignItems: "center", gap: 12
      }}>
        <span style={{ fontSize: 13, color: muted }}>
          <span style={{ fontWeight: 700, fontSize: 18, color: text }}>{displayWishes.length}</span>{" "}
          {displayWishes.length === 1 ? "wish" : "wishes"}
        </span>
        {!isDemo && (
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, color: "#22c55e" }}>Live</span>
          </span>
        )}
      </div>

      {/* Wishes Wall */}
      <div ref={wallRef} style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          <div style={{ textAlign: "center", color: muted, padding: 40 }}>Loading…</div>
        ) : displayWishes.length === 0 ? (
          <div style={{ textAlign: "center", color: muted, padding: "48px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌸</div>
            <div style={{ fontWeight: 600, color: text, fontSize: 16, marginBottom: 6 }}>No wishes yet</div>
            <div style={{ fontSize: 13 }}>Share the guest link above — wishes appear here live!</div>
          </div>
        ) : displayWishes.map((w, i) => (
          <div key={w.id} style={{
            padding: "12px 14px", borderRadius: 14,
            background: newIds.has(w.id) ? `rgba(201,149,110,0.15)` : i === 0 ? `rgba(201,149,110,0.07)` : card,
            border: `1px solid ${newIds.has(w.id) ? accent : i === 0 ? accent + "40" : border}`,
            transition: "background 0.5s, border-color 0.5s",
            animation: i === 0 ? "slideDown 0.4s ease" : "none",
            position: "relative"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: `${accent}25`, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 14, fontWeight: 700, color: accent, flexShrink: 0
              }}>
                {w.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: text }}>{w.name}</div>
                <div style={{ fontSize: 11, color: muted }}>
                  {new Date(w.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              {!isDemo && (
                <button
                  onClick={() => deleteWish(w.id)}
                  style={{ background: "transparent", border: "none", color: muted, cursor: "pointer", fontSize: 16, padding: "4px", opacity: 0.5 }}
                  title="Delete">
                  🗑
                </button>
              )}
            </div>
            <p style={{ margin: 0, color: dark ? "#d4ccc8" : "#4a3828", fontSize: 14, lineHeight: 1.6 }}>
              {w.message}
            </p>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:none; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      `}</style>
    </div>
  );
}
