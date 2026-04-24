"use client";

import { useState } from "react";
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
}

type MobileTab = "tables" | "guests" | "rules" | "export";

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

export default function MobilePlanner({ wedding, tables, guests, groups, rules, dispatch, dark, onToggleDark, isDemo = false, addTable }: Props) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<MobileTab>("tables");
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

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

  // ── Add Table (mobile) ──
  const [showAddTable, setShowAddTable]   = useState(false);
  const [newTableShape, setNewTableShape] = useState<"round"|"rectangle">("round");
  const [newTableCap, setNewTableCap]     = useState(8);

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
  };

  // ── Violations ──
  const violations = rules.filter(r => {
    const g1 = guests.find(g => g.id === r.guest1_id);
    const g2 = guests.find(g => g.id === r.guest2_id);
    if (!g1 || !g2) return false;
    const together = g1.table_id && g1.table_id === g2.table_id;
    return r.type === "must_sit_with" ? !together : !!together;
  });

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  // ── Actions ──
  const unseatGuest = async (guestId: string) => {
    dispatch({ type: "UPDATE_GUEST", id: guestId, data: { table_id: null, seat_index: null } });
    if (!isDemo) await supabase.from("guests").update({ table_id: null, seat_index: null }).eq("id", guestId);
  };

  const seatGuestToTable = async (guest: Guest, tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    const seated = guests.filter(g => g.table_id === tableId).length;
    if (seated >= table.capacity) return;
    dispatch({ type: "UPDATE_GUEST", id: guest.id, data: { table_id: tableId, seat_index: seated } });
    if (!isDemo) await supabase.from("guests").update({ table_id: tableId, seat_index: seated }).eq("id", guest.id);
    setSeatGuest(null);
    showToast("Guest seated ✓");
  };

  const updateGuestRsvp = async (guest: Guest, rsvp: Rsvp) => {
    dispatch({ type: "UPDATE_GUEST", id: guest.id, data: { rsvp } });
    if (!isDemo) await supabase.from("guests").update({ rsvp }).eq("id", guest.id);
  };

  const saveEditGuest = async () => {
    if (!editGuest || !guestForm.first_name?.trim()) return;
    const data: Partial<Guest> = {
      first_name: guestForm.first_name,
      last_name:  guestForm.last_name || "",
      email:      guestForm.email || "",
      meal:       guestForm.meal as Meal,
      rsvp:       guestForm.rsvp as Rsvp,
      notes:      guestForm.notes || "",
    };
    dispatch({ type: "UPDATE_GUEST", id: editGuest.id, data });
    if (!isDemo) await supabase.from("guests").update(data).eq("id", editGuest.id);
    setEditGuest(null);
    showToast("Guest saved ✓");
  };

  const deleteGuest = async (id: string) => {
    dispatch({ type: "DELETE_GUEST", id });
    if (!isDemo) await supabase.from("guests").delete().eq("id", id);
    setEditGuest(null);
    showToast("Guest removed");
  };

  const addGuest = async () => {
    if (!guestForm.first_name?.trim()) return;
    const newGuest: Guest = {
      id: crypto.randomUUID(), wedding_id: wedding.id,
      first_name: guestForm.first_name || "", last_name: guestForm.last_name || null,
      email: guestForm.email || null, phone: null,
      rsvp: (guestForm.rsvp as Rsvp) || "pending", meal: (guestForm.meal as Meal) || "standard",
      allergies: null, notes: null, group_id: null, table_id: null, seat_index: null,
      rsvp_token: crypto.randomUUID(),
    };
    dispatch({ type: "ADD_GUEST", payload: newGuest });
    if (!isDemo) await supabase.from("guests").insert(newGuest);
    setShowAddGuest(false);
    setGuestForm({ first_name: "", last_name: "", email: "", meal: "standard", rsvp: "pending" });
    showToast("Guest added ✓");
  };

  const saveTableName = async () => {
    if (!editTable || !tableNameEdit.trim()) return;
    dispatch({ type: "UPDATE_TABLE", id: editTable.id, data: { name: tableNameEdit.trim() } });
    if (!isDemo) await supabase.from("tables").update({ name: tableNameEdit.trim() }).eq("id", editTable.id);
    setEditTable(null);
    showToast("Table renamed ✓");
  };

  const deleteTable = async (id: string) => {
    dispatch({ type: "DELETE_TABLE", id });
    if (!isDemo) await supabase.from("tables").delete().eq("id", id);
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
    dispatch({ type: "ADD_RULE", payload: newRule });
    if (!isDemo) await supabase.from("rules").insert(newRule);
    setShowAddRule(false);
    setRuleGuest1(""); setRuleGuest2("");
    showToast("Rule added ✓");
  };

  const deleteRule = async (id: string) => {
    dispatch({ type: "DELETE_RULE", id });
    if (!isDemo) await supabase.from("rules").delete().eq("id", id);
    showToast("Rule removed");
  };

  const filteredGuests = guests.filter(g =>
    `${g.first_name} ${g.last_name}`.toLowerCase().includes(guestSearch.toLowerCase())
  );

  const tabs = [
    { key: "tables" as MobileTab, label: "Tables",  emoji: "🍽️" },
    { key: "guests" as MobileTab, label: "Guests",  emoji: "👥" },
    { key: "rules"  as MobileTab, label: "Rules",   emoji: "📋" },
    { key: "export" as MobileTab, label: "Export",  emoji: "📤" },
  ];

  // ── Modal backdrop helper ──
  const Backdrop = ({ onClose, children }: { onClose: () => void; children: React.ReactNode }) => (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:200, display:"flex", alignItems:"flex-end" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:card, borderRadius:"20px 20px 0 0", width:"100%", padding:"24px 20px 40px",
        maxHeight:"85vh", overflowY:"auto", boxShadow:"0 -8px 32px rgba(0,0,0,0.3)" }}>
        {children}
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:bg, color:text }}>

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
        {/* Stats */}
        <div style={{ fontSize:12, color:textMuted, textAlign:"right" }}>
          <div>{guests.filter(g=>g.rsvp==="confirmed").length}/{guests.length} confirmed</div>
          <div style={{ color: guests.filter(g=>!g.table_id&&g.rsvp!=="declined").length > 0 ? warning : success, fontSize:11 }}>
            {guests.filter(g=>!g.table_id&&g.rsvp!=="declined").length > 0
              ? `${guests.filter(g=>!g.table_id&&g.rsvp!=="declined").length} unseated`
              : "All seated ✓"}
          </div>
        </div>
        <button onClick={onToggleDark}
          style={{ background:surface2, border:"none", borderRadius:8, padding:"6px 10px", color:text, fontSize:16, cursor:"pointer" }}>
          {dark ? "☀️" : "🌙"}
        </button>
      </div>

      {/* ── Content ── */}
      <div style={{ flex:1, overflowY:"auto", paddingBottom:80 }}>

        {/* ══ TABLES ══ */}
        {activeTab === "tables" && (
          <div style={{ padding:"16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <h2 style={{ fontWeight:700, fontSize:18, color:accent, margin:0 }}>Tables</h2>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ fontSize:12, color:textMuted }}>{tables.length} tables · {guests.filter(g=>g.table_id).length} seated</div>
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

            {tables.length === 0 ? (
              <div style={{ textAlign:"center", padding:"48px 0", color:textMuted }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🍽️</div>
                <p style={{ fontSize:14 }}>No tables yet. Tap + Add to create one.</p>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {tables.map(table => {
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
                        {/* Edit button */}
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
                                  <span style={{ fontSize:18 }}>{MEAL_ICON[g.meal||"standard"]??"🍽️"}</span>
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
                                      padding:"5px 10px", fontSize:12, cursor:"pointer", fontWeight:600,
                                      display: isDemo ? "none" : undefined }}>
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

        {/* ══ GUESTS ══ */}
        {activeTab === "guests" && (
          <div style={{ padding:"16px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <h2 style={{ fontWeight:700, fontSize:18, color:accent, margin:0 }}>Guests</h2>
              <button onClick={() => { setShowAddGuest(true); setGuestForm({ first_name:"", last_name:"", email:"", meal:"standard", rsvp:"pending" }); }}
                style={{ background:accent, color:"#fff", border:"none", borderRadius:10,
                  padding:"8px 16px", fontSize:14, fontWeight:700, cursor:"pointer",
                  display: isDemo ? "none" : undefined }}>
                + Add
              </button>
              {isDemo && (
                <a href="/signup" style={{ background:surface2, color:textMuted, border:`1px solid ${border}`,
                  borderRadius:10, padding:"7px 14px", fontSize:13, fontWeight:600, textDecoration:"none" }}>
                  🔒 Sign up to add
                </a>
              )}
            </div>

            {/* Stats */}
            <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
              {[
                { label:`${guests.length} total`, color:text },
                { label:`✅ ${guests.filter(g=>g.rsvp==="confirmed").length}`, color:success },
                { label:`⏳ ${guests.filter(g=>g.rsvp==="pending").length}`, color:warning },
                { label:`❌ ${guests.filter(g=>g.rsvp==="declined").length}`, color:danger },
                { label:`🪑 ${guests.filter(g=>!g.table_id&&g.rsvp!=="declined").length} unseated`, color:textMuted },
              ].map(s => (
                <span key={s.label} style={{ background:card, border:`1px solid ${border}`, borderRadius:8,
                  padding:"4px 10px", fontSize:12, color:s.color, fontWeight:600 }}>{s.label}</span>
              ))}
            </div>

            {/* Search */}
            <input
              type="search" placeholder="🔍 Search guests…"
              value={guestSearch} onChange={e => setGuestSearch(e.target.value)}
              style={{ ...inputStyle, marginBottom:12 }}
            />

            {filteredGuests.length === 0 ? (
              <div style={{ textAlign:"center", padding:"48px 0", color:textMuted }}>
                <div style={{ fontSize:40, marginBottom:12 }}>👥</div>
                <p style={{ fontSize:14 }}>{guests.length === 0 ? "No guests yet." : "No matches."}</p>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {filteredGuests.map(g => {
                  const tableLabel = g.table_id ? tables.find(t=>t.id===g.table_id)?.name : null;
                  return (
                    <div key={g.id} style={{ background:card, borderRadius:12, border:`1px solid ${border}`,
                      padding:"14px", display:"flex", alignItems:"center", gap:12 }}>
                      <span style={{ fontSize:22 }}>{MEAL_ICON[g.meal||"standard"]??"🍽️"}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:15 }}>{g.first_name} {g.last_name}</div>
                        <div style={{ fontSize:12, color:textMuted, marginTop:2 }}>
                          {g.meal||"standard"}
                          {tableLabel
                            ? <span style={{ color:accent, marginLeft:6 }}>· {tableLabel}</span>
                            : <span style={{ color:warning, marginLeft:6 }}>· unseated</span>
                          }
                        </div>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                        {/* Tappable RSVP badge */}
                        <select
                          value={g.rsvp||"pending"}
                          onChange={e => updateGuestRsvp(g, e.target.value as Rsvp)}
                          style={{ fontSize:11, fontWeight:700, borderRadius:6, padding:"3px 6px",
                            background:`${rsvpColor(g.rsvp)}22`, color:rsvpColor(g.rsvp),
                            border:`1px solid ${rsvpColor(g.rsvp)}44`, cursor:"pointer", outline:"none" }}>
                          {RSVP_OPTIONS.map(r => <option key={r} value={r}>{RSVP_LABEL[r]}</option>)}
                        </select>
                        <div style={{ display:"flex", gap:4 }}>
                          {/* Seat button */}
                          {!isDemo && !g.table_id && g.rsvp !== "declined" && (
                            <button onClick={() => setSeatGuest(g)}
                              style={{ fontSize:11, padding:"3px 8px", borderRadius:6, cursor:"pointer",
                                background:`${success}22`, color:success, border:`1px solid ${success}44`, fontWeight:600 }}>
                              Seat
                            </button>
                          )}
                          {/* Edit */}
                          {!isDemo && (
                            <button onClick={() => { setEditGuest(g); setGuestForm({ ...g }); }}
                              style={{ fontSize:11, padding:"3px 8px", borderRadius:6, cursor:"pointer",
                                background:surface2, color:textMid, border:`1px solid ${border}` }}>
                              ✏️
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ RULES ══ */}
        {activeTab === "rules" && (
          <div style={{ padding:"16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <h2 style={{ fontWeight:700, fontSize:18, color:accent, margin:0 }}>Seating Rules</h2>
              <button onClick={() => setShowAddRule(true)}
                style={{ background:accent, color:"#fff", border:"none", borderRadius:10,
                  padding:"8px 16px", fontSize:14, fontWeight:700, cursor:"pointer",
                  display: isDemo ? "none" : undefined }}>
                + Add
              </button>
              {isDemo && (
                <a href="/signup" style={{ background:surface2, color:textMuted, border:`1px solid ${border}`,
                  borderRadius:10, padding:"7px 14px", fontSize:13, fontWeight:600, textDecoration:"none" }}>
                  🔒 Sign up to add
                </a>
              )}
            </div>

            {violations.length > 0 && (
              <div style={{ background:"rgba(224,92,106,0.12)", border:"1px solid rgba(224,92,106,0.3)",
                borderRadius:12, padding:"12px 14px", marginBottom:14 }}>
                <div style={{ fontWeight:700, fontSize:13, color:danger, marginBottom:6 }}>
                  ⚠️ {violations.length} violation{violations.length!==1?"s":""}
                </div>
                {violations.map(r => {
                  const g1 = guests.find(g=>g.id===r.guest1_id);
                  const g2 = guests.find(g=>g.id===r.guest2_id);
                  return (
                    <div key={r.id} style={{ fontSize:13, color:danger, marginTop:4 }}>
                      {g1?.first_name} {g1?.last_name} &amp; {g2?.first_name} {g2?.last_name}
                      {" — "}{r.type==="must_sit_with"?"must sit together":"must sit apart"}
                    </div>
                  );
                })}
              </div>
            )}

            {rules.length === 0 ? (
              <div style={{ textAlign:"center", padding:"48px 0", color:textMuted }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
                <p style={{ fontSize:14 }}>No rules yet. Tap + Add to create one.</p>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {rules.map(r => {
                  const g1 = guests.find(g=>g.id===r.guest1_id);
                  const g2 = guests.find(g=>g.id===r.guest2_id);
                  const isViolated = violations.some(v=>v.id===r.id);
                  return (
                    <div key={r.id} style={{ background:card, borderRadius:12,
                      border:`1px solid ${isViolated?"rgba(224,92,106,0.4)":border}`,
                      padding:"14px", display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:20 }}>{r.type==="must_sit_with"?"🤝":"🚫"}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, fontSize:14 }}>
                          {g1?.first_name} {g1?.last_name}
                          <span style={{ color:textMuted, fontWeight:400 }}> &amp; </span>
                          {g2?.first_name} {g2?.last_name}
                        </div>
                        <div style={{ fontSize:12, color:isViolated?danger:textMuted, marginTop:2 }}>
                          {r.type==="must_sit_with"?"Must sit together":"Must not sit together"}
                          {isViolated&&" · ⚠️ Violated"}
                        </div>
                      </div>
                      {!isDemo && (
                        <button onClick={() => deleteRule(r.id)}
                          style={{ background:"rgba(224,92,106,0.15)", color:danger,
                            border:`1px solid rgba(224,92,106,0.3)`, borderRadius:8,
                            padding:"6px 10px", fontSize:13, cursor:"pointer" }}>🗑️</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {/* ══ EXPORT ══ */}
        {/* ══ EXPORT ══ */}
        {activeTab === "export" && (
          <div style={{ padding:"16px" }}>
            <h2 style={{ fontWeight:700, fontSize:18, color:accent, marginBottom:16 }}>Export & Stats</h2>

            {/* Stats cards */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
              {[
                { label:"Total Guests",  value: guests.length,                                  emoji:"👥" },
                { label:"Confirmed",     value: guests.filter(g=>g.rsvp==="confirmed").length,  emoji:"✅", color:success },
                { label:"Pending",       value: guests.filter(g=>g.rsvp==="pending").length,    emoji:"⏳", color:warning },
                { label:"Declined",      value: guests.filter(g=>g.rsvp==="declined").length,   emoji:"❌", color:danger },
                { label:"Seated",        value: guests.filter(g=>g.table_id).length,            emoji:"🪑", color:accent },
                { label:"Tables",        value: tables.length,                                  emoji:"🍽️" },
              ].map(s => (
                <div key={s.label} style={{ background:card, borderRadius:12, border:`1px solid ${border}`,
                  padding:"14px", textAlign:"center" }}>
                  <div style={{ fontSize:24, marginBottom:4 }}>{s.emoji}</div>
                  <div style={{ fontSize:26, fontWeight:800, color: (s as any).color || text }}>{s.value}</div>
                  <div style={{ fontSize:11, color:textMuted, marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Meal breakdown */}
            <div style={{ background:card, borderRadius:12, border:`1px solid ${border}`, padding:"16px", marginBottom:20 }}>
              <div style={{ fontWeight:700, fontSize:14, color:text, marginBottom:12 }}>🍽️ Meal Breakdown</div>
              {Object.entries(
                guests.reduce((acc, g) => { const m = g.meal||"standard"; acc[m]=(acc[m]||0)+1; return acc; }, {} as Record<string,number>)
              ).map(([meal, count]) => (
                <div key={meal} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                  <span style={{ fontSize:18, width:24 }}>{MEAL_ICON[meal]??"🍽️"}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}>
                      <span style={{ textTransform:"capitalize", color:text }}>{meal}</span>
                      <span style={{ color:textMuted, fontWeight:700 }}>{count}</span>
                    </div>
                    <div style={{ height:4, borderRadius:2, background:surface2, marginTop:4 }}>
                      <div style={{ height:"100%", borderRadius:2, background:accent,
                        width:`${Math.round((count/Math.max(guests.length,1))*100)}%` }}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Download section */}
            <div style={{ background:card, borderRadius:12, border:`1px solid ${border}`, padding:"16px" }}>
              <div style={{ fontWeight:700, fontSize:14, color:text, marginBottom:12 }}>📥 Downloads</div>
              {isDemo ? (
                <div style={{ textAlign:"center", padding:"20px 0" }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>🔒</div>
                  <p style={{ fontSize:14, color:textMuted, marginBottom:16 }}>Sign up to download your guest list, seating chart, and more.</p>
                  <a href="/signup" style={{ background:accent, color:"#fff", borderRadius:12,
                    padding:"12px 28px", fontSize:15, fontWeight:700, textDecoration:"none", display:"inline-block" }}>
                    Create Free Account →
                  </a>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {[
                    { label:"Guest List (CSV)",     emoji:"📊" },
                    { label:"Seating Chart (PDF)",  emoji:"📋" },
                    { label:"Table Plan (PDF)",     emoji:"🗺️" },
                  ].map(d => (
                    <div key={d.label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                      background:surface2, borderRadius:10, padding:"12px 14px" }}>
                      <span style={{ fontSize:14, color:text }}>{d.emoji} {d.label}</span>
                      <span style={{ fontSize:12, color:textMuted }}>Use desktop</span>
                    </div>
                  ))}
                  <p style={{ fontSize:12, color:textMuted, textAlign:"center", marginTop:4 }}>
                    Open TableMate on a desktop browser for full export options.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Tab Bar ── */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:card,
        borderTop:`1px solid ${border}`, display:"flex", height:64, zIndex:100,
        boxShadow:"0 -4px 16px rgba(0,0,0,0.15)" }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", gap:3, background:"transparent", border:"none", cursor:"pointer",
              color: activeTab===tab.key ? accent : textMuted,
              borderTop: activeTab===tab.key ? `2px solid ${accent}` : "2px solid transparent" }}>
            <span style={{ fontSize:20 }}>{tab.emoji}</span>
            <span style={{ fontSize:11, fontWeight: activeTab===tab.key ? 700 : 500 }}>{tab.label}</span>
            {tab.key==="rules" && violations.length>0 && (
              <span style={{ position:"absolute", top:8, width:16, height:16, borderRadius:"50%",
                background:danger, color:"#fff", fontSize:9, fontWeight:700,
                display:"flex", alignItems:"center", justifyContent:"center" }}>{violations.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ══ MODALS ══ */}

      {/* Add / Edit Guest */}
      {(showAddGuest || editGuest) && (
        <Backdrop onClose={() => { setShowAddGuest(false); setEditGuest(null); }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <h3 style={{ fontWeight:700, fontSize:20, color:text, margin:0 }}>{editGuest?"Edit Guest":"Add Guest"}</h3>
            <button onClick={() => { setShowAddGuest(false); setEditGuest(null); }}
              style={{ background:"none", border:"none", color:textMuted, fontSize:24, cursor:"pointer" }}>×</button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <label style={{ fontSize:12, color:textMid, display:"block", marginBottom:5 }}>First name *</label>
                <input type="text" value={guestForm.first_name||""} onChange={e=>setGuestForm(p=>({...p,first_name:e.target.value}))} placeholder="Jane" style={inputStyle}/>
              </div>
              <div>
                <label style={{ fontSize:12, color:textMid, display:"block", marginBottom:5 }}>Last name</label>
                <input type="text" value={guestForm.last_name||""} onChange={e=>setGuestForm(p=>({...p,last_name:e.target.value}))} placeholder="Smith" style={inputStyle}/>
              </div>
            </div>
            <div>
              <label style={{ fontSize:12, color:textMid, display:"block", marginBottom:5 }}>Email</label>
              <input type="email" value={guestForm.email||""} onChange={e=>setGuestForm(p=>({...p,email:e.target.value}))} placeholder="jane@example.com" style={inputStyle}/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <label style={{ fontSize:12, color:textMid, display:"block", marginBottom:5 }}>Meal</label>
                <select value={guestForm.meal||"standard"} onChange={e=>setGuestForm(p=>({...p,meal:e.target.value as Meal}))} style={{ ...inputStyle, appearance:"none" as any }}>
                  {MEALS_ALL.map(m=><option key={m} value={m}>{MEAL_ICON[m]??""} {m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:12, color:textMid, display:"block", marginBottom:5 }}>RSVP</label>
                <select value={guestForm.rsvp||"pending"} onChange={e=>setGuestForm(p=>({...p,rsvp:e.target.value as Rsvp}))} style={{ ...inputStyle, appearance:"none" as any }}>
                  {RSVP_OPTIONS.map(r=><option key={r} value={r}>{RSVP_LABEL[r]}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize:12, color:textMid, display:"block", marginBottom:5 }}>Notes</label>
              <input type="text" value={guestForm.notes||""} onChange={e=>setGuestForm(p=>({...p,notes:e.target.value}))} placeholder="Any notes…" style={inputStyle}/>
            </div>
            <button onClick={editGuest ? saveEditGuest : addGuest}
              style={{ background:accent, color:"#fff", border:"none", borderRadius:12,
                padding:"14px", fontSize:16, fontWeight:700, cursor:"pointer", marginTop:4 }}>
              {editGuest?"Save Changes":"Add Guest"}
            </button>
            {editGuest && (
              <button onClick={() => { if(confirm("Delete this guest?")) deleteGuest(editGuest.id); }}
                style={{ background:"rgba(224,92,106,0.12)", color:danger, border:`1px solid rgba(224,92,106,0.3)`,
                  borderRadius:12, padding:"12px", fontSize:14, fontWeight:600, cursor:"pointer" }}>
                🗑️ Delete Guest
              </button>
            )}
          </div>
        </Backdrop>
      )}

      {/* Seat Guest */}
      {seatGuest && (
        <Backdrop onClose={() => setSeatGuest(null)}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <h3 style={{ fontWeight:700, fontSize:18, color:text, margin:0 }}>
              Seat {seatGuest.first_name} {seatGuest.last_name}
            </h3>
            <button onClick={() => setSeatGuest(null)} style={{ background:"none", border:"none", color:textMuted, fontSize:24, cursor:"pointer" }}>×</button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {tables.map(t => {
              const seated = guests.filter(g=>g.table_id===t.id).length;
              const full   = seated >= t.capacity;
              return (
                <button key={t.id} disabled={full} onClick={() => seatGuestToTable(seatGuest, t.id)}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px",
                    background: full ? surface2 : card, border:`1px solid ${full?"transparent":accent}`,
                    borderRadius:12, cursor: full ? "not-allowed" : "pointer",
                    opacity: full ? 0.5 : 1, color:text, textAlign:"left" }}>
                  <span style={{ fontSize:24 }}>{shapeEmoji(t.shape)}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:15 }}>{t.name}</div>
                    <div style={{ fontSize:12, color:textMuted }}>{t.capacity} seats · {t.shape}</div>
                  </div>
                  <div style={{ fontWeight:700, color: full ? danger : success }}>
                    {seated}/{t.capacity}
                  </div>
                </button>
              );
            })}
          </div>
        </Backdrop>
      )}

      {/* Edit Table */}
      {editTable && (
        <Backdrop onClose={() => setEditTable(null)}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <h3 style={{ fontWeight:700, fontSize:20, color:text, margin:0 }}>Edit Table</h3>
            <button onClick={() => setEditTable(null)} style={{ background:"none", border:"none", color:textMuted, fontSize:24, cursor:"pointer" }}>×</button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ fontSize:12, color:textMid, display:"block", marginBottom:5 }}>Table name</label>
              <input type="text" value={tableNameEdit} onChange={e=>setTableNameEdit(e.target.value)} style={inputStyle}/>
            </div>
            <button onClick={saveTableName}
              style={{ background:accent, color:"#fff", border:"none", borderRadius:12, padding:"14px", fontSize:16, fontWeight:700, cursor:"pointer" }}>
              Save Name
            </button>
            <button onClick={() => { if(confirm(`Delete "${editTable.name}"? All guests will be unseated.`)) deleteTable(editTable.id); }}
              style={{ background:"rgba(224,92,106,0.12)", color:danger, border:`1px solid rgba(224,92,106,0.3)`,
                borderRadius:12, padding:"12px", fontSize:14, fontWeight:600, cursor:"pointer" }}>
              🗑️ Delete Table
            </button>
          </div>
        </Backdrop>
      )}

      {/* Add Rule */}
      {showAddRule && (
        <Backdrop onClose={() => setShowAddRule(false)}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <h3 style={{ fontWeight:700, fontSize:20, color:text, margin:0 }}>Add Seating Rule</h3>
            <button onClick={() => setShowAddRule(false)} style={{ background:"none", border:"none", color:textMuted, fontSize:24, cursor:"pointer" }}>×</button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ fontSize:12, color:textMid, display:"block", marginBottom:5 }}>Rule type</label>
              <select value={ruleType} onChange={e=>setRuleType(e.target.value as any)} style={{ ...inputStyle, appearance:"none" as any }}>
                <option value="must_not_sit_with">🚫 Must NOT sit together</option>
                <option value="must_sit_with">🤝 Must sit together</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, color:textMid, display:"block", marginBottom:5 }}>Guest 1</label>
              <select value={ruleGuest1} onChange={e=>setRuleGuest1(e.target.value)} style={{ ...inputStyle, appearance:"none" as any }}>
                <option value="">— Select guest —</option>
                {guests.map(g=><option key={g.id} value={g.id}>{g.first_name} {g.last_name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, color:textMid, display:"block", marginBottom:5 }}>Guest 2</label>
              <select value={ruleGuest2} onChange={e=>setRuleGuest2(e.target.value)} style={{ ...inputStyle, appearance:"none" as any }}>
                <option value="">— Select guest —</option>
                {guests.filter(g=>g.id!==ruleGuest1).map(g=><option key={g.id} value={g.id}>{g.first_name} {g.last_name}</option>)}
              </select>
            </div>
            <button onClick={addRule} disabled={!ruleGuest1||!ruleGuest2}
              style={{ background:accent, color:"#fff", border:"none", borderRadius:12, padding:"14px",
                fontSize:16, fontWeight:700, cursor:"pointer", opacity:(!ruleGuest1||!ruleGuest2)?0.5:1 }}>
              Add Rule
            </button>
          </div>
        </Backdrop>
      )}

      {/* Add Table */}
      {showAddTable && (
        <Backdrop onClose={() => setShowAddTable(false)}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <h3 style={{ fontWeight:700, fontSize:20, color:text, margin:0 }}>Add Table</h3>
            <button onClick={() => setShowAddTable(false)} style={{ background:"none", border:"none", color:textMuted, fontSize:24, cursor:"pointer" }}>×</button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ fontSize:12, color:textMid, display:"block", marginBottom:8 }}>Shape</label>
              <div style={{ display:"flex", gap:10 }}>
                {(["round","rectangle"] as const).map(s => (
                  <button key={s} onClick={() => setNewTableShape(s)}
                    style={{ flex:1, padding:"12px", borderRadius:10, border:`2px solid ${newTableShape===s ? accent : border}`,
                      background: newTableShape===s ? `${accent}22` : surface2, color: newTableShape===s ? accent : text,
                      cursor:"pointer", fontWeight:600, fontSize:14, textTransform:"capitalize" }}>
                    {s === "round" ? "🔵 Round" : "⬜ Rectangular"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize:12, color:textMid, display:"block", marginBottom:5 }}>Capacity: {newTableCap}</label>
              <input type="range" min={2} max={20} value={newTableCap} onChange={e => setNewTableCap(Number(e.target.value))}
                style={{ width:"100%", accentColor:accent }} />
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:textMuted, marginTop:4 }}>
                <span>2</span><span>20</span>
              </div>
            </div>
            <button onClick={() => {
              const name = `Table ${tables.length + 1}`;
              addTable?.(name, newTableShape, newTableCap);
              setShowAddTable(false);
            }}
              style={{ background:accent, color:"#fff", border:"none", borderRadius:12,
                padding:"14px", fontSize:16, fontWeight:700, cursor:"pointer" }}>
              Add Table
            </button>
          </div>
        </Backdrop>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)",
          background:"#2C2628", color:"#EDE8E3", padding:"12px 20px", borderRadius:12,
          fontSize:14, fontWeight:600, zIndex:999, whiteSpace:"nowrap",
          boxShadow:"0 4px 20px rgba(0,0,0,0.4)", border:`1px solid rgba(255,255,255,0.1)` }}>
          {toast}
        </div>
      )}

    </div>
  );
}
