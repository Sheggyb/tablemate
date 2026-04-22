"use client";

import { useState } from "react";
import type { Dispatch } from "react";
import type { Wedding, Table, Guest, Group, Rule, Meal, Rsvp } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

// ─── Types ───────────────────────────────────────────────────────────────────

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
}

// ─── Constants ───────────────────────────────────────────────────────────────

type MobileTab = "tables" | "guests" | "rules";

const MEAL_ICON: Record<string, string> = {
  standard:      "🍽️",
  vegetarian:    "🥗",
  vegan:         "🌱",
  "gluten-free": "🌾",
  halal:         "☪️",
  kosher:        "✡️",
  children:      "🧒",
  chicken:       "🍗",
  fish:          "🐟",
};

const RSVP_BADGE: Record<string, string> = {
  confirmed: "✅",
  pending:   "⏳",
  declined:  "❌",
};

const MEAL_OPTIONS: { value: Meal; label: string }[] = [
  { value: "standard",    label: "🍽️ Standard" },
  { value: "vegetarian",  label: "🥗 Vegetarian" },
  { value: "chicken",     label: "🍗 Chicken" } as any,
  { value: "fish",        label: "🐟 Fish" } as any,
];

const MEALS_ALL = ["standard","vegetarian","vegan","gluten-free","halal","kosher","children"];

const RSVP_OPTIONS: Rsvp[] = ["pending", "confirmed", "declined"];

