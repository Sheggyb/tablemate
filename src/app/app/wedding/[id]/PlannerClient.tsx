"use client";

import { useState, useCallback, useReducer, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Wedding, Venue, Guest, Table, Group, Rule, Rsvp, Meal } from "@/lib/types";
import GuestPanel from "./GuestPanel";
import ChartCanvas from "./ChartCanvas";
import RulesPanel from "./RulesPanel";
import ExportPanel from "./ExportPanel";
import MobilePlanner from "./MobilePlanner";
import WishingWall from "./WishingWall";

type Tab = "chart" | "guests" | "rules" | "export" | "wishes";

interface Props {
  wedding:       Wedding;
  initialVenues: Venue[];
  initialGuests: Guest[];
  initialTables: Table[];
  initialGroups: Group[];
  initialRules:  Rule[];
  plan:          string;
  isDemo?:       boolean;
}

interface PlannerState {
  venues:  Venue[];
  guests:  Guest[];
  tables:  Table[];
  groups:  Group[];
  rules:   Rule[];
}

type PlannerAction =
  | { type: "SET_ALL"; payload: PlannerState }
  | { type: "ADD_VENUE";    payload: Venue }
  | { type: "ADD_TABLE";    payload: Table }
  | { type: "UPDATE_TABLE"; id: string; data: Partial<Table> }
  | { type: "DELETE_TABLE"; id: string }
  | { type: "ADD_GUEST";    payload: Guest }
  | { type: "UPDATE_GUEST"; id: string; data: Partial<Guest> }
  | { type: "DELETE_GUEST"; id: string }
  | { type: "ADD_GROUP";    payload: Group }
  | { type: "ADD_RULE";     payload: Rule }
  | { type: "DELETE_RULE";  id: string }
  | { type: "BULK_UPDATE_GUESTS"; ids: string[]; data: Partial<Guest> }
  | { type: "BULK_DELETE_GUESTS"; ids: string[] };

function reducer(state: PlannerState, action: PlannerAction): PlannerState {
  switch (action.type) {
    case "SET_ALL": return action.payload;
    case "ADD_VENUE":    return { ...state, venues: [...state.venues, action.payload] };
    case "ADD_TABLE":    return { ...state, tables: [...state.tables, action.payload] };
    case "UPDATE_TABLE": return { ...state, tables: state.tables.map(t => t.id === action.id ? { ...t, ...action.data } : t) };
    case "DELETE_TABLE": return {
      ...state,
      tables: state.tables.filter(t => t.id !== action.id),
      guests: state.guests.map(g => g.table_id === action.id ? { ...g, table_id: null, seat_index: null } : g),
    };
    case "ADD_GUEST":    return { ...state, guests: [...state.guests, action.payload] };
    case "UPDATE_GUEST": return { ...state, guests: state.guests.map(g => g.id === action.id ? { ...g, ...action.data } : g) };
    case "DELETE_GUEST": return { ...state, guests: state.guests.filter(g => g.id !== action.id) };
    case "ADD_GROUP":    return { ...state, groups: [...state.groups, action.payload] };
    case "ADD_RULE":     return { ...state, rules: [...state.rules, action.payload] };
    case "DELETE_RULE":  return { ...state, rules: state.rules.filter(r => r.id !== action.id) };
    case "BULK_UPDATE_GUESTS": return {
      ...state,
      guests: state.guests.map(g => action.ids.includes(g.id) ? { ...g, ...action.data } : g),
    };
    case "BULK_DELETE_GUESTS": return {
      ...state,
      guests: state.guests.filter(g => !action.ids.includes(g.id)),
    };
    default: return state;
  }
}

const MAX_UNDO = 30;

