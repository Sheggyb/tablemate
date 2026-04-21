"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Wedding, Venue, Guest, Table, Group, Rule, Rsvp } from "@/lib/types";
import GuestPanel from "./GuestPanel";
import ChartCanvas from "./ChartCanvas";
import RulesPanel from "./RulesPanel";

type Tab = "chart" | "guests" | "rules";

interface Props {
  wedding:       Wedding;
  initialVenues: Venue[];
  initialGuests: Guest[];
  initialTables: Table[];
  initialGroups: Group[];
  initialRules:  Rule[];
  plan:          string;
}

export default function PlannerClient({
  wedding, initialVenues, initialGuests, initialTables, initialGroups, initialRules, plan
}: Props) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<Tab>("chart");

  const [venues,  setVenues]  = useState<Venue[]>(initialVenues);
  const [guests,  setGuests]  = useState<Guest[]>(initialGuests);
  const [tables,  setTables]  = useState<Table[]>(initialTables);
  const [groups,  setGroups]  = useState<Group[]>(initialGroups);
  const [rules,   setRules]   = useState<Rule[]>(initialRules);

  const [activeVenueId, setActiveVenueId] = useState<string | null>(venues[0]?.id ?? null);
  const [selectedGuest, setSelectedGuest] = useState<string | null>(null);
  const [aiLoading, setAiLoading]         = useState(false);
  const [saveStatus, setSaveStatus]       = useState<"saved" | "saving" | "error">("saved");
  const [toast, setToast]                 = useState<string | null>(null);

  const activeVenue  = venues.find(v => v.id === activeVenueId) ?? venues[0];
  const activeTables = tables.filter(t => t.venue_id === activeVenueId);
  const unseatedCount = guests.filter(g => !g.table_id && g.rsvp !== "declined").length;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* ── Guest CRUD ── */
  const addGuest = useCallback(async (data: Partial<Guest>) => {
    const { data: g, error } = await supabase.from("guests").insert({
      ...data,
      wedding_id: wedding.id,
      rsvp: "pending",
      meal: "standard",
      rsvp_token: crypto.randomUUID(),
    }).select().single();
    if (!error && g) { setGuests(prev => [...prev, g]); showToast("Guest added"); }
  }, [supabase, wedding.id, showToast]);

  const updateGuest = useCallback(async (id: string, data: Partial<Guest>) => {
    const { error } = await supabase.from("guests").update(data).eq("id", id);
    if (!error) setGuests(prev => prev.map(g => g.id === id ? { ...g, ...data } : g));
  }, [supabase]);

  const deleteGuest = useCallback(async (id: string) => {
    await supabase.from("guests").delete().eq("id", id);
    setGuests(prev => prev.filter(g => g.id !== id));
    showToast("Guest removed");
  }, [supabase, showToast]);

  /* ── Table CRUD ── */
  const addTable = useCallback(async (name: string, shape: "round" | "rectangle" | "oval", capacity: number) => {
    if (!activeVenueId) return;
    const { data: t, error } = await supabase.from("tables").insert({
      venue_id: activeVenueId,
      name, shape, capacity,
      x: 100 + Math.random() * 300,
      y: 100 + Math.random() * 200,
    }).select().single();
    if (!error && t) { setTables(prev => [...prev, t]); showToast("Table added"); }
  }, [supabase, activeVenueId, showToast]);

  const updateTable = useCallback(async (id: string, data: Partial<Table>) => {
    await supabase.from("tables").update(data).eq("id", id);
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  }, [supabase]);

  const deleteTable = useCallback(async (id: string) => {
    // Unseat all guests at this table
    await supabase.from("guests").update({ table_id: null, seat_index: null }).eq("table_id", id);
    setGuests(prev => prev.map(g => g.table_id === id ? { ...g, table_id: undefined, seat_index: undefined } : g));
    await supabase.from("tables").delete().eq("id", id);
    setTables(prev => prev.filter(t => t.id !== id));
    showToast("Table removed");
  }, [supabase, showToast]);

  /* ── Venue CRUD ── */
  const addVenue = useCallback(async (name: string) => {
    const { data: v, error } = await supabase.from("venues").insert({
      wedding_id: wedding.id, name
    }).select().single();
    if (!error && v) { setVenues(prev => [...prev, v]); setActiveVenueId(v.id); }
  }, [supabase, wedding.id]);

  /* ── Seat drag & drop ── */
  const seatGuest = useCallback(async (guestId: string, tableId: string | null, seatIndex: number | null) => {
    await updateGuest(guestId, { table_id: tableId ?? undefined, seat_index: seatIndex ?? undefined });
  }, [updateGuest]);

  /* ── AI Seating ── */
  const runAiSeating = useCallback(async () => {
    if (plan === "free" || plan === "couple") {
      showToast("✨ AI seating requires Premium. Upgrade to unlock.");
      return;
    }
    if (!activeVenueId) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/seat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weddingId: wedding.id, venueId: activeVenueId }),
      });
      const data = await res.json();
      if (data.error) { showToast(`AI: ${data.error}`); }
      else {
        // Refresh guests from DB
        const { data: fresh } = await supabase.from("guests").select("*").eq("wedding_id", wedding.id).order("last_name");
        if (fresh) setGuests(fresh);
        showToast(`🤖 ${data.message}`);
      }
    } catch { showToast("AI request failed"); }
    setAiLoading(false);
  }, [supabase, wedding.id, activeVenueId, plan, showToast]);

  /* ── Send RSVP emails ── */
  const sendRsvpEmails = useCallback(async (guestIds: string[]) => {
    const res = await fetch("/api/rsvp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestIds, weddingId: wedding.id }),
    });
    const data = await res.json();
    showToast(data.error ? `Error: ${data.error}` : `📧 Sent ${data.sent} RSVP email${data.sent !== 1 ? "s" : ""}`);
  }, [wedding.id, showToast]);

  /* ── Rules ── */
  const addRule = useCallback(async (guest1Id: string, guest2Id: string, type: "must_sit_with" | "must_not_sit_with") => {
    const { data: r, error } = await supabase.from("rules").insert({
      wedding_id: wedding.id, guest1_id: guest1Id, guest2_id: guest2Id, type
    }).select().single();
    if (!error && r) setRules(prev => [...prev, r]);
  }, [supabase, wedding.id]);

  const deleteRule = useCallback(async (id: string) => {
    await supabase.from("rules").delete().eq("id", id);
    setRules(prev => prev.filter(r => r.id !== id));
  }, [supabase]);

  return (
    <div className="flex flex-col h-screen bg-[#FDFBF8] overflow-hidden">
      {/* ── Top Bar ── */}
      <header className="bg-white border-b border-[#EDE8E0] h-14 flex items-center px-4 gap-3 flex-shrink-0 z-50">
        <Link href="/app" className="flex items-center gap-1.5 mr-2">
          <span className="text-[#C9956E] text-lg">♥</span>
          <span className="font-playfair font-semibold text-[#2A2328] hidden sm:block">TableMate</span>
        </Link>

        <div className="h-5 w-px bg-[#EDE8E0]"/>

        <h1 className="font-medium text-sm text-[#2A2328] truncate max-w-[160px]">{wedding.name}</h1>
        {wedding.date && (
          <span className="text-xs text-[#9B9098] hidden sm:block">
            {new Date(wedding.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        )}

        <div className="flex-1"/>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-4 text-xs text-[#9B9098]">
          <span>{guests.filter(g => g.rsvp === "confirmed").length}/{guests.length} confirmed</span>
          <span className={unseatedCount > 0 ? "text-amber-600 font-semibold" : "text-green-600 font-semibold"}>
            {unseatedCount > 0 ? `${unseatedCount} unseated` : "All seated ✓"}
          </span>
        </div>

        {/* AI Seat button */}
        <button
          onClick={runAiSeating}
          disabled={aiLoading || unseatedCount === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#FDF4EC] border border-[#EDD5BC] text-[#C9956E] hover:bg-[#FDE8D0] disabled:opacity-40 transition-colors"
        >
          {aiLoading ? "🤖 Seating…" : "🤖 AI Seat"}
        </button>

        <Link href={`/app/upgrade`} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${plan === "free" ? "bg-[#C9956E] text-white hover:bg-[#B8845D]" : "hidden"}`}>
          ✨ Upgrade
        </Link>
      </header>

      {/* ── Tab Bar ── */}
      <div className="bg-white border-b border-[#EDE8E0] flex items-center gap-1 px-4 flex-shrink-0">
        {(["chart", "guests", "rules"] as Tab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`py-2.5 px-4 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? "border-[#C9956E] text-[#C9956E]"
                : "border-transparent text-[#9B9098] hover:text-[#4A4348]"
            }`}
          >
            {tab === "chart" ? "📐 Seating Chart" : tab === "guests" ? "👥 Guests" : "📋 Rules"}
          </button>
        ))}

        {/* Venue tabs (chart only) */}
        {activeTab === "chart" && venues.length > 0 && (
          <div className="ml-auto flex items-center gap-1 py-1.5">
            {venues.map(v => (
              <button key={v.id} onClick={() => setActiveVenueId(v.id)}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                  activeVenueId === v.id
                    ? "bg-[#C9956E] text-white"
                    : "bg-[#F5F1EC] text-[#6B6068] hover:bg-[#EDE8E0]"
                }`}
              >{v.name}</button>
            ))}
            <button onClick={() => {
              const name = window.prompt("New floor / venue name:");
              if (name?.trim()) addVenue(name.trim());
            }} className="px-2 py-1 text-xs text-[#9B9098] hover:text-[#C9956E] transition-colors">+ Add floor</button>
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "chart" && (
          <ChartCanvas
            tables={activeTables}
            guests={guests}
            groups={groups}
            rules={rules}
            onAddTable={addTable}
            onUpdateTable={updateTable}
            onDeleteTable={deleteTable}
            onSeatGuest={seatGuest}
          />
        )}
        {activeTab === "guests" && (
          <GuestPanel
            guests={guests}
            groups={groups}
            tables={activeTables}
            plan={plan}
            onAddGuest={addGuest}
            onUpdateGuest={updateGuest}
            onDeleteGuest={deleteGuest}
            onSendRsvp={sendRsvpEmails}
            onAddGroup={async (name) => {
              const { data: g } = await supabase.from("groups").insert({ wedding_id: wedding.id, name }).select().single();
              if (g) setGroups(prev => [...prev, g]);
            }}
          />
        )}
        {activeTab === "rules" && (
          <RulesPanel
            rules={rules}
            guests={guests}
            onAddRule={addRule}
            onDeleteRule={deleteRule}
          />
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#2A2328] text-white text-sm font-medium px-5 py-3 rounded-xl shadow-xl z-[999] animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
