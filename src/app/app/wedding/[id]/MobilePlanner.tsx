"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type { Dispatch } from "react";
import type { Wedding, Table, Guest, Group, Rule, Meal, Rsvp } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

type PlannerAction =
  | { type: "SET_ALL"; payload: { venues: any[]; guests: Guest[]; tables: Table[]; groups: Group[]; rules: Rule[] } }
  | { type: "ADD_VENUE";    payload: any }
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

import WishingWall from "./WishingWall";
import MobileWishes from "./MobileWishes";

interface Props {
  wedding:  Wedding;
  tables:   Table[];
  guests:   Guest[];
  groups:   Group[];
  rules:    Rule[];
  dispatch: Dispatch<PlannerAction>;
  dark:     boolean;
  onToggleDark: () => void;
  isDemo?:  boolean;
  addTable?: (name: string, shape: "round" | "rectangle" | "oval", capacity: number) => void;
  plan?: string;
}

// ── Updated tab type: overview | tables | guests | more
type MobileTab = "overview" | "tables" | "guests" | "more";

const MEAL_ICON: Record<string, string> = {
  standard: "🍽️", vegetarian: "🥗", vegan: "🌱",
  "gluten-free": "🌾", halal: "☪️", kosher: "✡️", children: "🧒",
  chicken: "🍗", fish: "🐟",
};
const MEALS_ALL = ["standard","vegetarian","vegan","gluten-free","halal","kosher","children","chicken","fish"];
const RSVP_OPTIONS: Rsvp[] = ["pending", "confirmed", "declined"];
const RSVP_LABEL: Record<string, string> = { confirmed: "✅ Confirmed", pending: "⏳ Pending", declined: "❌ Declined" };

function shapeEmoji(shape: string) {
  return shape === "round" || shape === "oval" ? "🔵" : "⬜";
}

// ── Backdrop must live OUTSIDE MobilePlanner so React never remounts it on re-render.
// If defined inside the component, every keystroke causes React to see a brand-new
// component type → unmount/remount → mobile keyboard dismisses on every character.
function Backdrop({
  onClose, children, cardBg, borderColor,
}: {
  onClose: () => void;
  children: React.ReactNode;
  cardBg: string;
  borderColor: string;
}) {
  return (
    <div
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:200, display:"flex", alignItems:"flex-end" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background:cardBg, borderRadius:"20px 20px 0 0", width:"100%", padding:"24px 20px 40px",
        maxHeight:"85vh", overflowY:"auto", boxShadow:"0 -8px 32px rgba(0,0,0,0.3)",
        border:`1px solid ${borderColor}` }}>
        {children}
      </div>
    </div>
  );
}

