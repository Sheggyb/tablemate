"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MEALS = [
  { value: "meat",       label: "Meat",       icon: "🍖" },
  { value: "fish",       label: "Fish",        icon: "🐟" },
  { value: "vegan",      label: "Vegan",       icon: "🥗" },
  { value: "vegetarian", label: "Vegetarian",  icon: "🌿" },
];

// 40 confetti pieces with deterministic positions/colors
const CONFETTI_PIECES = Array.from({ length: 40 }, (_, i) => {
  const colors = ["#C4848E","#7A9E7E","#D4A882","#E8C4A0","#A8C4A8","#D4849C","#F0D0B8","#8AB4A8"];
  const shapes = ["circle","square","rect"];
  return {
    id: i,
    color: colors[i % colors.length],
    shape: shapes[i % shapes.length],
    left: ((i * 97 + 13) % 100),
    delay: ((i * 137) % 3000),
    duration: 2400 + ((i * 89) % 1600),
    size: 6 + (i % 5) * 2,
    rotate: (i * 53) % 360,
  };
});

function Confetti() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:999, overflow:"hidden" }}>
      {CONFETTI_PIECES.map(p => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            top: "-20px",
            left: `${p.left}%`,
            width: p.shape === "rect" ? p.size * 2.5 : p.size,
            height: p.size,
            borderRadius: p.shape === "circle" ? "50%" : p.shape === "square" ? 2 : 2,
            background: p.color,
            opacity: 0,
            animation: `confettiFall ${p.duration}ms ${p.delay}ms ease-in forwards`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg) scale(0.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function RsvpPage() {
  const params = useParams();
  const [guest, setGuest]         = useState<any>(null);
  const [wedding, setWedding]     = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [rsvp, setRsvp]           = useState<"confirmed"|"declined">("confirmed");
  const [meal, setMeal]           = useState("meat");
  const [allergies, setAllergies] = useState("");
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: g, error: e } = await supabase
        .from("guests")
        .select("*, weddings(*)")
        .eq("rsvp_token", params.token)
        .single();

      if (e || !g) { setError("Invitation not found. Please check your link."); setLoading(false); return; }
      setGuest(g);
      setWedding(g.weddings);
      // Map old meal values → new
      const mealMap: Record<string,string> = { standard:"meat", "gluten-free":"vegan", halal:"meat", kosher:"fish", children:"meat" };
      const savedMeal = MEALS.find(m => m.value === g.meal) ? g.meal : (mealMap[g.meal] ?? "meat");
      setMeal(savedMeal);
      setAllergies(g.allergies || "");
      if (g.rsvp !== "pending") setSubmitted(true);
      setLoading(false);
    };
    load();
  }, [params.token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { error: saveErr } = await supabase
      .from("guests")
      .update({ rsvp, meal, allergies, rsvp_responded_at: new Date().toISOString() })
      .eq("rsvp_token", params.token);

    if (saveErr) { setError("Failed to save. Please try again."); setSaving(false); return; }
    setSubmitted(true);
    setSaving(false);
  };

  if (loading) return <LoadingScreen />;

  const weddingDate = wedding?.date
    ? new Date(wedding.date).toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long", year:"numeric" })
    : null;

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(160deg, #FAF6F0 0%, #F5EEE8 50%, #F0E8E4 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "Georgia, 'Times New Roman', serif",
    }}>
      {submitted && rsvp === "confirmed" && <Confetti />}

      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Hero header */}
        <div style={{
          background: "linear-gradient(135deg, #C4848E 0%, #D4849C 40%, #C9956E 100%)",
          borderRadius: "24px 24px 0 0",
          padding: "40px 32px 32px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Decorative circles */}
          <div style={{ position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.08)" }} />
          <div style={{ position:"absolute", bottom:-20, left:-20, width:80, height:80, borderRadius:"50%", background:"rgba(255,255,255,0.06)" }} />

          <div style={{ fontSize: 44, marginBottom: 10, position:"relative" }}>💍</div>
          <h1 style={{ color:"#fff", fontSize: 26, fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.3px", position:"relative" }}>
            {wedding?.couple_names || wedding?.name || "Wedding Invitation"}
          </h1>
          {weddingDate && (
            <p style={{ color:"rgba(255,255,255,0.85)", fontSize: 14, margin: "0 0 4px", position:"relative" }}>{weddingDate}</p>
          )}
          {wedding?.couple_names && wedding?.name && (
            <p style={{ color:"rgba(255,255,255,0.75)", fontSize: 13, margin:0, position:"relative" }}>{wedding.name}</p>
          )}
        </div>

        {/* Content card */}
        <div style={{
          background: "#fff",
          borderRadius: "0 0 24px 24px",
          border: "1px solid #EDE4DC",
          borderTop: "none",
          padding: "32px 28px",
          boxShadow: "0 20px 60px rgba(180,140,120,0.15)",
        }}>
          {error && (
            <div style={{ background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:12, padding:"12px 16px", color:"#DC2626", fontSize:13, marginBottom:20, textAlign:"center" }}>
              {error}
            </div>
          )}

          {submitted ? (
            <ThankYouScreen rsvp={rsvp} guest={guest} />
          ) : (
            <form onSubmit={handleSubmit}>
              <p style={{ color:"#2A1F24", fontWeight:700, fontSize:17, margin:"0 0 6px" }}>
                Dear {guest?.first_name}{guest?.last_name ? ` ${guest.last_name}` : ""},
              </p>
              <p style={{ color:"#8B7878", fontSize:14, lineHeight:1.7, margin:"0 0 28px" }}>
                We'd love to know if you can join us on our special day. Please fill in your response below. 🌸
              </p>

              {/* Attendance */}
              <div style={{ marginBottom: 28 }}>
                <p style={{ color:"#2A1F24", fontWeight:600, fontSize:14, margin:"0 0 12px" }}>Will you attend?</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {[
                    { v:"confirmed", label:"Joyfully Accepts", icon:"✓", active:"#EDF7ED", activeBorder:"#7A9E7E", activeText:"#4A7A4E" },
                    { v:"declined",  label:"Regretfully Declines", icon:"✗", active:"#FEF2F4", activeBorder:"#C4848E", activeText:"#8A3A48" },
                  ].map(opt => (
                    <button key={opt.v} type="button" onClick={() => setRsvp(opt.v as any)}
                      style={{
                        padding: "16px 12px",
                        borderRadius: 14,
                        border: `2px solid ${rsvp === opt.v ? opt.activeBorder : "#EDE4DC"}`,
                        background: rsvp === opt.v ? opt.active : "#FDFAF8",
                        color: rsvp === opt.v ? opt.activeText : "#8B7878",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: rsvp === opt.v ? 700 : 500,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                        transition: "all 0.2s",
                        fontFamily: "Georgia, serif",
                      }}>
                      <span style={{ fontSize:22 }}>{opt.v === "confirmed" ? "🥂" : "💌"}</span>
                      <span style={{ fontSize:12, lineHeight:1.3, textAlign:"center" }}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {rsvp === "confirmed" && (
                <>
                  {/* Meal preference */}
                  <div style={{ marginBottom: 28 }}>
                    <p style={{ color:"#2A1F24", fontWeight:600, fontSize:14, margin:"0 0 12px" }}>Meal preference</p>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                      {MEALS.map(m => (
                        <button key={m.value} type="button" onClick={() => setMeal(m.value)}
                          style={{
                            padding: "18px 12px",
                            borderRadius: 16,
                            border: `2px solid ${meal === m.value ? "#C4848E" : "#EDE4DC"}`,
                            background: meal === m.value ? "#FDF0F2" : "#FDFAF8",
                            color: meal === m.value ? "#8A3A48" : "#6B5C60",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 8,
                            transition: "all 0.2s",
                            fontFamily: "Georgia, serif",
                          }}>
                          <span style={{ fontSize: 32 }}>{m.icon}</span>
                          <span style={{ fontSize: 13, fontWeight: meal === m.value ? 700 : 500 }}>{m.label}</span>
                          {meal === m.value && (
                            <span style={{ width:18, height:18, borderRadius:"50%", background:"#C4848E", display:"flex", alignItems:"center", justifyContent:"center" }}>
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Allergies / dietary notes */}
                  <div style={{ marginBottom: 28 }}>
                    <label style={{ display:"block", color:"#2A1F24", fontWeight:600, fontSize:14, marginBottom:10 }}>
                      Allergies or dietary notes
                    </label>
                    <input
                      type="text"
                      value={allergies}
                      onChange={e => setAllergies(e.target.value)}
                      placeholder="Nuts, dairy, gluten, etc. (optional)"
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        borderRadius: 12,
                        border: "1.5px solid #EDE4DC",
                        background: "#FDFAF8",
                        color: "#2A1F24",
                        fontSize: 14,
                        outline: "none",
                        boxSizing: "border-box",
                        fontFamily: "Georgia, serif",
                        transition: "border-color 0.2s",
                      }}
                      onFocus={e => (e.target.style.borderColor = "#C4848E")}
                      onBlur={e => (e.target.style.borderColor = "#EDE4DC")}
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={saving}
                style={{
                  width: "100%",
                  padding: "17px",
                  borderRadius: 16,
                  background: saving ? "#D4A4A8" : "linear-gradient(135deg, #C4848E, #C9956E)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 16,
                  border: "none",
                  cursor: saving ? "not-allowed" : "pointer",
                  letterSpacing: "0.3px",
                  boxShadow: saving ? "none" : "0 4px 20px rgba(196,132,142,0.4)",
                  transition: "all 0.2s",
                  fontFamily: "Georgia, serif",
                }}>
                {saving ? "Saving your response…" : "Send My RSVP 💌"}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign:"center", fontSize:12, color:"#B8A8A8", marginTop:20 }}>
          Powered by{" "}
          <a href={process.env.NEXT_PUBLIC_APP_URL} style={{ color:"#C4848E", textDecoration:"none" }}>TableMate</a>
        </p>
      </div>

      <style>{`
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        input::placeholder { color: #C8B8B8; }
      `}</style>
    </div>
  );
}

function ThankYouScreen({ rsvp, guest }: { rsvp: string; guest: any }) {
  const confirmed = rsvp === "confirmed";
  return (
    <div style={{ textAlign:"center", padding:"12px 0 8px" }}>
      <div style={{ fontSize: 60, marginBottom: 16, animation: "popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}>
        {confirmed ? "🎉" : "💌"}
      </div>
      <h2 style={{
        color: "#2A1F24",
        fontSize: 24,
        fontWeight: 700,
        margin: "0 0 12px",
        fontFamily: "Georgia, serif",
      }}>
        {confirmed ? "See you there!" : "We'll miss you!"}
      </h2>
      <p style={{ color:"#8B7878", fontSize:15, lineHeight:1.7, margin:"0 0 24px" }}>
        {confirmed
          ? `Thank you, ${guest?.first_name}! 🌸 Your RSVP has been saved. We're so excited to celebrate with you!`
          : `Thank you, ${guest?.first_name}, for letting us know. You'll be missed — we'll be thinking of you! 💕`}
      </p>
      {confirmed && (
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: 16,
          padding: "16px",
          background: "linear-gradient(135deg, #FDF0F2, #F5F8F0)",
          borderRadius: 16,
          border: "1px solid #EDE4DC",
        }}>
          {["🥂", "💐", "✨", "🎊"].map((e, i) => (
            <span key={i} style={{ fontSize: 28, animation: `bounce 1s ${i * 0.15}s ease-in-out infinite alternate` }}>{e}</span>
          ))}
        </div>
      )}
      <style>{`
        @keyframes popIn {
          0%   { transform: scale(0) rotate(-15deg); opacity:0; }
          100% { transform: scale(1) rotate(0deg); opacity:1; }
        }
        @keyframes bounce {
          from { transform: translateY(0); }
          to   { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(160deg, #FAF6F0 0%, #F5EEE8 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Georgia, serif",
    }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:16, animation:"spin 3s linear infinite" }}>💍</div>
        <p style={{ color:"#8B7878", fontSize:15 }}>Loading your invitation…</p>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
