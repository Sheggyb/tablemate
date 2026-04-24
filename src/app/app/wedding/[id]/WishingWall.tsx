"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

export default function WishingWall({ weddingId, shareCode, dark, isDemo }: Props) {
  const supabase = createClient();
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const wallRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const cs = {
    bg: dark ? "#0f0c15" : "#f5f2ef",
    surface: dark ? "#1a1625" : "#ffffff",
    surface2: dark ? "#12101a" : "#f0ece8",
    border: dark ? "#2a2438" : "#e8e0d8",
    text: dark ? "#f0ece8" : "#1a1412",
    muted: dark ? "#8a8090" : "#9a8878",
    accent: "#C9956E",
  };

  const guestLink = shareCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/guest/${shareCode}`
    : null;

  useEffect(() => {
    if (isDemo) { setLoading(false); return; }
    supabase
      .from("wishes")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setWishes(data ?? []); setLoading(false); });

    // Clean up previous channel
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    // Live subscription with unique channel name
    const channel = supabase
      .channel(`wishes-planner-${weddingId}-${Date.now()}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "wishes",
        filter: `wedding_id=eq.${weddingId}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          const wish = payload.new as Wish;
          setWishes(prev => [wish, ...prev]);
          setNewIds(prev => new Set([...prev, wish.id]));
          setTimeout(() => setNewIds(prev => { const s = new Set(prev); s.delete(wish.id); return s; }), 3000);
          wallRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        } else if (payload.eventType === "DELETE") {
          setWishes(prev => prev.filter(w => w.id !== (payload.old as Wish).id));
        }
      })
      .subscribe();

    channelRef.current = channel;
    return () => { if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; } };
  }, [weddingId, isDemo]);

  async function deleteWish(id: string) {
    if (isDemo) return;
    setDeleting(id);
    await supabase.from("wishes").delete().eq("id", id);
    setWishes(prev => prev.filter(w => w.id !== id));
    setDeleting(null);
  }

  function copyLink() {
    if (!guestLink) return;
    navigator.clipboard.writeText(guestLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const demoWishes: Wish[] = [
    { id: "1", name: "Maria H.", message: "Congratulations! Wishing you a lifetime of happiness together! 🥂", created_at: new Date(Date.now() - 120000).toISOString() },
    { id: "2", name: "Erik S.", message: "So happy for you both! Best day ever! 🎉", created_at: new Date(Date.now() - 300000).toISOString() },
    { id: "3", name: "Jonas L.", message: "Finally! 😂❤️ Love you guys!", created_at: new Date(Date.now() - 480000).toISOString() },
  ];

  const displayWishes = isDemo ? demoWishes : wishes;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: cs.bg }}>
      {/* Share Link Banner */}
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${cs.border}`, background: cs.surface, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: cs.text }}>🔗 Guest Portal Link</div>
            <div style={{ fontSize: 12, color: cs.muted, marginTop: 2 }}>Share this with your guests — they can find their table and leave wishes</div>
          </div>
          <div style={{ display: "flex", gap: 8, marginLeft: "auto", alignItems: "center", flexWrap: "wrap" }}>
            {guestLink && !isDemo && (
              <span style={{ fontSize: 12, color: cs.muted, fontFamily: "monospace", background: cs.surface2, padding: "4px 10px", borderRadius: 6, border: `1px solid ${cs.border}` }}>
                {guestLink.replace("https://", "")}
              </span>
            )}
            <button
              onClick={copyLink}
              disabled={!guestLink || isDemo}
              style={{
                padding: "8px 16px", borderRadius: 8, background: cs.accent, color: "#fff",
                fontWeight: 600, fontSize: 13, border: "none", cursor: isDemo ? "default" : "pointer",
                opacity: isDemo ? 0.5 : 1
              }}>
              {copied ? "✅ Copied!" : "📋 Copy Link"}
            </button>
            {guestLink && !isDemo && (
              <a href={guestLink} target="_blank" rel="noopener noreferrer"
                style={{ padding: "8px 14px", borderRadius: 8, background: cs.surface2, color: cs.text, fontWeight: 600, fontSize: 13, border: `1px solid ${cs.border}`, textDecoration: "none" }}>
                👁 Preview
              </a>
            )}
          </div>
        </div>
        {isDemo && (
          <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "rgba(201,149,110,0.1)", border: `1px solid ${cs.accent}40`, fontSize: 12, color: cs.accent }}>
            🔒 Sign up to get your shareable guest link
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div style={{ padding: "10px 20px", borderBottom: `1px solid ${cs.border}`, background: cs.surface, flexShrink: 0, display: "flex", gap: 20 }}>
        <div style={{ fontSize: 13, color: cs.muted }}>
          <span style={{ fontWeight: 700, color: cs.text, fontSize: 18 }}>{displayWishes.length}</span> {displayWishes.length === 1 ? "wish" : "wishes"} received
        </div>
        {displayWishes.length > 0 && (
          <div style={{ fontSize: 13, color: cs.muted }}>
            Latest from <span style={{ color: cs.text, fontWeight: 600 }}>{displayWishes[0].name}</span>
          </div>
        )}
      </div>

      {/* Wishing Wall */}
      <div ref={wallRef} style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {loading ? (
          <div style={{ textAlign: "center", color: cs.muted, padding: 40, fontSize: 14 }}>Loading wishes…</div>
        ) : displayWishes.length === 0 ? (
          <div style={{ textAlign: "center", color: cs.muted, padding: "60px 20px", fontSize: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌸</div>
            <div style={{ fontWeight: 600, color: cs.text, fontSize: 16, marginBottom: 6 }}>No wishes yet</div>
            <div>Share the guest portal link above and wishes will appear here live!</div>
          </div>
        ) : displayWishes.map((w, i) => (
          <div key={w.id} style={{
            padding: "14px 16px", borderRadius: 14,
            background: i === 0 ? `rgba(201,149,110,0.08)` : cs.surface,
            border: `1px solid ${i === 0 ? "#C9956E40" : cs.border}`,
            position: "relative", animation: "fadeIn 0.4s ease"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: `#C9956E25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#C9956E", flexShrink: 0 }}>
                {w.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: cs.text }}>{w.name}</div>
                <div style={{ fontSize: 11, color: cs.muted }}>
                  {new Date(w.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              {!isDemo && (
                <button
                  onClick={() => deleteWish(w.id)}
                  disabled={deleting === w.id}
                  style={{ marginLeft: "auto", background: "transparent", border: "none", color: cs.muted, cursor: "pointer", fontSize: 14, opacity: 0.5, padding: "2px 6px" }}
                  title="Delete wish">
                  🗑
                </button>
              )}
            </div>
            <p style={{ margin: 0, color: dark ? "#d4ccc8" : "#4a3828", fontSize: 14, lineHeight: 1.6 }}>{w.message}</p>
          </div>
        ))}
      </div>

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }`}</style>
    </div>
  );
}