export default function MobilePlanner({ wedding, tables, guests, groups, rules, dispatch, dark, onToggleDark, isDemo = false, addTable, plan = "free" }: Props) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<MobileTab>("overview");
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  // ── Table view mode
  const [tableViewMode, setTableViewMode] = useState<"card" | "list">("card");

  // ── Guest modals ──
  const [showAddGuest, setShowAddGuest]   = useState(false);
  const [editGuest, setEditGuest]         = useState<Guest | null>(null);
  const [guestForm, setGuestForm]         = useState<Partial<Guest>>({ first_name: "", last_name: "", email: "", meal: "standard", rsvp: "pending" });

  // ── Table modals ──
  const [editTable, setEditTable]         = useState<Table | null>(null);
  const [tableNameEdit, setTableNameEdit] = useState("");

  // ── Seat guest modal ──
  const [seatGuest, setSeatGuest]         = useState<Guest | null>(null);

  // ── Rule modal ──
  const [showAddRule, setShowAddRule]     = useState(false);
  const [ruleGuest1, setRuleGuest1]       = useState("");
  const [ruleGuest2, setRuleGuest2]       = useState("");
  const [ruleType, setRuleType]           = useState<"must_sit_with"|"must_not_sit_with">("must_not_sit_with");

  // ── Search ──
  const [guestSearch, setGuestSearch]     = useState("");
  const [tableSearch, setTableSearch]     = useState("");

  // ── Add Table (mobile) ──
  const [showAddTable, setShowAddTable]   = useState(false);
  const [newTableName, setNewTableName]   = useState("");
  const [newTableShape, setNewTableShape] = useState<"round"|"rectangle"|"oval">("round");
  const [newTableCap, setNewTableCap]     = useState(8);

  // ── More sheet ──
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  // ── Table detail sheet ──
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [showSeatGuestSheet, setShowSeatGuestSheet] = useState(false);
  const [tableSheetNameEdit, setTableSheetNameEdit] = useState(false);
  const [tableSheetNameVal, setTableSheetNameVal] = useState("");

  // ── Quick seat (from guests tab) ──
  const [quickSeatGuest, setQuickSeatGuest] = useState<Guest | null>(null);

  // ── Wishes ──
  const [showWishes, setShowWishes] = useState(false);

  // ── Guest search in seat sheet ──
  const [seatSearch, setSeatSearch] = useState("");

  // ── Colors ──
  const bg       = dark ? "#1A1718" : "#F9F7F5";
  const card     = dark ? "#2C2628" : "#FFFFFF";
  const accent   = "#D49A7C";
  const text     = dark ? "#EDE8E3" : "#2A1F1A";
  const textMid  = dark ? "#C4B8B0" : "#6B5A52";
  const textMuted= dark ? "#8A7D76" : "#9E8E86";
  const border   = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const surface2 = dark ? "#352E30" : "#F0EAE4";
  const danger   = "#E05C6A";
  const success  = "#4CAF7D";
  const warning  = "#F0A858";

  const rsvpColor = (rsvp?: string) =>
    rsvp === "confirmed" ? success : rsvp === "declined" ? danger : warning;

  const inputStyle: React.CSSProperties = {
    background: surface2, border: `1px solid ${border}`, color: text,
    borderRadius: 10, padding: "10px 12px", fontSize: 14, width: "100%", outline: "none",
    appearance: "none",
  };

  // ── Violations ──
  const violations = rules.filter(r => {
    const g1 = guests.find(g => g.id === r.guest1_id);
    const g2 = guests.find(g => g.id === r.guest2_id);
    if (!g1 || !g2) return false;
    const together = g1.table_id && g1.table_id === g2.table_id;
    return r.type === "must_sit_with" ? !together : !!together;
  });

  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  // ── Loading & error states ──
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const showError = (msg: string) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(null), 4000); };

  // ── Actions ──
  const unseatGuest = async (guestId: string) => {
    dispatch({ type: "UPDATE_GUEST", id: guestId, data: { table_id: null, seat_index: null } });
    if (!isDemo) {
      const { error } = await supabase.from("guests").update({ table_id: null, seat_index: null }).eq("id", guestId);
      if (error) showError("Failed to unseat guest — changes may not save.");
    }
  };

  const seatGuestToTable = async (guest: Guest, tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    const seated = guests.filter(g => g.table_id === tableId).length;
    if (seated >= table.capacity) return;
    dispatch({ type: "UPDATE_GUEST", id: guest.id, data: { table_id: tableId, seat_index: seated } });
    if (!isDemo) {
      const { error } = await supabase.from("guests").update({ table_id: tableId, seat_index: seated }).eq("id", guest.id);
      if (error) showError("Failed to save seat — changes may not persist.");
    }
    setSeatGuest(null);
    showToast("Guest seated ✓");
  };

  const updateGuestRsvp = async (guest: Guest, rsvp: Rsvp) => {
    dispatch({ type: "UPDATE_GUEST", id: guest.id, data: { rsvp } });
    if (!isDemo) {
      const { error } = await supabase.from("guests").update({ rsvp }).eq("id", guest.id);
      if (error) showError("Failed to update RSVP.");
    }
  };

  const saveEditGuest = async () => {
    if (!editGuest || !guestForm.first_name?.trim()) return;
    const data: Partial<Guest> = {
      first_name: guestForm.first_name,
      last_name:  guestForm.last_name || "",
      email:      guestForm.email || "",
      meal:       guestForm.meal as Meal,
      rsvp:       guestForm.rsvp as Rsvp,
      allergies:  guestForm.allergies || "",
      notes:      guestForm.notes || "",
    };
    setSaving(true);
    dispatch({ type: "UPDATE_GUEST", id: editGuest.id, data });
    if (!isDemo) {
      const { error } = await supabase.from("guests").update(data).eq("id", editGuest.id);
      if (error) { showError("Failed to save guest."); setSaving(false); return; }
    }
    setSaving(false);
    setEditGuest(null);
    showToast("Guest saved ✓");
  };

  const deleteGuest = async (id: string) => {
    setSaving(true);
    dispatch({ type: "DELETE_GUEST", id });
    if (!isDemo) {
      const { error } = await supabase.from("guests").delete().eq("id", id);
      if (error) { showError("Failed to delete guest."); setSaving(false); return; }
    }
    setSaving(false);
    setEditGuest(null);
    showToast("Guest removed");
  };

  const addGuest = async () => {
    if (!guestForm.first_name?.trim()) return;
    if (plan === "free") {
      const { count, error: countError } = await supabase
        .from("guests")
        .select("*", { count: "exact", head: true })
        .eq("wedding_id", wedding.id);
      if (countError) { showError("Failed to check guest count."); return; }
      if (count !== null && count >= 50) {
        showToast("Free plan limit: 50 guests. Upgrade to add more.");
        return;
      }
    }
    const newGuest: Guest = {
      id: crypto.randomUUID(), wedding_id: wedding.id,
      first_name: guestForm.first_name || "", last_name: guestForm.last_name || null,
      email: guestForm.email || null, phone: null,
      rsvp: (guestForm.rsvp as Rsvp) || "pending", meal: (guestForm.meal as Meal) || "standard",
      allergies: guestForm.allergies || null, notes: guestForm.notes || null, group_id: null, table_id: null, seat_index: null,
      rsvp_token: crypto.randomUUID(),
    };
    setSaving(true);
    dispatch({ type: "ADD_GUEST", payload: newGuest });
    if (!isDemo) {
      const { error } = await supabase.from("guests").insert(newGuest);
      if (error) { showError("Failed to add guest."); setSaving(false); return; }
    }
    setSaving(false);
    setShowAddGuest(false);
    setGuestForm({ first_name: "", last_name: "", email: "", meal: "standard", rsvp: "pending" });
    showToast("Guest added ✓");
  };

  const saveTableName = async () => {
    if (!editTable || !tableNameEdit.trim()) return;
    setSaving(true);
    dispatch({ type: "UPDATE_TABLE", id: editTable.id, data: { name: tableNameEdit.trim() } });
    if (!isDemo) {
      const { error } = await supabase.from("tables").update({ name: tableNameEdit.trim() }).eq("id", editTable.id);
      if (error) { showError("Failed to rename table."); setSaving(false); return; }
    }
    setSaving(false);
    setEditTable(null);
    showToast("Table renamed ✓");
  };

  const deleteTable = async (id: string) => {
    setSaving(true);
    dispatch({ type: "DELETE_TABLE", id });
    if (!isDemo) {
      const { error } = await supabase.from("tables").delete().eq("id", id);
      if (error) { showError("Failed to delete table."); setSaving(false); return; }
    }
    setSaving(false);
    setEditTable(null);
    setExpandedTable(null);
    showToast("Table removed");
  };

  const addRule = async () => {
    if (!ruleGuest1 || !ruleGuest2 || ruleGuest1 === ruleGuest2) return;
    const newRule: Rule = {
      id: crypto.randomUUID(), wedding_id: wedding.id,
      guest1_id: ruleGuest1, guest2_id: ruleGuest2, type: ruleType,
    };
    setSaving(true);
    dispatch({ type: "ADD_RULE", payload: newRule });
    if (!isDemo) {
      const { error } = await supabase.from("rules").insert(newRule);
      if (error) { showError("Failed to add rule."); setSaving(false); return; }
    }
    setSaving(false);
    setShowAddRule(false);
    setRuleGuest1(""); setRuleGuest2("");
    showToast("Rule added ✓");
  };

  const deleteRule = async (id: string) => {
    dispatch({ type: "DELETE_RULE", id });
    if (!isDemo) {
      const { error } = await supabase.from("rules").delete().eq("id", id);
      if (error) showError("Failed to delete rule.");
    }
    showToast("Rule removed");
  };

  // ── CSV Export ──
  const exportGuestCSV = useCallback(() => {
    const rows = [
      ["First Name", "Last Name", "Email", "Meal", "RSVP", "Table", "Allergies", "Notes"],
      ...guests.map(g => [
        g.first_name,
        g.last_name ?? "",
        g.email ?? "",
        g.meal ?? "standard",
        g.rsvp ?? "pending",
        tables.find(t => t.id === g.table_id)?.name ?? "",
        g.allergies ?? "",
        g.notes ?? "",
      ]),
    ];
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${wedding.name.replace(/\s+/g, "_")}_guests.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV downloaded ✓");
  }, [guests, tables, wedding.name]);

  // ── Computed values ──
  const totalGuests    = guests.length;
  const confirmedCount = guests.filter(g => g.rsvp === "confirmed").length;
  const pendingCount   = guests.filter(g => g.rsvp === "pending").length;
  const declinedCount  = guests.filter(g => g.rsvp === "declined").length;
  const seatedCount    = guests.filter(g => g.table_id).length;
  const unseatedActive = guests.filter(g => !g.table_id && g.rsvp !== "declined").length;
  const rsvpPct        = totalGuests > 0 ? Math.round(((confirmedCount + declinedCount) / totalGuests) * 100) : 0;
  const seatingPct     = (confirmedCount + pendingCount) > 0
    ? Math.round((seatedCount / (confirmedCount + pendingCount)) * 100)
    : 0;

  // Days until wedding
  const daysUntil = (() => {
    if (!wedding.date) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    const wDate = new Date(wedding.date); wDate.setHours(0,0,0,0);
    return Math.ceil((wDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  })();

  // Meal counts (only non-zero)
  const mealCounts = MEALS_ALL.reduce((acc, m) => {
    const n = guests.filter(g => (g.meal || "standard") === m).length;
    if (n > 0) acc[m] = n;
    return acc;
  }, {} as Record<string, number>);

  // Planning checklist
  const checklist = [
    { label: "Add your tables",          done: tables.length > 0 },
    { label: "Add all guests",           done: totalGuests > 0 },
    { label: "Collect RSVPs",            done: confirmedCount > 0 },
    { label: "Seat all confirmed guests",done: unseatedActive === 0 && confirmedCount > 0 },
    { label: "Set seating rules",        done: rules.length > 0 },
    { label: "Export guest list",        done: false },
  ];
  const checklistDone = checklist.filter(c => c.done).length;

  const filteredGuests = guests.filter(g =>
    `${g.first_name} ${g.last_name}`.toLowerCase().includes(guestSearch.toLowerCase())
  );

  const filteredTables = tables.filter(t =>
    t.name.toLowerCase().includes(tableSearch.toLowerCase())
  );

  const tabs = [
    { id: "overview" as MobileTab, label: "Overview", icon: "🏠" },
    { id: "tables"   as MobileTab, label: "Tables",   icon: "🍽️" },
    { id: "guests"   as MobileTab, label: "Guests",   icon: "👥" },
    { id: "more"     as MobileTab, label: "More",     icon: "⋯" },
  ];

  // Backdrop is defined outside this component (above) to prevent keyboard dismissal on re-render.

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, minHeight:0, height:"100dvh", background:bg, color:text }}>

      {/* ── Top Bar ── */}
      <div style={{ background:card, borderBottom:`1px solid ${border}`, padding:"12px 16px",
        display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        <Link href="/app" style={{ color:accent, fontSize:20, textDecoration:"none" }}>♥</Link>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:15, color:text }}>{wedding.name}</div>
          {wedding.date && (
            <div style={{ fontSize:11, color:textMuted }}>
              {new Date(wedding.date).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })}
            </div>
          )}
        </div>
        {/* Quick stats */}
        <div style={{ fontSize:12, color:textMuted, textAlign:"right" }}>
          <div>{confirmedCount}/{totalGuests} confirmed</div>
          <div style={{ color: unseatedActive > 0 ? warning : success, fontSize:11 }}>
            {unseatedActive > 0 ? `${unseatedActive} unseated` : "All seated ✓"}
          </div>
        </div>
        <button onClick={onToggleDark}
          style={{ background:surface2, border:"none", borderRadius:8, padding:"6px 10px", color:text, fontSize:16, cursor:"pointer" }}>
          {dark ? "☀️" : "🌙"}
        </button>
      </div>

      {/* ── Content ── */}
      <div style={{ flex:1, overflowY:"auto", paddingBottom:80 }}>

        {/* ══ OVERVIEW TAB ══ */}
        {activeTab === "overview" && (
          <div style={{ padding:"16px", display:"flex", flexDirection:"column", gap:16 }}>

            {/* Wedding hero card */}
            <div style={{
              background: `linear-gradient(135deg, ${accent}22 0%, ${dark ? "#352E30" : "#FDF0E8"} 100%)`,
              borderRadius:20, border:`1px solid ${accent}44`, padding:"20px",
              display:"flex", flexDirection:"column", gap:6,
            }}>
              <div style={{ fontSize:28 }}>💍</div>
              <div style={{ fontWeight:800, fontSize:22, color:text, lineHeight:1.2 }}>{wedding.name}</div>
              {wedding.date && (
                <div style={{ fontSize:13, color:textMid }}>
                  {new Date(wedding.date).toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
                </div>
              )}
              {daysUntil !== null && (
                <div style={{
                  marginTop:6, alignSelf:"flex-start",
                  background: daysUntil <= 7 ? `${danger}22` : daysUntil <= 30 ? `${warning}22` : `${success}22`,
                  color: daysUntil <= 7 ? danger : daysUntil <= 30 ? warning : success,
                  border: `1px solid ${daysUntil <= 7 ? danger : daysUntil <= 30 ? warning : success}44`,
                  borderRadius:20, padding:"4px 14px", fontSize:13, fontWeight:700,
                }}>
                  {daysUntil === 0
                    ? "🎉 Today!"
                    : daysUntil < 0
                    ? `${Math.abs(daysUntil)}d ago`
                    : `${daysUntil} day${daysUntil === 1 ? "" : "s"} to go`}
                </div>
              )}
            </div>

            {/* 2×2 stat grid */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[
                { label:"Total Guests",  value: totalGuests,    emoji:"👥", color:text },
                { label:"Confirmed",     value: confirmedCount, emoji:"✅", color:success },
                { label:"Awaiting",      value: pendingCount,   emoji:"⏳", color:warning },
                { label:"Declined",      value: declinedCount,  emoji:"❌", color:danger },
              ].map(s => (
                <div key={s.label} style={{
                  background:card, borderRadius:14, border:`1px solid ${border}`,
                  padding:"16px 14px", display:"flex", flexDirection:"column", gap:4,
                }}>
                  <div style={{ fontSize:22 }}>{s.emoji}</div>
                  <div style={{ fontSize:28, fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:11, color:textMuted, marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* RSVP progress */}
            <div style={{ background:card, borderRadius:14, border:`1px solid ${border}`, padding:"16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <span style={{ fontSize:13, fontWeight:700, color:text }}>RSVP Progress</span>
                <span style={{ fontSize:13, fontWeight:700, color:accent }}>{rsvpPct}%</span>
              </div>
              <div style={{ height:8, borderRadius:4, background:surface2, overflow:"hidden" }}>
                <div style={{
                  height:"100%", borderRadius:4,
                  background:`linear-gradient(90deg, ${success} 0%, ${accent} 100%)`,
                  width:`${rsvpPct}%`, transition:"width 0.4s ease",
                }} />
              </div>
              <div style={{ display:"flex", gap:12, marginTop:10, flexWrap:"wrap" }}>
                <span style={{ fontSize:11, color:success }}>✅ {confirmedCount} confirmed</span>
                <span style={{ fontSize:11, color:warning }}>⏳ {pendingCount} pending</span>
                <span style={{ fontSize:11, color:danger }}>❌ {declinedCount} declined</span>
              </div>
            </div>

            {/* Seating progress */}
            <div style={{ background:card, borderRadius:14, border:`1px solid ${border}`, padding:"16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <span style={{ fontSize:13, fontWeight:700, color:text }}>Seating Progress</span>
                <span style={{ fontSize:13, fontWeight:700, color:accent }}>{seatingPct}%</span>
              </div>
              <div style={{ height:8, borderRadius:4, background:surface2, overflow:"hidden" }}>
                <div style={{
                  height:"100%", borderRadius:4,
                  background:`linear-gradient(90deg, ${accent} 0%, #C4784A 100%)`,
                  width:`${seatingPct}%`, transition:"width 0.4s ease",
                }} />
              </div>
              <div style={{ display:"flex", gap:12, marginTop:10, flexWrap:"wrap" }}>
                <span style={{ fontSize:11, color:accent }}>🪑 {seatedCount} seated</span>
                {unseatedActive > 0 && (
                  <span style={{ fontSize:11, color:warning }}>⚠️ {unseatedActive} still need seats</span>
                )}
                {unseatedActive === 0 && seatedCount > 0 && (
                  <span style={{ fontSize:11, color:success }}>All active guests seated ✓</span>
                )}
              </div>
            </div>

            {/* Planning checklist */}
            <div style={{ background:card, borderRadius:14, border:`1px solid ${border}`, padding:"16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <span style={{ fontSize:13, fontWeight:700, color:text }}>📋 Planning Checklist</span>
                <span style={{ fontSize:12, color:textMuted }}>{checklistDone}/{checklist.length}</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {checklist.map((item, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{
                      width:22, height:22, borderRadius:"50%", flexShrink:0,
                      background: item.done ? `${success}22` : surface2,
                      border: `2px solid ${item.done ? success : border}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                    }}>
                      {item.done && <span style={{ fontSize:11, color:success }}>✓</span>}
                    </div>
                    <span style={{
                      fontSize:13, color: item.done ? textMuted : text,
                      textDecoration: item.done ? "line-through" : "none",
                    }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Meal summary chips */}
            {Object.keys(mealCounts).length > 0 && (
              <div style={{ background:card, borderRadius:14, border:`1px solid ${border}`, padding:"16px" }}>
                <div style={{ fontSize:13, fontWeight:700, color:text, marginBottom:12 }}>🍽️ Meal Summary</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {Object.entries(mealCounts).map(([meal, count]) => (
                    <div key={meal} style={{
                      background:surface2, borderRadius:20, padding:"6px 14px",
                      display:"flex", alignItems:"center", gap:6,
                      border:`1px solid ${border}`,
                    }}>
                      <span style={{ fontSize:16 }}>{MEAL_ICON[meal] ?? "🍽️"}</span>
                      <span style={{ fontSize:13, color:text, textTransform:"capitalize" }}>{meal}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:accent }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ══ TABLES TAB ══ */}
        {activeTab === "tables" && (
          <div style={{ padding:"16px" }}>
            {/* Header row */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <h2 style={{ fontWeight:700, fontSize:18, color:accent, margin:0 }}>Tables</h2>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ fontSize:12, color:textMuted }}>{tables.length} · {seatedCount} seated</div>
                {isDemo ? (
                  <a href="/signup" style={{ background:surface2, color:textMuted, border:`1px solid ${border}`,
                    borderRadius:10, padding:"7px 14px", fontSize:13, fontWeight:600, textDecoration:"none" }}>
                    🔒 Sign up to add
                  </a>
                ) : (
                  <button onClick={() => setShowAddTable(true)}
                    style={{ background:accent, color:"#fff", border:"none", borderRadius:10,
                      padding:"8px 16px", fontSize:14, fontWeight:700, cursor:"pointer" }}>
                    + Add
                  </button>
                )}
              </div>
            </div>

            {/* Search + view toggle row */}
            <div style={{ display:"flex", gap:8, marginBottom:14, alignItems:"center" }}>
              <input
                type="search"
                placeholder="🔍 Search tables…"
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
                style={{ ...inputStyle, flex:1, marginBottom:0 }}
              />
              {/* Card / List toggle */}
              <div style={{ display:"flex", borderRadius:10, overflow:"hidden", border:`1px solid ${border}`, flexShrink:0 }}>
                {(["card","list"] as const).map(mode => (
                  <button key={mode} onClick={() => setTableViewMode(mode)}
                    style={{
                      padding:"9px 13px", border:"none", cursor:"pointer", fontSize:16,
                      background: tableViewMode === mode ? accent : surface2,
                      color: tableViewMode === mode ? "#fff" : textMuted,
                    }}>
                    {mode === "card" ? "⊞" : "☰"}
                  </button>
                ))}
              </div>
            </div>

            {filteredTables.length === 0 ? (
              <div style={{ textAlign:"center", padding:"48px 0", color:textMuted }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🍽️</div>
                <p style={{ fontSize:14 }}>
                  {tables.length === 0 ? "No tables yet. Tap + Add to create one." : "No tables match your search."}
                </p>
              </div>
            ) : tableViewMode === "card" ? (
              /* ── Card grid ── */
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {filteredTables.map(table => {
                  const seated = guests.filter(g => g.table_id === table.id);
                  const isFull = seated.length >= table.capacity;
                  const fillPct = Math.round((seated.length / Math.max(table.capacity, 1)) * 100);
                  return (
                    <div key={table.id}
                      style={{ background:card, borderRadius:14, border:`1px solid ${isFull ? danger + "66" : border}`,
                        padding:"14px", display:"flex", flexDirection:"column", gap:8,
                        cursor:"pointer", position:"relative" }}
                      onClick={() => setExpandedTable(expandedTable === table.id ? null : table.id)}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <span style={{ fontSize:28 }}>{shapeEmoji(table.shape)}</span>
                        {!isDemo && (
                          <button onClick={e => { e.stopPropagation(); setEditTable(table); setTableNameEdit(table.name); }}
                            style={{ background:surface2, border:"none", borderRadius:8, padding:"4px 8px",
                              color:textMuted, fontSize:12, cursor:"pointer" }}>✏️</button>
                        )}
                      </div>
                      <div style={{ fontWeight:700, fontSize:14, color:text, lineHeight:1.2 }}>{table.name}</div>
                      <div style={{ fontSize:11, color:textMuted, textTransform:"capitalize" }}>{table.shape} · cap {table.capacity}</div>
                      {/* Mini fill bar */}
                      <div style={{ height:4, borderRadius:2, background:surface2, overflow:"hidden" }}>
                        <div style={{ height:"100%", borderRadius:2,
                          background: isFull ? danger : seated.length > 0 ? success : textMuted,
                          width:`${fillPct}%` }} />
                      </div>
                      <div style={{ fontWeight:700, fontSize:13,
                        color: isFull ? danger : seated.length > 0 ? success : textMuted }}>
                        {seated.length}/{table.capacity} seated
                      </div>
                      {/* Expanded guest list */}
                      {expandedTable === table.id && seated.length > 0 && (
                        <div style={{ borderTop:`1px solid ${border}`, marginTop:4, paddingTop:8,
                          display:"flex", flexDirection:"column", gap:6 }}>
                          {seated.map(g => (
                            <div key={g.id} style={{ display:"flex", alignItems:"center", gap:6,
                              background:surface2, borderRadius:8, padding:"7px 10px" }}>
                              <span style={{ fontSize:14 }}>{MEAL_ICON[g.meal||"standard"] ?? "🍽️"}</span>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:12, fontWeight:600, color:text,
                                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                  {g.first_name} {g.last_name}
                                </div>
                                <div style={{ fontSize:10, color:textMuted }}>{g.meal||"standard"}</div>
                              </div>
                              {!isDemo && (
                                <button onClick={e => { e.stopPropagation(); unseatGuest(g.id); }}
                                  style={{ background:"rgba(224,92,106,0.15)", color:danger,
                                    border:`1px solid rgba(224,92,106,0.3)`, borderRadius:6,
                                    padding:"4px 8px", fontSize:11, cursor:"pointer", fontWeight:600 }}>
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ── List view ── */
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {filteredTables.map(table => {
                  const seated  = guests.filter(g => g.table_id === table.id);
                  const isOpen  = expandedTable === table.id;
                  const isFull  = seated.length >= table.capacity;
                  return (
                    <div key={table.id} style={{ background:card, borderRadius:14, border:`1px solid ${border}`, overflow:"hidden" }}>
                      <button onClick={() => setExpandedTable(isOpen ? null : table.id)}
                        style={{ width:"100%", textAlign:"left", padding:"16px", background:"transparent",
                          border:"none", color:text, cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
                        <span style={{ fontSize:28 }}>{shapeEmoji(table.shape)}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:16 }}>{table.name}</div>
                          <div style={{ fontSize:12, color:textMuted, marginTop:2, textTransform:"capitalize" }}>{table.shape} · {table.capacity} seats</div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontWeight:700, fontSize:15, color: isFull ? danger : seated.length > 0 ? success : textMuted }}>
                            {seated.length}/{table.capacity}
                          </div>
                          <div style={{ fontSize:11, color:textMuted }}>seated</div>
                        </div>
                        {!isDemo && (
                          <button onClick={e => { e.stopPropagation(); setEditTable(table); setTableNameEdit(table.name); }}
                            style={{ background:surface2, border:"none", borderRadius:8, padding:"6px 10px",
                              color:textMuted, fontSize:13, cursor:"pointer" }}>✏️</button>
                        )}
                        <span style={{ color:textMuted, fontSize:16 }}>{isOpen ? "▲" : "▼"}</span>
                      </button>

                      {isOpen && (
                        <div style={{ borderTop:`1px solid ${border}`, padding:"12px 16px 16px" }}>
                          {seated.length === 0 ? (
                            <p style={{ fontSize:13, color:textMuted, textAlign:"center", padding:"8px 0" }}>No guests seated here yet.</p>
                          ) : (
                            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                              {seated.map(g => (
                                <div key={g.id} style={{ display:"flex", alignItems:"center", gap:10,
                                  background:surface2, borderRadius:10, padding:"10px 12px" }}>
                                  <span style={{ fontSize:18 }}>{MEAL_ICON[g.meal||"standard"] ?? "🍽️"}</span>
                                  <div style={{ flex:1 }}>
                                    <div style={{ fontWeight:600, fontSize:14 }}>{g.first_name} {g.last_name}</div>
                                    <div style={{ fontSize:11, color:textMuted }}>{g.meal||"standard"}</div>
                                  </div>
                                  <span style={{ fontSize:11, fontWeight:700, borderRadius:6, padding:"3px 8px",
                                    background:`${rsvpColor(g.rsvp)}22`, color:rsvpColor(g.rsvp),
                                    border:`1px solid ${rsvpColor(g.rsvp)}44` }}>
                                    {g.rsvp||"pending"}
                                  </span>
                                  <button onClick={() => unseatGuest(g.id)}
                                    style={{ background:"rgba(224,92,106,0.15)", color:danger,
                                      border:`1px solid rgba(224,92,106,0.3)`, borderRadius:8,
                                      padding:"8px 12px", fontSize:12, cursor:"pointer", fontWeight:600,
                                      minHeight:44, display: isDemo ? "none" : undefined }}>
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ GUESTS TAB ══ */}
        {activeTab === "guests" && (
          <div style={{ padding:"16px" }}>
            {/* Header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <h2 style={{ fontWeight:700, fontSize:18, color:accent, margin:0 }}>Guests</h2>
              {isDemo ? (
                <a href="/signup" style={{ background:surface2, color:textMuted, border:`1px solid ${border}`,
                  borderRadius:10, padding:"7px 14px", fontSize:13, fontWeight:600, textDecoration:"none" }}>
                  🔒 Sign up to add
                </a>
              ) : (
                <button onClick={() => { setGuestForm({ first_name:"", last_name:"", email:"", meal:"standard", rsvp:"pending" }); setShowAddGuest(true); }}
                  style={{ background:accent, color:"#fff", border:"none", borderRadius:10,
                    padding:"8px 16px", fontSize:14, fontWeight:700, cursor:"pointer" }}>
                  + Add
                </button>
              )}
            </div>

            {/* Search */}
            <input
              type="search"
              placeholder="🔍 Search guests…"
              value={guestSearch}
              onChange={e => setGuestSearch(e.target.value)}
              style={{ ...inputStyle, marginBottom:14 }}
            />

            {filteredGuests.length === 0 ? (
              <div style={{ textAlign:"center", padding:"48px 0", color:textMuted }}>
                <div style={{ fontSize:40, marginBottom:12 }}>👥</div>
                <p style={{ fontSize:14 }}>
                  {guests.length === 0 ? "No guests yet. Tap + Add to invite someone." : "No guests match your search."}
                </p>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {filteredGuests.map(guest => {
                  const gTable = tables.find(t => t.id === guest.table_id);
                  const canSeat = !guest.table_id && guest.rsvp !== "declined";
                  return (
                    <div key={guest.id} style={{ background:card, borderRadius:14, border:`1px solid ${border}`, padding:"14px" }}>
                      {/* Top row: name + RSVP badge */}
                      <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:15, color:text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {guest.first_name} {guest.last_name}
                          </div>
                          <div style={{ display:"flex", gap:6, marginTop:4, flexWrap:"wrap", alignItems:"center" }}>
                            <span style={{ fontSize:11, fontWeight:700, borderRadius:20, padding:"2px 8px",
                              background:`${rsvpColor(guest.rsvp)}22`, color:rsvpColor(guest.rsvp),
                              border:`1px solid ${rsvpColor(guest.rsvp)}44` }}>
                              {RSVP_LABEL[guest.rsvp || "pending"]}
                            </span>
                            <span style={{ fontSize:13 }}>{MEAL_ICON[guest.meal || "standard"] ?? "🍽️"}</span>
                            {gTable && (
                              <span style={{ fontSize:11, color:textMuted, background:surface2,
                                borderRadius:20, padding:"2px 8px", border:`1px solid ${border}` }}>
                                🪑 {gTable.name}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                          {canSeat && !isDemo && (
                            <button onClick={() => setQuickSeatGuest(guest)}
                              style={{ background:`${success}22`, color:success, border:`1px solid ${success}44`,
                                borderRadius:8, padding:"6px 10px", fontSize:12, cursor:"pointer", fontWeight:700 }}>
                              🪑 Seat
                            </button>
                          )}
                          {!isDemo && (
                            <>
                              <button onClick={() => { setEditGuest(guest); setGuestForm({ ...guest }); }}
                                style={{ background:surface2, border:`1px solid ${border}`, borderRadius:8,
                                  padding:"6px 10px", fontSize:14, cursor:"pointer", color:textMid }}>✏️</button>
                              <button onClick={() => setConfirmModal({ message:`Remove ${guest.first_name}?`, onConfirm: () => deleteGuest(guest.id) })}
                                style={{ background:`${danger}15`, border:`1px solid ${danger}33`, borderRadius:8,
                                  padding:"6px 10px", fontSize:14, cursor:"pointer", color:danger }}>🗑️</button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* RSVP quick-change */}
                      <div style={{ display:"flex", gap:6, marginTop:10 }}>
                        {RSVP_OPTIONS.map(rsvp => (
                          <button key={rsvp} onClick={() => !isDemo && updateGuestRsvp(guest, rsvp)}
                            style={{ flex:1, padding:"5px 4px", fontSize:10, fontWeight:700,
                              borderRadius:8, border:`1px solid ${guest.rsvp === rsvp ? rsvpColor(rsvp) : border}`,
                              background: guest.rsvp === rsvp ? `${rsvpColor(rsvp)}22` : surface2,
                              color: guest.rsvp === rsvp ? rsvpColor(rsvp) : textMuted,
                              cursor: isDemo ? "default" : "pointer" }}>
                            {rsvp}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>{/* end scrollable content */}

      {/* ══ BOTTOM NAV BAR ══ */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:100,
        background:card, borderTop:`1px solid ${border}`,
        display:"flex", paddingBottom:"env(safe-area-inset-bottom)" }}>
        {tabs.map(tab => (
          <button key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === "more") setShowMoreSheet(true);
            }}
            style={{ flex:1, padding:"8px 4px", display:"flex", flexDirection:"column",
              alignItems:"center", gap:2, background:"none", border:"none", cursor:"pointer",
              color: activeTab === tab.id ? accent : textMuted, fontSize:10 }}>
            <span style={{ fontSize:20 }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ══ TABLE DETAIL SHEET ══ */}
      {selectedTableId && (() => {
        const selTable = tables.find(t => t.id === selectedTableId);
        if (!selTable) return null;
        const seatedHere = guests.filter(g => g.table_id === selectedTableId);
        return (
          <Backdrop onClose={() => { setSelectedTableId(null); setTableSheetNameEdit(false); setShowSeatGuestSheet(false); setSeatSearch(""); }} cardBg={card} borderColor={border}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <span style={{ fontSize:28 }}>{shapeEmoji(selTable.shape)}</span>
              {tableSheetNameEdit ? (
                <input
                  autoFocus
                  value={tableSheetNameVal}
                  onChange={e => setTableSheetNameVal(e.target.value)}
                  style={{ ...inputStyle, flex:1, fontSize:18, fontWeight:700 }}
                  onKeyDown={async e => {
                    if (e.key === "Enter") {
                      if (!tableSheetNameVal.trim()) return;
                      dispatch({ type:"UPDATE_TABLE", id: selTable.id, data:{ name: tableSheetNameVal.trim() } });
                      if (!isDemo) await supabase.from("tables").update({ name: tableSheetNameVal.trim() }).eq("id", selTable.id);
                      setTableSheetNameEdit(false);
                      showToast("Table renamed ✓");
                    }
                    if (e.key === "Escape") setTableSheetNameEdit(false);
                  }}
                />
              ) : (
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:20, color:text }}>{selTable.name}</div>
                  <div style={{ fontSize:12, color:textMuted }}>{selTable.shape} · {selTable.capacity} seats</div>
                </div>
              )}
              {!isDemo && !tableSheetNameEdit && (
                <button onClick={() => { setTableSheetNameVal(selTable.name); setTableSheetNameEdit(true); }}
                  style={{ background:surface2, border:`1px solid ${border}`, borderRadius:8,
                    padding:"6px 10px", fontSize:16, cursor:"pointer", color:textMid }}>✏️</button>
              )}
              {tableSheetNameEdit && (
                <button onClick={async () => {
                  if (!tableSheetNameVal.trim()) return;
                  dispatch({ type:"UPDATE_TABLE", id:selTable.id, data:{ name:tableSheetNameVal.trim() } });
                  if (!isDemo) await supabase.from("tables").update({ name:tableSheetNameVal.trim() }).eq("id",selTable.id);
                  setTableSheetNameEdit(false);
                  showToast("Table renamed ✓");
                }} style={{ background:accent, color:"#fff", border:"none", borderRadius:8,
                  padding:"6px 12px", fontSize:14, cursor:"pointer", fontWeight:700 }}>Save</button>
              )}
            </div>

            {/* Fill bar */}
            <div style={{ marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:12, color:textMuted }}>Capacity</span>
                <span style={{ fontSize:12, fontWeight:700, color: seatedHere.length >= selTable.capacity ? danger : success }}>
                  {seatedHere.length}/{selTable.capacity}
                </span>
              </div>
              <div style={{ height:6, borderRadius:3, background:surface2, overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:3,
                  background: seatedHere.length >= selTable.capacity ? danger : accent,
                  width:`${Math.round((seatedHere.length / Math.max(selTable.capacity,1)) * 100)}%` }} />
              </div>
            </div>

            {/* Seated guests list */}
            <div style={{ fontSize:13, fontWeight:700, color:textMid, marginBottom:8 }}>
              {seatedHere.length === 0 ? "No guests seated yet" : `Seated guests (${seatedHere.length})`}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
              {seatedHere.map(g => (
                <div key={g.id} style={{ display:"flex", alignItems:"center", gap:10,
                  background:surface2, borderRadius:10, padding:"10px 12px" }}>
                  <span style={{ fontSize:18 }}>{MEAL_ICON[g.meal||"standard"] ?? "🍽️"}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:14, color:text }}>{g.first_name} {g.last_name}</div>
                    <div style={{ fontSize:11, color:textMuted }}>{g.meal||"standard"}</div>
                  </div>
                  {!isDemo && (
                    <button onClick={() => unseatGuest(g.id)}
                      style={{ background:"rgba(224,92,106,0.15)", color:danger,
                        border:"1px solid rgba(224,92,106,0.3)", borderRadius:8,
                        padding:"6px 12px", fontSize:12, cursor:"pointer", fontWeight:700 }}>✕</button>
                  )}
                </div>
              ))}
            </div>

            {/* Seat a guest button */}
            {!isDemo && seatedHere.length < selTable.capacity && (
              <button onClick={() => { setSeatSearch(""); setShowSeatGuestSheet(true); }}
                style={{ width:"100%", background:accent, color:"#fff", border:"none", borderRadius:12,
                  padding:"14px", fontSize:15, fontWeight:700, cursor:"pointer" }}>
                + Seat a Guest
              </button>
            )}

            {/* Delete table */}
            {!isDemo && (
              <button onClick={() => setConfirmModal({ message:`Delete table "${selTable.name}"?`, onConfirm: () => { deleteTable(selTable.id); setSelectedTableId(null); } })}
                style={{ width:"100%", background:`${danger}15`, color:danger, border:`1px solid ${danger}33`,
                  borderRadius:12, padding:"12px", fontSize:14, fontWeight:700, cursor:"pointer", marginTop:10 }}>
                🗑️ Delete Table
              </button>
            )}
          </Backdrop>
        );
      })()}

      {/* ══ SEAT GUEST INTO TABLE SHEET ══ */}
      {showSeatGuestSheet && selectedTableId && (() => {
        const selTable = tables.find(t => t.id === selectedTableId);
        if (!selTable) return null;
        const alreadySeated = guests.filter(g => g.table_id === selectedTableId).length;
        const unseatedConfirmed = guests.filter(g => !g.table_id && g.rsvp !== "declined");
        const filtered = unseatedConfirmed.filter(g =>
          `${g.first_name} ${g.last_name}`.toLowerCase().includes(seatSearch.toLowerCase())
        );
        return (
          <Backdrop onClose={() => setShowSeatGuestSheet(false)} cardBg={card} borderColor={border}>
            <div style={{ fontWeight:800, fontSize:18, color:text, marginBottom:4 }}>Seat a Guest</div>
            <div style={{ fontSize:12, color:textMuted, marginBottom:14 }}>
              {selTable.name} — {alreadySeated}/{selTable.capacity} seats filled
            </div>
            <input type="search" placeholder="🔍 Search unseated guests…"
              value={seatSearch} onChange={e => setSeatSearch(e.target.value)}
              style={{ ...inputStyle, marginBottom:14 }} />
            {filtered.length === 0 ? (
              <p style={{ color:textMuted, textAlign:"center", padding:"16px 0" }}>
                {unseatedConfirmed.length === 0 ? "All active guests are already seated." : "No guests match your search."}
              </p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {filtered.map(g => (
                  <button key={g.id}
                    onClick={async () => {
                      await seatGuestToTable(g, selectedTableId);
                      setShowSeatGuestSheet(false);
                    }}
                    style={{ display:"flex", alignItems:"center", gap:12, background:surface2,
                      border:`1px solid ${border}`, borderRadius:12, padding:"12px 14px",
                      cursor:"pointer", textAlign:"left" }}>
                    <span style={{ fontSize:20 }}>{MEAL_ICON[g.meal||"standard"] ?? "🍽️"}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:14, color:text }}>{g.first_name} {g.last_name}</div>
                      <div style={{ fontSize:11, color:textMuted }}>{g.meal||"standard"}</div>
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, color:rsvpColor(g.rsvp),
                      background:`${rsvpColor(g.rsvp)}22`, borderRadius:20, padding:"3px 10px",
                      border:`1px solid ${rsvpColor(g.rsvp)}44` }}>{g.rsvp||"pending"}</span>
                  </button>
                ))}
              </div>
            )}
          </Backdrop>
        );
      })()}

      {/* ══ QUICK SEAT GUEST → TABLE SHEET ══ */}
      {quickSeatGuest && (
        <Backdrop onClose={() => setQuickSeatGuest(null)} cardBg={card} borderColor={border}>
          <div style={{ fontWeight:800, fontSize:18, color:text, marginBottom:4 }}>Choose a Table</div>
          <div style={{ fontSize:12, color:textMuted, marginBottom:14 }}>
            Seating {quickSeatGuest.first_name} {quickSeatGuest.last_name}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {tables.map(t => {
              const filled = guests.filter(g => g.table_id === t.id).length;
              const full = filled >= t.capacity;
              const pct = Math.round((filled / Math.max(t.capacity,1)) * 100);
              return (
                <button key={t.id} disabled={full}
                  onClick={async () => {
                    await seatGuestToTable(quickSeatGuest, t.id);
                    setQuickSeatGuest(null);
                  }}
                  style={{ background: full ? surface2 : card, border:`1px solid ${full ? border : accent+"44"}`,
                    borderRadius:12, padding:"14px 16px", cursor: full ? "not-allowed" : "pointer",
                    opacity: full ? 0.5 : 1, textAlign:"left" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:22 }}>{shapeEmoji(t.shape)}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:14, color:text }}>{t.name}</div>
                      <div style={{ height:4, borderRadius:2, background:surface2, overflow:"hidden", marginTop:6 }}>
                        <div style={{ height:"100%", borderRadius:2,
                          background: full ? danger : filled > 0 ? success : textMuted,
                          width:`${pct}%` }} />
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontWeight:700, fontSize:14, color: full ? danger : success }}>{filled}/{t.capacity}</div>
                      <div style={{ fontSize:10, color:textMuted }}>{full ? "full" : "seats"}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Backdrop>
      )}

      {/* ══ MORE SHEET ══ */}
      {showMoreSheet && (
        <Backdrop onClose={() => setShowMoreSheet(false)} cardBg={card} borderColor={border}>
          <div style={{ fontWeight:800, fontSize:20, color:text, marginBottom:20 }}>⚙️ More</div>

          {/* Dark mode toggle */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            background:surface2, borderRadius:12, padding:"14px 16px", marginBottom:12 }}>
            <div>
              <div style={{ fontWeight:600, fontSize:14, color:text }}>Dark Mode</div>
              <div style={{ fontSize:11, color:textMuted }}>Toggle light/dark theme</div>
            </div>
            <button onClick={onToggleDark}
              style={{ background: dark ? accent : surface2, border:`1px solid ${border}`,
                borderRadius:20, padding:"6px 16px", color: dark ? "#fff" : textMid,
                fontSize:14, cursor:"pointer", fontWeight:700 }}>
              {dark ? "☀️ Light" : "🌙 Dark"}
            </button>
          </div>

          {/* Export CSV */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            background:surface2, borderRadius:12, padding:"14px 16px", marginBottom:12 }}>
            <div>
              <div style={{ fontWeight:600, fontSize:14, color:text }}>Export Guest List</div>
              <div style={{ fontSize:11, color:textMuted }}>Download as CSV</div>
            </div>
            <button onClick={() => { exportGuestCSV(); }}
              style={{ background:accent, color:"#fff", border:"none", borderRadius:10,
                padding:"8px 16px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
              ⬇️ CSV
            </button>
          </div>

          {/* Wishes / Wishing Wall */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            background:surface2, borderRadius:12, padding:"14px 16px", marginBottom:20 }}>
            <div>
              <div style={{ fontWeight:600, fontSize:14, color:text }}>Wishing Wall</div>
              <div style={{ fontSize:11, color:textMuted }}>Guest messages & wishes</div>
            </div>
            <button onClick={() => { setShowMoreSheet(false); setShowWishes(true); }}
              style={{ background:surface2, color:accent, border:`1px solid ${accent}44`,
                borderRadius:10, padding:"8px 14px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
              💌 Open
            </button>
          </div>

          {/* Seating Rules */}
          <div style={{ background:surface2, borderRadius:14, padding:"16px", marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <div style={{ fontWeight:700, fontSize:15, color:text }}>📋 Seating Rules</div>
              {!isDemo && (
                <button onClick={() => setShowAddRule(true)}
                  style={{ background:accent, color:"#fff", border:"none", borderRadius:8,
                    padding:"6px 12px", fontSize:12, fontWeight:700, cursor:"pointer" }}>+ Add</button>
              )}
            </div>
            {violations.length > 0 && (
              <div style={{ background:`${danger}15`, border:`1px solid ${danger}33`, borderRadius:8,
                padding:"10px 12px", marginBottom:10 }}>
                <div style={{ fontSize:12, color:danger, fontWeight:700 }}>⚠️ {violations.length} rule violation{violations.length > 1 ? "s" : ""}</div>
              </div>
            )}
            {rules.length === 0 ? (
              <p style={{ fontSize:13, color:textMuted }}>No rules yet. Add must-sit-with or must-not-sit-with constraints.</p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {rules.map(rule => {
                  const g1 = guests.find(g => g.id === rule.guest1_id);
                  const g2 = guests.find(g => g.id === rule.guest2_id);
                  const isViolated = violations.some(v => v.id === rule.id);
                  return (
                    <div key={rule.id} style={{ display:"flex", alignItems:"center", gap:8,
                      background: isViolated ? `${danger}12` : card,
                      border:`1px solid ${isViolated ? danger+"44" : border}`,
                      borderRadius:10, padding:"10px 12px" }}>
                      <div style={{ flex:1 }}>
                        <span style={{ fontSize:12, fontWeight:600, color:text }}>
                          {g1?.first_name} {g1?.last_name}
                        </span>
                        <span style={{ fontSize:11, color: rule.type === "must_sit_with" ? success : danger,
                          margin:"0 6px", fontWeight:700 }}>
                          {rule.type === "must_sit_with" ? "💚 with" : "🚫 away from"}
                        </span>
                        <span style={{ fontSize:12, fontWeight:600, color:text }}>
                          {g2?.first_name} {g2?.last_name}
                        </span>
                      </div>
                      {!isDemo && (
                        <button onClick={() => deleteRule(rule.id)}
                          style={{ background:`${danger}15`, color:danger, border:`1px solid ${danger}33`,
                            borderRadius:8, padding:"4px 10px", fontSize:12, cursor:"pointer", fontWeight:700 }}>✕</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Backdrop>
      )}

      {/* ══ WISHING WALL OVERLAY ══ */}
      {showWishes && (
        <div style={{ position:"fixed", inset:0, zIndex:300, background:bg, overflowY:"auto" }}>
          <div style={{ padding:"16px" }}>
            <button onClick={() => setShowWishes(false)}
              style={{ background:surface2, border:`1px solid ${border}`, borderRadius:10,
                padding:"8px 14px", color:text, fontSize:14, cursor:"pointer", marginBottom:16 }}>
              ← Back
            </button>
            <MobileWishes weddingId={wedding.id} shareCode={wedding.share_code ?? null} dark={dark} isDemo={isDemo} />
          </div>
        </div>
      )}

      {/* ══ ADD GUEST SHEET ══ */}
      {(showAddGuest || editGuest) && (
        <Backdrop onClose={() => { setShowAddGuest(false); setEditGuest(null); }} cardBg={card} borderColor={border}>
          <div style={{ fontWeight:800, fontSize:18, color:text, marginBottom:20 }}>
            {editGuest ? "✏️ Edit Guest" : "➕ Add Guest"}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ display:"flex", gap:10 }}>
              <div style={{ flex:1 }}>
                <label style={{ fontSize:12, color:textMuted, display:"block", marginBottom:4 }}>First name *</label>
                <input value={guestForm.first_name||""} onChange={e => setGuestForm(f => ({...f, first_name:e.target.value}))}
                  style={inputStyle} placeholder="Jane" />
              </div>
              <div style={{ flex:1 }}>
                <label style={{ fontSize:12, color:textMuted, display:"block", marginBottom:4 }}>Last name</label>
                <input value={guestForm.last_name||""} onChange={e => setGuestForm(f => ({...f, last_name:e.target.value}))}
                  style={inputStyle} placeholder="Smith" />
              </div>
            </div>

            <div>
              <label style={{ fontSize:12, color:textMuted, display:"block", marginBottom:4 }}>Email</label>
              <input type="email" value={guestForm.email||""} onChange={e => setGuestForm(f => ({...f, email:e.target.value}))}
                style={inputStyle} placeholder="jane@example.com" />
            </div>

            <div>
              <label style={{ fontSize:12, color:textMuted, display:"block", marginBottom:6 }}>RSVP</label>
              <div style={{ display:"flex", gap:8 }}>
                {RSVP_OPTIONS.map(r => (
                  <button key={r} onClick={() => setGuestForm(f => ({...f, rsvp:r}))}
                    style={{ flex:1, padding:"8px 4px", borderRadius:10, fontSize:12, fontWeight:700, cursor:"pointer",
                      border:`1px solid ${guestForm.rsvp === r ? rsvpColor(r) : border}`,
                      background: guestForm.rsvp === r ? `${rsvpColor(r)}22` : surface2,
                      color: guestForm.rsvp === r ? rsvpColor(r) : textMuted }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize:12, color:textMuted, display:"block", marginBottom:6 }}>Meal preference</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {MEALS_ALL.map(m => (
                  <button key={m} onClick={() => setGuestForm(f => ({...f, meal: m as Meal}))}
                    style={{ padding:"6px 12px", borderRadius:20, fontSize:12, cursor:"pointer",
                      border:`1px solid ${guestForm.meal === m ? accent : border}`,
                      background: guestForm.meal === m ? `${accent}22` : surface2,
                      color: guestForm.meal === m ? accent : textMuted }}>
                    {MEAL_ICON[m]} {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize:12, color:textMuted, display:"block", marginBottom:4 }}>Allergies</label>
              <input value={guestForm.allergies||""} onChange={e => setGuestForm(f => ({...f, allergies:e.target.value}))}
                style={inputStyle} placeholder="nuts, dairy…" />
            </div>

            <div>
              <label style={{ fontSize:12, color:textMuted, display:"block", marginBottom:4 }}>Notes</label>
              <input value={guestForm.notes||""} onChange={e => setGuestForm(f => ({...f, notes:e.target.value}))}
                style={inputStyle} placeholder="VIP, accessibility needs…" />
            </div>
          </div>

          <div style={{ display:"flex", gap:10, marginTop:20 }}>
            <button onClick={() => { setShowAddGuest(false); setEditGuest(null); }}
              style={{ flex:1, background:surface2, color:textMid, border:`1px solid ${border}`,
                borderRadius:12, padding:"14px", fontSize:15, cursor:"pointer" }}>Cancel</button>
            <button onClick={editGuest ? saveEditGuest : addGuest} disabled={saving}
              style={{ flex:2, background:accent, color:"#fff", border:"none",
                borderRadius:12, padding:"14px", fontSize:15, fontWeight:700, cursor:saving?"not-allowed":"pointer",
                opacity:saving?0.7:1 }}>
              {saving ? "Saving…" : editGuest ? "Save Changes" : "Add Guest"}
            </button>
          </div>
        </Backdrop>
      )}

      {/* ══ ADD TABLE SHEET ══ */}
      {showAddTable && (
        <Backdrop onClose={() => setShowAddTable(false)} cardBg={card} borderColor={border}>
          <div style={{ fontWeight:800, fontSize:18, color:text, marginBottom:20 }}>➕ Add Table</div>

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ fontSize:12, color:textMuted, display:"block", marginBottom:4 }}>Table name *</label>
              <input value={newTableName} onChange={e => setNewTableName(e.target.value)}
                style={inputStyle} placeholder="Table 1, Sweetheart Table…" autoFocus />
            </div>

            <div>
              <label style={{ fontSize:12, color:textMuted, display:"block", marginBottom:8 }}>Shape</label>
              <div style={{ display:"flex", gap:8 }}>
                {(["round","rectangle","oval"] as const).map(shape => (
                  <button key={shape} onClick={() => setNewTableShape(shape)}
                    style={{ flex:1, padding:"10px 4px", borderRadius:10, fontSize:13, cursor:"pointer",
                      border:`1px solid ${newTableShape === shape ? accent : border}`,
                      background: newTableShape === shape ? `${accent}22` : surface2,
                      color: newTableShape === shape ? accent : textMuted, fontWeight:700 }}>
                    {shapeEmoji(shape)} {shape}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize:12, color:textMuted, display:"block", marginBottom:8 }}>
                Capacity: <strong style={{ color:text }}>{newTableCap}</strong>
              </label>
              <input type="range" min={1} max={30} value={newTableCap}
                onChange={e => setNewTableCap(Number(e.target.value))}
                style={{ width:"100%", accentColor:accent }} />
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:textMuted, marginTop:4 }}>
                <span>1</span><span>30</span>
              </div>
            </div>
          </div>

          <div style={{ display:"flex", gap:10, marginTop:20 }}>
            <button onClick={() => setShowAddTable(false)}
              style={{ flex:1, background:surface2, color:textMid, border:`1px solid ${border}`,
                borderRadius:12, padding:"14px", fontSize:15, cursor:"pointer" }}>Cancel</button>
            <button
              onClick={async () => {
                if (!newTableName.trim()) return;
                if (addTable) {
                  addTable(newTableName.trim(), newTableShape, newTableCap);
                } else {
                  const newT: Table = {
                    id: crypto.randomUUID(), wedding_id: wedding.id,
                    name: newTableName.trim(), shape: newTableShape,
                    capacity: newTableCap, x: 100, y: 100, venue_id: "",
                  };
                  dispatch({ type:"ADD_TABLE", payload: newT });
                  if (!isDemo) await supabase.from("tables").insert(newT);
                }
                setShowAddTable(false);
                setNewTableName(""); setNewTableShape("round"); setNewTableCap(8);
                showToast("Table added ✓");
              }}
              disabled={!newTableName.trim() || saving}
              style={{ flex:2, background:accent, color:"#fff", border:"none",
                borderRadius:12, padding:"14px", fontSize:15, fontWeight:700,
                cursor:!newTableName.trim() ? "not-allowed" : "pointer",
                opacity:!newTableName.trim() ? 0.6 : 1 }}>
              Add Table
            </button>
          </div>
        </Backdrop>
      )}

      {/* ══ EDIT TABLE NAME SHEET ══ */}
      {editTable && (
        <Backdrop onClose={() => setEditTable(null)} cardBg={card} borderColor={border}>
          <div style={{ fontWeight:800, fontSize:18, color:text, marginBottom:20 }}>✏️ Rename Table</div>
          <label style={{ fontSize:12, color:textMuted, display:"block", marginBottom:6 }}>Table name</label>
          <input value={tableNameEdit} onChange={e => setTableNameEdit(e.target.value)}
            autoFocus style={inputStyle} placeholder="e.g. Sweetheart Table"
            onKeyDown={e => { if (e.key === "Enter") saveTableName(); }} />
          <div style={{ display:"flex", gap:10, marginTop:16 }}>
            <button onClick={() => setEditTable(null)}
              style={{ flex:1, background:surface2, color:textMid, border:`1px solid ${border}`,
                borderRadius:12, padding:"14px", fontSize:15, cursor:"pointer" }}>Cancel</button>
            <button onClick={saveTableName} disabled={!tableNameEdit.trim() || saving}
              style={{ flex:2, background:accent, color:"#fff", border:"none",
                borderRadius:12, padding:"14px", fontSize:15, fontWeight:700,
                cursor:!tableNameEdit.trim() ? "not-allowed" : "pointer",
                opacity:!tableNameEdit.trim() ? 0.6 : 1 }}>
              {saving ? "Saving…" : "Save Name"}
            </button>
          </div>
          <button onClick={() => setConfirmModal({ message:`Delete table "${editTable.name}"?`, onConfirm:() => deleteTable(editTable.id) })}
            style={{ width:"100%", background:`${danger}15`, color:danger, border:`1px solid ${danger}33`,
              borderRadius:12, padding:"12px", fontSize:14, fontWeight:700, cursor:"pointer", marginTop:10 }}>
            🗑️ Delete Table
          </button>
        </Backdrop>
      )}

      {/* ══ ADD RULE SHEET ══ */}
      {showAddRule && (
        <Backdrop onClose={() => setShowAddRule(false)} cardBg={card} borderColor={border}>
          <div style={{ fontWeight:800, fontSize:18, color:text, marginBottom:20 }}>📋 Add Seating Rule</div>

          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div>
              <label style={{ fontSize:12, color:textMuted, display:"block", marginBottom:4 }}>Guest 1</label>
              <select value={ruleGuest1} onChange={e => setRuleGuest1(e.target.value)} style={inputStyle}>
                <option value="">Select a guest…</option>
                {guests.map(g => (
                  <option key={g.id} value={g.id}>{g.first_name} {g.last_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, color:textMuted, display:"block", marginBottom:6 }}>Rule type</label>
              <div style={{ display:"flex", gap:8 }}>
                {(["must_sit_with","must_not_sit_with"] as const).map(rt => (
                  <button key={rt} onClick={() => setRuleType(rt)}
                    style={{ flex:1, padding:"10px 6px", borderRadius:10, fontSize:12, fontWeight:700, cursor:"pointer",
                      border:`1px solid ${ruleType === rt ? (rt === "must_sit_with" ? success : danger) : border}`,
                      background: ruleType === rt ? `${rt === "must_sit_with" ? success : danger}22` : surface2,
                      color: ruleType === rt ? (rt === "must_sit_with" ? success : danger) : textMuted }}>
                    {rt === "must_sit_with" ? "💚 Must sit together" : "🚫 Must sit apart"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize:12, color:textMuted, display:"block", marginBottom:4 }}>Guest 2</label>
              <select value={ruleGuest2} onChange={e => setRuleGuest2(e.target.value)} style={inputStyle}>
                <option value="">Select a guest…</option>
                {guests.filter(g => g.id !== ruleGuest1).map(g => (
                  <option key={g.id} value={g.id}>{g.first_name} {g.last_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display:"flex", gap:10, marginTop:20 }}>
            <button onClick={() => setShowAddRule(false)}
              style={{ flex:1, background:surface2, color:textMid, border:`1px solid ${border}`,
                borderRadius:12, padding:"14px", fontSize:15, cursor:"pointer" }}>Cancel</button>
            <button onClick={addRule} disabled={!ruleGuest1 || !ruleGuest2 || ruleGuest1 === ruleGuest2 || saving}
              style={{ flex:2, background:accent, color:"#fff", border:"none",
                borderRadius:12, padding:"14px", fontSize:15, fontWeight:700,
                cursor:(!ruleGuest1 || !ruleGuest2) ? "not-allowed" : "pointer",
                opacity:(!ruleGuest1 || !ruleGuest2) ? 0.6 : 1 }}>
              Add Rule
            </button>
          </div>
        </Backdrop>
      )}

      {/* ══ CONFIRM MODAL ══ */}
      {confirmModal && (
        <Backdrop onClose={() => setConfirmModal(null)} cardBg={card} borderColor={border}>
          <div style={{ fontWeight:800, fontSize:18, color:text, marginBottom:12 }}>⚠️ Are you sure?</div>
          <p style={{ fontSize:14, color:textMid, marginBottom:20 }}>{confirmModal.message}</p>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => setConfirmModal(null)}
              style={{ flex:1, background:surface2, color:textMid, border:`1px solid ${border}`,
                borderRadius:12, padding:"14px", fontSize:15, cursor:"pointer" }}>Cancel</button>
            <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }}
              style={{ flex:1, background:danger, color:"#fff", border:"none",
                borderRadius:12, padding:"14px", fontSize:15, fontWeight:700, cursor:"pointer" }}>
              Confirm
            </button>
          </div>
        </Backdrop>
      )}

      {/* ══ TOAST ══ */}
      {toast && (
        <div style={{
          position:"fixed", bottom:90, left:"50%", transform:"translateX(-50%)",
          background: dark ? "#3C3538" : "#2A1F1A", color:"#FDF0E8",
          borderRadius:20, padding:"10px 20px", fontSize:14, fontWeight:600,
          zIndex:500, boxShadow:"0 4px 20px rgba(0,0,0,0.4)",
          whiteSpace:"nowrap", pointerEvents:"none",
        }}>
          {toast}
        </div>
      )}

      {/* ══ ERROR TOAST ══ */}
      {errorMsg && (
        <div style={{
          position:"fixed", bottom:130, left:"50%", transform:"translateX(-50%)",
          background: danger, color:"#fff",
          borderRadius:20, padding:"10px 20px", fontSize:13, fontWeight:600,
          zIndex:500, boxShadow:"0 4px 20px rgba(0,0,0,0.3)",
          maxWidth:"80vw", textAlign:"center", pointerEvents:"none",
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

    </div>
  );
}