function shapeEmoji(shape: string) {
  if (shape === "round" || shape === "oval") return "🔵";
  return "⬜";
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MobilePlanner({ wedding, tables, guests, groups, rules, dispatch, dark }: Props) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<MobileTab>("tables");
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [guestForm, setGuestForm] = useState<Partial<Guest>>({
    first_name: "", last_name: "", email: "", meal: "standard", rsvp: "pending",
  });

  // ── Dark mode colors ──────────────────────────────────────────────────────
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

  // ── Helpers ───────────────────────────────────────────────────────────────
  const seatedCount = (tableId: string) => guests.filter(g => g.table_id === tableId).length;
  const seatedGuests = (tableId: string) => guests.filter(g => g.table_id === tableId);

  const rsvpColor = (rsvp?: string) => {
    if (rsvp === "confirmed") return success;
    if (rsvp === "declined")  return danger;
    return warning;
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const unseatGuest = async (guestId: string) => {
    dispatch({ type: "UPDATE_GUEST", id: guestId, data: { table_id: null, seat_index: null } });
    await supabase.from("guests").update({ table_id: null, seat_index: null }).eq("id", guestId);
  };

  const addGuest = async () => {
    if (!guestForm.first_name?.trim()) return;
    const newGuest: Guest = {
      id: crypto.randomUUID(),
      wedding_id: wedding.id,
      first_name: guestForm.first_name || "",
      last_name: guestForm.last_name || null,
      email: guestForm.email || null,
      phone: null,
      rsvp: (guestForm.rsvp as Rsvp) || "pending",
      meal: (guestForm.meal as Meal) || "standard",
      allergies: null,
      notes: null,
      group_id: null,
      table_id: null,
      seat_index: null,
      rsvp_token: crypto.randomUUID(),
    };
    dispatch({ type: "ADD_GUEST", payload: newGuest });
    await supabase.from("guests").insert(newGuest);
    setShowAddGuest(false);
    setGuestForm({ first_name: "", last_name: "", email: "", meal: "standard", rsvp: "pending" });
  };

  // ── Violations ────────────────────────────────────────────────────────────
  const violations = rules.filter(r => {
    const g1 = guests.find(g => g.id === r.guest1_id);
    const g2 = guests.find(g => g.id === r.guest2_id);
    if (!g1 || !g2) return false;
    const together = g1.table_id && g1.table_id === g2.table_id;
    return r.type === "must_sit_with" ? !together : !!together;
  });

  // ─── Styles ───────────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    background: surface2, border: `1px solid ${border}`, color: text,
    borderRadius: 10, padding: "10px 12px", fontSize: 14, width: "100%",
    outline: "none",
  };

  // ─── Tabs ─────────────────────────────────────────────────────────────────
  const tabs: { key: MobileTab; label: string; emoji: string }[] = [
    { key: "tables", label: "Tables", emoji: "🪑" },
    { key: "guests", label: "Guests", emoji: "👥" },
    { key: "rules",  label: "Rules",  emoji: "📋" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: bg, color: text, overflowY: "hidden" }}>

      {/* ── Content Area ── */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>

        {/* ══ TABLES TAB ══ */}
        {activeTab === "tables" && (
          <div style={{ padding: "16px 16px 0" }}>
            <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 14, color: accent }}>
              Tables
            </h2>
            {tables.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: textMuted }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🪑</div>
                <p style={{ fontSize: 14 }}>No tables yet. Add tables from the desktop view.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {tables.map(table => {
                  const seated  = seatedCount(table.id);
                  const isOpen  = expandedTable === table.id;
                  const full    = seated >= table.capacity;

                  return (
                    <div key={table.id}
                      style={{
                        background: card, borderRadius: 14, border: `1px solid ${border}`,
                        overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                      }}>
                      {/* Card Header — tap to expand */}
                      <button
                        onClick={() => setExpandedTable(isOpen ? null : table.id)}
                        style={{
                          width: "100%", textAlign: "left", padding: "16px",
                          background: "transparent", border: "none", color: text, cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 12,
                        }}>
                        <span style={{ fontSize: 28 }}>{shapeEmoji(table.shape)}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 16 }}>{table.name}</div>
                          <div style={{ fontSize: 12, color: textMuted, marginTop: 2, textTransform: "capitalize" }}>
                            {table.shape} table
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{
                            fontWeight: 700, fontSize: 15,
                            color: full ? danger : seated > 0 ? success : textMuted,
                          }}>
                            {seated}/{table.capacity}
                          </div>
                          <div style={{ fontSize: 11, color: textMuted }}>seated</div>
                        </div>
                        <span style={{ color: textMuted, fontSize: 18, marginLeft: 4 }}>
                          {isOpen ? "▲" : "▼"}
                        </span>
                      </button>

                      {/* Expanded guest list */}
                      {isOpen && (
                        <div style={{ borderTop: `1px solid ${border}`, padding: "12px 16px 16px" }}>
                          {seatedGuests(table.id).length === 0 ? (
                            <p style={{ fontSize: 13, color: textMuted, textAlign: "center", padding: "8px 0" }}>
                              No guests seated here yet.
                            </p>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {seatedGuests(table.id).map(g => (
                                <div key={g.id} style={{
                                  display: "flex", alignItems: "center", gap: 10,
                                  background: surface2, borderRadius: 10, padding: "10px 12px",
                                }}>
                                  <span style={{ fontSize: 18 }}>{MEAL_ICON[g.meal || "standard"] ?? "🍽️"}</span>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                                      {g.first_name} {g.last_name}
                                    </div>
                                    <div style={{ fontSize: 11, color: textMuted }}>
                                      {g.meal || "standard"}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => unseatGuest(g.id)}
                                    style={{
                                      background: "rgba(224,92,106,0.15)", color: danger,
                                      border: `1px solid rgba(224,92,106,0.3)`, borderRadius: 8,
                                      padding: "5px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600,
                                    }}>
                                    Unseat
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
          <div style={{ padding: "16px 16px 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h2 style={{ fontWeight: 700, fontSize: 18, color: accent }}>Guests</h2>
              <button
                onClick={() => setShowAddGuest(true)}
                style={{
                  background: accent, color: "#fff", border: "none",
                  borderRadius: 10, padding: "8px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}>
                + Add
              </button>
            </div>

            {/* Stats row */}
            <div style={{
              display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap",
            }}>
              {[
                { label: `${guests.length} total`, color: text },
                { label: `✅ ${guests.filter(g => g.rsvp === "confirmed").length}`, color: success },
                { label: `⏳ ${guests.filter(g => g.rsvp === "pending").length}`, color: warning },
                { label: `❌ ${guests.filter(g => g.rsvp === "declined").length}`, color: danger },
              ].map(s => (
                <span key={s.label} style={{
                  background: card, border: `1px solid ${border}`, borderRadius: 8,
                  padding: "4px 10px", fontSize: 12, color: s.color, fontWeight: 600,
                }}>
                  {s.label}
                </span>
              ))}
            </div>

            {guests.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: textMuted }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                <p style={{ fontSize: 14 }}>No guests yet. Add your first guest!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {guests.map(g => {
                  const tableLabel = g.table_id ? tables.find(t => t.id === g.table_id)?.name ?? "?" : null;
                  return (
                    <div key={g.id} style={{
                      background: card, borderRadius: 12, border: `1px solid ${border}`,
                      padding: "14px 14px", display: "flex", alignItems: "center", gap: 12,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                    }}>
                      <span style={{ fontSize: 22 }}>{MEAL_ICON[g.meal || "standard"] ?? "🍽️"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {g.first_name} {g.last_name}
                        </div>
                        <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>
                          {g.meal || "standard"}
                          {tableLabel && <span style={{ color: accent, marginLeft: 6 }}>· {tableLabel}</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, borderRadius: 6,
                          padding: "3px 8px",
                          background: `${rsvpColor(g.rsvp)}22`,
                          color: rsvpColor(g.rsvp),
                          border: `1px solid ${rsvpColor(g.rsvp)}44`,
                          textTransform: "capitalize",
                        }}>
                          {RSVP_BADGE[g.rsvp || "pending"]} {g.rsvp || "pending"}
                        </span>
                        {!g.table_id && g.rsvp !== "declined" && (
                          <span style={{ fontSize: 10, color: warning }}>unseated</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ RULES TAB ══ */}
        {activeTab === "rules" && (
          <div style={{ padding: "16px 16px 0" }}>
            <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 14, color: accent }}>Seating Rules</h2>

            {violations.length > 0 && (
              <div style={{
                background: "rgba(224,92,106,0.12)", border: "1px solid rgba(224,92,106,0.3)",
                borderRadius: 12, padding: "12px 14px", marginBottom: 14,
              }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: danger, marginBottom: 6 }}>
                  ⚠️ {violations.length} violation{violations.length !== 1 ? "s" : ""}
                </div>
                {violations.map(r => {
                  const g1 = guests.find(g => g.id === r.guest1_id);
                  const g2 = guests.find(g => g.id === r.guest2_id);
                  return (
                    <div key={r.id} style={{ fontSize: 13, color: danger, marginTop: 4 }}>
                      {g1?.first_name} {g1?.last_name} &amp; {g2?.first_name} {g2?.last_name}
                      {" — "}{r.type === "must_sit_with" ? "must sit together" : "must sit apart"}
                    </div>
                  );
                })}
              </div>
            )}

            {rules.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: textMuted }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                <p style={{ fontSize: 14 }}>No seating rules. Add rules from the desktop view.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {rules.map(r => {
                  const g1 = guests.find(g => g.id === r.guest1_id);
                  const g2 = guests.find(g => g.id === r.guest2_id);
                  const isViolated = violations.some(v => v.id === r.id);
                  return (
                    <div key={r.id} style={{
                      background: card, borderRadius: 12,
                      border: `1px solid ${isViolated ? "rgba(224,92,106,0.4)" : border}`,
                      padding: "14px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{r.type === "must_sit_with" ? "🤝" : "🚫"}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>
                            {g1?.first_name} {g1?.last_name}
                            <span style={{ color: textMuted, fontWeight: 400 }}> &amp; </span>
                            {g2?.first_name} {g2?.last_name}
                          </div>
                          <div style={{ fontSize: 12, color: isViolated ? danger : textMuted, marginTop: 2 }}>
                            {r.type === "must_sit_with" ? "Must sit together" : "Must not sit together"}
                            {isViolated && " · ⚠️ Violated"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom Tab Bar ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: card, borderTop: `1px solid ${border}`,
        display: "flex", height: 64,
        boxShadow: "0 -4px 16px rgba(0,0,0,0.15)",
        zIndex: 100,
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 3, background: "transparent", border: "none",
              cursor: "pointer",
              color: activeTab === tab.key ? accent : textMuted,
              borderTop: activeTab === tab.key ? `2px solid ${accent}` : "2px solid transparent",
              transition: "color 0.15s",
            }}>
            <span style={{ fontSize: 20 }}>{tab.emoji}</span>
            <span style={{ fontSize: 11, fontWeight: activeTab === tab.key ? 700 : 500 }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Add Guest Modal ── */}
      {showAddGuest && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200,
          display: "flex", alignItems: "flex-end",
        }}>
          <div style={{
            background: card, borderRadius: "20px 20px 0 0", width: "100%",
            padding: "24px 20px 36px", boxShadow: "0 -8px 32px rgba(0,0,0,0.3)",
            maxHeight: "90vh", overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: 20, color: text }}>Add Guest</h3>
              <button onClick={() => setShowAddGuest(false)}
                style={{ background: "none", border: "none", color: textMuted, fontSize: 24, cursor: "pointer" }}>
                ×
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: textMid, display: "block", marginBottom: 5 }}>First name *</label>
                  <input
                    type="text"
                    value={guestForm.first_name || ""}
                    onChange={e => setGuestForm(p => ({ ...p, first_name: e.target.value }))}
                    placeholder="Jane"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: textMid, display: "block", marginBottom: 5 }}>Last name</label>
                  <input
                    type="text"
                    value={guestForm.last_name || ""}
                    onChange={e => setGuestForm(p => ({ ...p, last_name: e.target.value }))}
                    placeholder="Smith"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: textMid, display: "block", marginBottom: 5 }}>Email</label>
                <input
                  type="email"
                  value={guestForm.email || ""}
                  onChange={e => setGuestForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="jane@example.com"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: textMid, display: "block", marginBottom: 5 }}>Meal preference</label>
                <select
                  value={guestForm.meal || "standard"}
                  onChange={e => setGuestForm(p => ({ ...p, meal: e.target.value as Meal }))}
                  style={{ ...inputStyle, appearance: "none" as any }}>
                  {MEALS_ALL.map(m => (
                    <option key={m} value={m}>{MEAL_ICON[m] ?? "🍽️"} {m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: textMid, display: "block", marginBottom: 5 }}>RSVP status</label>
                <select
                  value={guestForm.rsvp || "pending"}
                  onChange={e => setGuestForm(p => ({ ...p, rsvp: e.target.value as Rsvp }))}
                  style={{ ...inputStyle, appearance: "none" as any }}>
                  {RSVP_OPTIONS.map(r => (
                    <option key={r} value={r}>{RSVP_BADGE[r]} {r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button
                onClick={() => setShowAddGuest(false)}
                style={{
                  flex: 1, padding: "14px", borderRadius: 12, border: `1px solid ${border}`,
                  background: "transparent", color: textMid, fontSize: 15, cursor: "pointer",
                }}>
                Cancel
              </button>
              <button
                onClick={addGuest}
                style={{
                  flex: 1, padding: "14px", borderRadius: 12, border: "none",
                  background: accent, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
                }}>
                Add Guest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
