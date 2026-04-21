"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MEALS = [
  { value: "standard",     label: "Standard",        icon: "🍽️" },
  { value: "vegetarian",   label: "Vegetarian",       icon: "🌿" },
  { value: "vegan",        label: "Vegan",            icon: "🌱" },
  { value: "gluten-free",  label: "Gluten-Free",      icon: "🌾" },
  { value: "halal",        label: "Halal",            icon: "☪️" },
  { value: "kosher",       label: "Kosher",           icon: "✡️" },
  { value: "children",     label: "Children's",       icon: "🧒" },
];

export default function RsvpPage() {
  const params = useParams();
  const [guest, setGuest]       = useState<any>(null);
  const [wedding, setWedding]   = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [rsvp, setRsvp]         = useState<"confirmed"|"declined">("confirmed");
  const [meal, setMeal]         = useState("standard");
  const [allergies, setAllergies] = useState("");
  const [saving, setSaving]     = useState(false);

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
      setMeal(g.meal || "standard");
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
    ? new Date(wedding.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-[#FDFBF8] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header card */}
        <div className="bg-gradient-to-br from-[#C9956E] to-[#D4A882] text-white rounded-t-2xl p-8 text-center">
          <div className="text-3xl mb-2">💍</div>
          <h1 className="font-playfair text-2xl font-bold mb-1">{wedding?.name || "Wedding Invitation"}</h1>
          {weddingDate && <p className="text-white/80 text-sm">{weddingDate}</p>}
          {wedding?.couple_names && <p className="text-white/90 text-sm mt-1">{wedding.couple_names}</p>}
        </div>

        {/* Content */}
        <div className="bg-white rounded-b-2xl border border-[#EDE8E0] border-t-0 p-8 shadow-lg">
          {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}

          {submitted ? (
            <ThankYouScreen rsvp={rsvp} guest={guest} />
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="text-[#2A2328] font-semibold mb-1">
                Dear {guest?.first_name} {guest?.last_name},
              </p>
              <p className="text-[#6B6068] text-sm mb-6 leading-relaxed">
                We'd love to know if you can join us. Please fill in your response below.
              </p>

              {/* Attend yes/no */}
              <fieldset className="mb-6">
                <legend className="text-sm font-semibold text-[#2A2328] mb-3">Will you attend?</legend>
                <div className="grid grid-cols-2 gap-3">
                  {[{v:"confirmed",label:"✓ Joyfully accepts",color:"bg-green-50 border-green-400 text-green-700"},
                    {v:"declined",label:"✗ Regretfully declines",color:"bg-red-50 border-red-400 text-red-700"}].map(opt => (
                    <label key={opt.v} className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${rsvp === opt.v ? opt.color : "border-[#EDE8E0] text-[#6B6068] hover:border-[#C9956E]"}`}>
                      <input type="radio" name="rsvp" value={opt.v} checked={rsvp === opt.v} onChange={() => setRsvp(opt.v as any)} className="sr-only"/>
                      {opt.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              {rsvp === "confirmed" && (
                <>
                  {/* Meal choice */}
                  <fieldset className="mb-6">
                    <legend className="text-sm font-semibold text-[#2A2328] mb-3">Meal preference</legend>
                    <div className="grid grid-cols-2 gap-2">
                      {MEALS.map(m => (
                        <label key={m.value} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm ${meal === m.value ? "border-[#C9956E] bg-[#FDF4EC] text-[#C9956E]" : "border-[#EDE8E0] text-[#4A4348] hover:border-[#C9956E]/50"}`}>
                          <input type="radio" name="meal" value={m.value} checked={meal === m.value} onChange={() => setMeal(m.value)} className="sr-only"/>
                          <span>{m.icon}</span>{m.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {/* Allergies */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-[#2A2328] mb-2">Allergies or dietary notes</label>
                    <input type="text" value={allergies} onChange={e => setAllergies(e.target.value)}
                      className="w-full px-3 py-2.5 border border-[#DDD7D0] rounded-lg text-sm focus:outline-none focus:border-[#C9956E]"
                      placeholder="Nuts, dairy, etc. (optional)"/>
                  </div>
                </>
              )}

              <button type="submit" disabled={saving}
                className="w-full py-3 bg-[#C9956E] hover:bg-[#B8845D] disabled:opacity-60 text-white font-semibold rounded-xl transition-colors">
                {saving ? "Saving…" : "Send My RSVP"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-[#9B9098] mt-4">
          Powered by <a href={process.env.NEXT_PUBLIC_APP_URL} className="text-[#C9956E] hover:underline">TableMate</a>
        </p>
      </div>
    </div>
  );
}

function ThankYouScreen({ rsvp, guest }: { rsvp: string; guest: any }) {
  return (
    <div className="text-center py-4">
      <div className="text-5xl mb-4">{rsvp === "confirmed" ? "🎉" : "💌"}</div>
      <h2 className="font-playfair text-xl font-bold text-[#2A2328] mb-2">
        {rsvp === "confirmed" ? "See you there!" : "We'll miss you!"}
      </h2>
      <p className="text-[#6B6068] text-sm leading-relaxed">
        {rsvp === "confirmed"
          ? `Thank you ${guest?.first_name}! Your response has been saved. We can't wait to celebrate with you!`
          : `Thank you ${guest?.first_name} for letting us know. You'll be missed!`}
      </p>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#FDFBF8] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">💍</div>
        <p className="text-[#6B6068] text-sm">Loading your invitation…</p>
      </div>
    </div>
  );
}