export default function PlannerClient({
  wedding, initialVenues, initialGuests, initialTables, initialGroups, initialRules, plan, isDemo = false
}: Props) {
  const supabase = createClient();
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("chart");
  const [activeVenueId, setActiveVenueId] = useState<string | null>(initialVenues[0]?.id ?? null);
  const [aiLoading, setAiLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type?: "success" | "error" | "info" } | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPartiesModal, setShowPartiesModal] = useState(false);
  const [showMealsModal, setShowMealsModal] = useState(false);
  const [weddingName, setWeddingName] = useState(wedding.name);
  const [venueName, setVenueName] = useState("");

  // Undo/redo stacks
  const [history, setHistory] = useState<PlannerState[]>([]);
  const [future, setFuture] = useState<PlannerState[]>([]);
  const skipHistory = useRef(false);

  const [state, dispatch] = useReducer(reducer, {
    venues:  initialVenues,
    guests:  initialGuests,
    tables:  initialTables,
    groups:  initialGroups,
    rules:   initialRules,
  });

  // Push to undo history on every state change
  const prevState = useRef<PlannerState>(state);
  useEffect(() => {
    if (skipHistory.current) { skipHistory.current = false; return; }
    if (prevState.current !== state) {
      setHistory(h => [...h.slice(-MAX_UNDO + 1), prevState.current]);
      setFuture([]);
      prevState.current = state;
    }
  }, [state]);

  // Dark mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("tm-theme");
    if (saved === "dark") setDarkMode(true);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("tm-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const showToast = useCallback((msg: string, type: "success" | "error" | "info" = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const undo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    skipHistory.current = true;
    setFuture(f => [state, ...f]);
    setHistory(h => h.slice(0, -1));
    dispatch({ type: "SET_ALL", payload: prev });
    prevState.current = prev;
  };

  const redo = () => {
    if (!future.length) return;
    const next = future[0];
    skipHistory.current = true;
    setHistory(h => [...h, state]);
    setFuture(f => f.slice(1));
    dispatch({ type: "SET_ALL", payload: next });
    prevState.current = next;
  };

  const activeTables = state.tables.filter(t => t.venue_id === activeVenueId);
  const unseatedCount = state.guests.filter(g => !g.table_id && g.rsvp !== "declined").length;
  const confirmedCount = state.guests.filter(g => g.rsvp === "confirmed").length;

  // Check seating rule violations
  const violations = state.rules.filter(r => {
    const g1 = state.guests.find(g => g.id === r.guest1_id);
    const g2 = state.guests.find(g => g.id === r.guest2_id);
    if (!g1 || !g2) return false;
    const together = g1.table_id && g1.table_id === g2.table_id;
    return r.type === "must_sit_with" ? !together : !!together;
  });

  /* ── Guest CRUD ── */
  const addGuest = useCallback(async (data: Partial<Guest>) => {
    if (plan === "free") {
      const { count } = await supabase
        .from("guests")
        .select("*", { count: "exact", head: true })
        .eq("wedding_id", wedding.id);
      if (count !== null && count >= 50) {
        showToast("Free plan limit: 50 guests. Upgrade to add more.", "error");
        return;
      }
    }
    const newGuest: Guest = {
      id: crypto.randomUUID(),
      wedding_id: wedding.id,
      first_name: data.first_name || "",
      last_name: data.last_name || "",
      email: data.email || null,
      phone: data.phone || null,
      rsvp: (data.rsvp as Rsvp) || "pending",
      meal: (data.meal as Meal) || "standard",
      allergies: data.allergies || null,
      notes: data.notes || null,
      group_id: data.group_id || null,
      table_id: null,
      seat_index: null,
      rsvp_token: crypto.randomUUID(),
    };
    dispatch({ type: "ADD_GUEST", payload: newGuest });
    showToast("Guest added ✓", "success");
    // Persist async
    if (!isDemo) supabase.from("guests").insert({ ...newGuest }).then(({ error }) => {
      if (error) console.error("Insert guest failed:", error.message);
    });
  }, [supabase, wedding.id, showToast, plan]);

  const updateGuest = useCallback(async (id: string, data: Partial<Guest>) => {
    dispatch({ type: "UPDATE_GUEST", id, data });
    if (!isDemo) supabase.from("guests").update(data).eq("id", id).then(({ error }) => {
      if (error) console.error("Update guest failed:", error.message);
    });
  }, [supabase, isDemo]);

  const deleteGuest = useCallback(async (id: string) => {
    dispatch({ type: "DELETE_GUEST", id });
    showToast("Guest removed", "info");
    if (!isDemo) supabase.from("guests").delete().eq("id", id).then();
  }, [supabase, isDemo, showToast]);

  const bulkUpdateGuests = useCallback(async (ids: string[], data: Partial<Guest>) => {
    dispatch({ type: "BULK_UPDATE_GUESTS", ids, data });
    // Batch update
    if (!isDemo) for (const id of ids) supabase.from("guests").update(data).eq("id", id).then();
  }, [supabase, isDemo]);

  const bulkDeleteGuests = useCallback(async (ids: string[]) => {
    dispatch({ type: "BULK_DELETE_GUESTS", ids });
    showToast(`${ids.length} guests removed`, "info");
    if (!isDemo) for (const id of ids) supabase.from("guests").delete().eq("id", id).then();
  }, [supabase, isDemo, showToast]);

  /* ── Table CRUD ── */
  const addTable = useCallback(async (name: string, shape: "round" | "rectangle" | "oval", capacity: number) => {
    if (!activeVenueId) return;
    const newTable: Table = {
      id: crypto.randomUUID(),
      wedding_id: wedding.id,
      venue_id: activeVenueId,
      name,
      shape,
      capacity,
      x: 80 + Math.random() * 400,
      y: 80 + Math.random() * 300,
    };
    dispatch({ type: "ADD_TABLE", payload: newTable });
    showToast(`${name} added`, "success");
    if (!isDemo) supabase.from("tables").insert(newTable).then(({ error }) => {
      if (error) console.error("Insert table failed:", error.message);
    });
  }, [supabase, isDemo, activeVenueId, showToast]);

  const updateTable = useCallback(async (id: string, data: Partial<Table>) => {
    dispatch({ type: "UPDATE_TABLE", id, data });
    if (!isDemo) {
    const { wedding_id, ...safeData } = data as any;
    supabase.from("tables").update(safeData).eq("id", id).then(({ error }) => {
      if (error) console.error("Update table failed:", error.message);
    });
    }
  }, [supabase, isDemo]);

  const deleteTable = useCallback(async (id: string) => {
    dispatch({ type: "DELETE_TABLE", id });
    showToast("Table removed", "info");
    if (!isDemo) {
    supabase.from("guests").update({ table_id: null, seat_index: null }).eq("table_id", id).then();
    supabase.from("tables").delete().eq("id", id).then();
    }
  }, [supabase, isDemo, showToast]);

  /* ── Venue CRUD ── */
  const addVenue = useCallback(async (name: string) => {
    const newVenue: Venue = {
      id: crypto.randomUUID(),
      wedding_id: wedding.id,
      name,
      background_image: null,
      bg_opacity: 0.15,
      sort_order: state.venues.length,
    };
    dispatch({ type: "ADD_VENUE", payload: newVenue });
    setActiveVenueId(newVenue.id);
    if (!isDemo) supabase.from("venues").insert(newVenue).then();
  }, [supabase, isDemo, wedding.id, state.venues.length]);

  /* ── Seat guest ── */
  const seatGuest = useCallback(async (guestId: string, tableId: string | null, seatIndex: number | null) => {
    dispatch({ type: "UPDATE_GUEST", id: guestId, data: { table_id: tableId, seat_index: seatIndex } });
    if (!isDemo) supabase.from("guests").update({ table_id: tableId, seat_index: seatIndex }).eq("id", guestId).then();
  }, [supabase, isDemo]);

  /* ── AI Seating ── */
  const runAiSeating = useCallback(async () => {
    if (plan === "free" || plan === "couple") {
      showToast("✨ AI seating requires Premium. Upgrade to unlock.", "error");
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
      if (data.error) { showToast(`AI: ${data.error}`, "error"); }
      else {
        const { data: fresh } = await supabase.from("guests").select("*").eq("wedding_id", wedding.id).order("last_name");
        if (fresh) dispatch({ type: "SET_ALL", payload: { ...state, guests: fresh } });
        showToast(`🤖 ${data.message}`, "success");
      }
    } catch { showToast("AI request failed", "error"); }
    setAiLoading(false);
  }, [supabase, wedding.id, activeVenueId, plan, state, showToast]);

  /* ── Auto-seat (simple greedy, no AI) ── */
  const autoSeat = useCallback(() => {
    const unassigned = state.guests.filter(g => !g.table_id && g.rsvp !== "declined");
    if (!unassigned.length) { showToast("All guests are already seated!", "info"); return; }
    const updatedGuests = [...state.guests];
    // Group by group_id first
    const grouped = unassigned.reduce<Record<string, Guest[]>>((acc, g) => {
      const key = g.group_id || "__nogroup__" + g.id;
      if (!acc[key]) acc[key] = [];
      acc[key].push(g);
      return acc;
    }, {});
    for (const grp of Object.values(grouped)) {
      for (const guest of grp) {
        const table = activeTables.find(t => {
          const seated = updatedGuests.filter(g => g.table_id === t.id).length;
          return seated < t.capacity;
        });
        if (!table) break;
        const idx = updatedGuests.findIndex(g => g.id === guest.id);
        if (idx >= 0) {
          const seated = updatedGuests.filter(g => g.table_id === table.id);
          const usedSeats = new Set(seated.map(g => g.seat_index).filter(s => s != null));
          let si = 0; while (usedSeats.has(si)) si++;
          updatedGuests[idx] = { ...updatedGuests[idx], table_id: table.id, seat_index: si };
        }
      }
    }
    dispatch({ type: "SET_ALL", payload: { ...state, guests: updatedGuests } });
    const seatedNow = updatedGuests.filter(g => g.table_id && !state.guests.find(og => og.id === g.id)?.table_id).length;
    showToast(`✨ Auto-seated ${seatedNow} guests`, "success");

    if (!isDemo) {
      for (const g of updatedGuests) {
        const orig = state.guests.find(og => og.id === g.id);
        if (orig && (orig.table_id !== g.table_id || orig.seat_index !== g.seat_index)) {
          supabase.from("guests").update({ table_id: g.table_id, seat_index: g.seat_index }).eq("id", g.id).then();
        }
      }
    }
  }, [state, activeTables, showToast, supabase, isDemo]);

  /* ── Rules ── */
  const addRule = useCallback(async (guest1Id: string, guest2Id: string, type: "must_sit_with" | "must_not_sit_with") => {
    const newRule: Rule = {
      id: crypto.randomUUID(),
      wedding_id: wedding.id,
      guest1_id: guest1Id,
      guest2_id: guest2Id,
      type,
    };
    dispatch({ type: "ADD_RULE", payload: newRule });
    if (!isDemo) supabase.from("rules").insert(newRule).then();
  }, [supabase, isDemo, wedding.id]);

  const deleteRule = useCallback(async (id: string) => {
    dispatch({ type: "DELETE_RULE", id });
    if (!isDemo) supabase.from("rules").delete().eq("id", id).then();
  }, [supabase, isDemo]);

  /* ── Groups ── */
  const addGroup = useCallback(async (name: string) => {
    const colors = ["#c9a96e","#7B9E87","#8B7BA8","#C97B6E","#6E9EC9","#B8A86E","#e8b4cb","#9EC9A6"];
    const newGroup: Group = {
      id: crypto.randomUUID(),
      wedding_id: wedding.id,
      name,
      color: colors[state.groups.length % colors.length],
      invite_code: null,
    };
    dispatch({ type: "ADD_GROUP", payload: newGroup });
    if (!isDemo) supabase.from("groups").insert(newGroup).then();
  }, [supabase, isDemo, wedding.id, state.groups.length]);

  /* ── CSV Import ── */
  const importCsv = useCallback(async (text: string): Promise<string> => {
    const lines = text.split("\n").filter(Boolean);
    if (!lines.length) return "Empty file";
    const header = lines[0].toLowerCase().split(",").map(h => h.trim().replace(/"/g, ""));
    const getCol = (row: string[], col: string) => {
      const i = header.indexOf(col);
      return i >= 0 ? row[i]?.trim().replace(/"/g, "") ?? "" : "";
    };
    let added = 0;
    for (const line of lines.slice(1)) {
      const cols = line.split(",");
      const first = getCol(cols, "first_name") || getCol(cols, "firstname") || getCol(cols, "first");
      const last = getCol(cols, "last_name") || getCol(cols, "lastname") || getCol(cols, "last");
      const email = getCol(cols, "email");
      const rsvp = (getCol(cols, "rsvp") || "pending") as Rsvp;
      const meal = (getCol(cols, "meal") || "standard") as Meal;
      if (!first && !last) continue;
      await addGuest({ first_name: first, last_name: last, email, rsvp, meal });
      added++;
    }
    return added > 0 ? `Imported ${added} guests ✓` : "No guests found. CSV must have first_name/last_name columns.";
  }, [addGuest]);

  // S-style: surface/border/text use CSS vars via inline styles
  const cs = {
    bg: "var(--bg)",
    surface: "var(--surface)",
    surface2: "var(--surface2)",
    border: "var(--border)",
    borderSoft: "var(--border-soft)",
    text: "var(--text)",
    textMid: "var(--text-mid)",
    textSoft: "var(--text-soft)",
    textMuted: "var(--text-muted)",
    accent: "var(--accent)",
    accentDark: "var(--accent-dark)",
    accentBg: "var(--accent-bg)",
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: cs.bg, color: cs.text }}>

      {/* ── Mobile View ── */}
      {isMobile && (
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <MobilePlanner
          wedding={wedding}
          tables={state.tables}
          guests={state.guests}
          groups={state.groups}
          rules={state.rules}
          dispatch={dispatch}
          dark={darkMode}
          onToggleDark={() => setDarkMode(d => !d)}
          isDemo={isDemo}
          addTable={addTable}
        />
        </div>
      )}

      {/* ── Desktop View ── */}
      {!isMobile && (<>

      {/* ── Top Bar ── */}
      <header
        className="h-14 flex items-center px-4 gap-3 flex-shrink-0 z-50"
        style={{ background: cs.surface, borderBottom: `1px solid ${cs.border}` }}
      >
        <Link href="/app" className="flex items-center gap-1.5 mr-1">
          <span style={{ color: cs.accent }} className="text-xl">♥</span>
          <span className="font-playfair font-semibold hidden sm:block" style={{ color: cs.text }}>TableMate</span>
        </Link>
        <div className="h-5 w-px" style={{ background: cs.border }}/>
        <h1 className="font-medium text-sm truncate max-w-[160px]" style={{ color: cs.text }}>{weddingName}</h1>
        {wedding.date && (
          <span className="text-xs hidden sm:block" style={{ color: cs.textMuted }}>
            {new Date(wedding.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        )}

        <div className="flex-1"/>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-4 text-xs" style={{ color: cs.textMuted }}>
          <span>{confirmedCount}/{state.guests.length} confirmed</span>
          <span style={{ color: unseatedCount > 0 ? "var(--warning)" : "var(--success)", fontWeight: 600 }}>
            {unseatedCount > 0 ? `${unseatedCount} unseated` : "All seated ✓"}
          </span>
        </div>

        {/* Undo / Redo */}
        <button onClick={undo} disabled={!history.length} title="Undo"
          className="px-2 py-1.5 rounded-lg text-sm disabled:opacity-30 hover:opacity-80"
          style={{ background: cs.surface2, color: cs.textSoft }}>↩</button>
        <button onClick={redo} disabled={!future.length} title="Redo"
          className="px-2 py-1.5 rounded-lg text-sm disabled:opacity-30 hover:opacity-80"
          style={{ background: cs.surface2, color: cs.textSoft }}>↪</button>

        {/* Meals */}
        <button onClick={() => setShowMealsModal(true)}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs hover:opacity-80"
          style={{ background: cs.surface2, color: cs.textSoft }}>🍽 Meals</button>

        {/* Parties */}
        <button onClick={() => setShowPartiesModal(true)}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs hover:opacity-80"
          style={{ background: cs.surface2, color: cs.textSoft }}>👥 Parties</button>

        {/* Violations badge */}
        {violations.length > 0 && (
          <button onClick={() => setActiveTab("rules")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: "rgba(224,92,106,0.15)", color: "var(--danger)", border: "1px solid rgba(224,92,106,0.3)" }}>
            ⚠ {violations.length} violation{violations.length !== 1 ? "s" : ""}
          </button>
        )}

        {/* AI Seat */}
        <button onClick={runAiSeating} disabled={aiLoading || unseatedCount === 0}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg disabled:opacity-40"
          style={{ background: cs.accentBg, border: `1px solid ${cs.accent}`, color: cs.accent }}>
          {aiLoading ? "🤖 Seating…" : "🤖 AI Seat"}
        </button>

        {/* Dark mode toggle */}
        <button onClick={() => setDarkMode(d => !d)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:opacity-80 text-sm"
          title={darkMode ? "Light mode" : "Dark mode"}
          style={{ background: cs.surface2, color: cs.textSoft }}>
          {darkMode ? "☀️" : "🌙"}
        </button>

        {/* Settings */}
        <button onClick={() => setShowSettings(true)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:opacity-80 text-sm"
          style={{ background: cs.surface2, color: cs.textSoft }}>⚙</button>

        {plan === "free" && !isDemo && (
          <Link href="/app/upgrade"
            className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white"
            style={{ background: cs.accent }}>
            ✨ Upgrade
          </Link>
        )}
        {isDemo && (
          <>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: cs.accentBg, color: cs.accent, border: `1px solid ${cs.border}` }}>Demo Mode</span>
            <span className="text-xs hidden sm:block" style={{ color: cs.textMuted }}>Changes don't save</span>
            <Link href="/signup" className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white" style={{ background: cs.accent }}>
              Create My Wedding →
            </Link>
          </>
        )}
      </header>

      {/* ── Tab Bar ── */}
      <div
        className="flex items-center gap-0.5 px-4 flex-shrink-0"
        style={{ background: cs.surface, borderBottom: `1px solid ${cs.border}` }}
      >
        {([["chart","📐 Seating Chart"], ["guests","👥 Guests"], ["rules","📋 Rules"], ["export","📤 Export"], ["wishes","💌 Wishes"]] as [Tab,string][]).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="py-2.5 px-4 text-sm font-medium border-b-2 transition-colors capitalize"
            style={{
              borderBottomColor: activeTab === tab ? "var(--accent)" : "transparent",
              color: activeTab === tab ? "var(--accent)" : "var(--text-muted)",
            }}>
            {label}
          </button>
        ))}

        {/* Venue tabs (chart only) */}
        {activeTab === "chart" && state.venues.length > 0 && (
          <div className="ml-auto flex items-center gap-1 py-1.5">
            {state.venues.map(v => (
              <button key={v.id} onClick={() => setActiveVenueId(v.id)}
                className="px-3 py-1 text-xs rounded-lg font-medium transition-colors"
                style={{
                  background: activeVenueId === v.id ? cs.accent : cs.surface2,
                  color: activeVenueId === v.id ? "white" : cs.textSoft,
                }}>{v.name}</button>
            ))}
            <button onClick={() => {
              const name = window.prompt("New floor / venue name:");
              if (name?.trim()) addVenue(name.trim());
            }} className="px-2 py-1 text-xs hover:opacity-80" style={{ color: cs.textMuted }}>+ Add floor</button>
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "chart" && (
          <ChartCanvas
            tables={activeTables}
            guests={state.guests}
            groups={state.groups}
            rules={state.rules}
            darkMode={darkMode}
            onAddTable={addTable}
            onUpdateTable={updateTable}
            onDeleteTable={deleteTable}
            onSeatGuest={seatGuest}
            onAutoSeat={autoSeat}
          />
        )}
        {activeTab === "guests" && (
          <GuestPanel
            guests={state.guests}
            groups={state.groups}
            tables={state.tables}
            plan={plan}
            darkMode={darkMode}
            weddingId={wedding.id}
            isDemo={isDemo}
            onAddGuest={addGuest}
            onUpdateGuest={updateGuest}
            onDeleteGuest={deleteGuest}
            onBulkUpdate={bulkUpdateGuests}
            onBulkDelete={bulkDeleteGuests}
            onImportCsv={importCsv}
            onAddGroup={addGroup}
            showToast={showToast}
          />
        )}
        {activeTab === "rules" && (
          <RulesPanel
            rules={state.rules}
            guests={state.guests}
            tables={state.tables}
            violations={violations}
            darkMode={darkMode}
            isDemo={isDemo}
            onAddRule={addRule}
            onDeleteRule={deleteRule}
          />
        )}
        {activeTab === "export" && (
          <ExportPanel
            wedding={{ ...wedding, name: weddingName }}
            guests={state.guests}
            tables={state.tables}
            groups={state.groups}
            venues={state.venues}
            rules={state.rules}
            darkMode={darkMode}
            isDemo={isDemo}
            onRestore={(data) => {
              dispatch({ type: "SET_ALL", payload: data });
              showToast("Backup restored ✓", "success");
            }}
            showToast={showToast}
          />
        )}
        {activeTab === "wishes" && (
          <WishingWall
            weddingId={wedding.id}
            shareCode={wedding.share_code}
            dark={darkMode}
            isDemo={isDemo}
          />
        )}
      </div>
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-in"
            style={{ background: cs.surface, border: `1px solid ${cs.border}` }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-playfair text-lg font-bold" style={{ color: cs.text }}>Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-xl leading-none hover:opacity-60" style={{ color: cs.textMuted }}>×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: cs.textSoft }}>Wedding name</label>
                <input type="text" value={weddingName} onChange={e => setWeddingName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{ background: cs.surface2, borderColor: cs.borderSoft, color: cs.text }}/>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: cs.textSoft }}>Venue / floor name</label>
                <input type="text" value={venueName}
                  onChange={e => setVenueName(e.target.value)}
                  placeholder={state.venues[0]?.name || "Main Hall"}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{ background: cs.surface2, borderColor: cs.borderSoft, color: cs.text }}/>
              </div>

            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowSettings(false)}
                className="flex-1 py-2.5 rounded-xl text-sm hover:opacity-80"
                style={{ border: `1px solid ${cs.borderSoft}`, color: cs.textSoft }}>
                Cancel
              </button>
              <button onClick={() => {
                setShowSettings(false);
                if (venueName.trim() && state.venues[0]) {
                  supabase.from("venues").update({ name: venueName.trim() }).eq("id", state.venues[0].id).then();
                }
                if (!isDemo && weddingName !== wedding.name) {
                  supabase.from("weddings").update({ name: weddingName }).eq("id", wedding.id).then();
                }
                showToast("Settings saved", "success");
              }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: cs.accent }}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Parties Modal ── */}
      {showPartiesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-in"
            style={{ background: cs.surface, border: `1px solid ${cs.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-playfair text-lg font-bold" style={{ color: cs.text }}>👥 Parties / Groups</h3>
              <button onClick={() => setShowPartiesModal(false)} className="text-xl leading-none hover:opacity-60" style={{ color: cs.textMuted }}>×</button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {state.groups.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: cs.textMuted }}>No groups yet.</p>
              )}
              {state.groups.map(g => {
                const count = state.guests.filter(gu => gu.group_id === g.id).length;
                return (
                  <div key={g.id} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                    style={{ background: cs.surface2 }}>
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: g.color }}/>
                    <span className="text-sm flex-1" style={{ color: cs.text }}>{g.name}</span>
                    <span className="text-xs" style={{ color: cs.textMuted }}>{count} guest{count !== 1 ? "s" : ""}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="New group name…" id="new-group-name"
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                style={{ background: cs.surface2, borderColor: cs.borderSoft, color: cs.text }}/>
              <button onClick={() => {
                const inp = document.getElementById("new-group-name") as HTMLInputElement;
                if (inp.value.trim()) { addGroup(inp.value.trim()); inp.value = ""; }
              }} className="px-3 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: cs.accent }}>+ Add</button>
            </div>
            <button onClick={() => setShowPartiesModal(false)}
              className="w-full mt-3 py-2 rounded-xl text-sm hover:opacity-80"
              style={{ border: `1px solid ${cs.borderSoft}`, color: cs.textSoft }}>Close</button>
          </div>
        </div>
      )}

      {/* ── Meals Modal ── */}
      {showMealsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-in"
            style={{ background: cs.surface, border: `1px solid ${cs.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-playfair text-lg font-bold" style={{ color: cs.text }}>🍽 Meal Summary</h3>
              <button onClick={() => setShowMealsModal(false)} className="text-xl leading-none hover:opacity-60" style={{ color: cs.textMuted }}>×</button>
            </div>
            <div className="space-y-2">
              {Object.entries(
                state.guests.filter(g => g.rsvp !== "declined").reduce<Record<string, number>>((acc, g) => {
                  const m = g.meal || "standard";
                  acc[m] = (acc[m] || 0) + 1;
                  return acc;
                }, {})
              ).map(([meal, count]) => (
                <div key={meal} className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ background: cs.surface2 }}>
                  <span className="text-sm capitalize" style={{ color: cs.text }}>{meal}</span>
                  <span className="font-semibold text-sm" style={{ color: cs.accent }}>{count}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowMealsModal(false)}
              className="w-full mt-4 py-2 rounded-xl text-sm hover:opacity-80"
              style={{ border: `1px solid ${cs.borderSoft}`, color: cs.textSoft }}>Close</button>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-sm font-medium px-5 py-3 rounded-xl shadow-xl z-[999] animate-fade-in flex items-center gap-2"
          style={{
            background: toast.type === "error" ? "var(--danger)" : toast.type === "success" ? "var(--success)" : "var(--surface2)",
            color: toast.type === "error" || toast.type === "success" ? "white" : "var(--text)",
            border: `1px solid var(--border)`,
          }}>
          {toast.msg}
        </div>
      )}
      </>)}
    </div>
  );
}
