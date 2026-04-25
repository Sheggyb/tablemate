"use client";

import { useState, useCallback } from "react";
import type { Guest, Group, Table } from "@/lib/types";

interface Props {
  guests:        Guest[];
  groups:        Group[];
  tables:        Table[];
  plan:          string;
  darkMode:      boolean;
  weddingId:     string;
  isDemo?:       boolean;
  onAddGuest:    (data: Partial<Guest>) => void;
  onUpdateGuest: (id: string, data: Partial<Guest>) => void;
  onDeleteGuest: (id: string) => void;
  onBulkUpdate:  (ids: string[], data: Partial<Guest>) => void;
  onBulkDelete:  (ids: string[]) => void;
  onImportCsv:   (text: string) => Promise<string>;
  onAddGroup:    (name: string) => void;
  showToast?:    (msg: string, type?: "success" | "error" | "info") => void;
}

type SortKey = "name" | "rsvp" | "meal" | "table" | "party";
type SortDir = "asc" | "desc";

const MEALS = ["standard","vegetarian","vegan","gluten-free","halal","kosher","children"];
const RSVP_OPTIONS = ["pending","confirmed","declined"];

const MEAL_ICON: Record<string, string> = {
  standard: "🍽", vegetarian: "🌿", vegan: "🌱",
  "gluten-free": "🌾", halal: "☪", kosher: "✡", children: "🧒",
};

const GROUP_COLORS = ["#c9a96e","#7B9E87","#8B7BA8","#C97B6E","#6E9EC9","#B8A86E","#e8b4cb","#9EC9A6"];

export default function GuestPanel({
  guests, groups, tables, plan, darkMode, weddingId, isDemo,
  onAddGuest, onUpdateGuest, onDeleteGuest,
  onBulkUpdate, onBulkDelete, onImportCsv, onAddGroup, showToast,
}: Props) {
  const [sendingRsvp, setSendingRsvp] = useState<string | null>(null);

  const sendRsvp = async (g: Guest) => {
    if (!g.email) { showToast?.("Guest has no email address.", "error"); return; }
    setSendingRsvp(g.id);
    try {
      const res = await fetch("/api/rsvp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestIds: [g.id], weddingId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      showToast?.(`RSVP sent to ${g.email}`, "success");
    } catch (e: any) {
      showToast?.(`Failed to send: ${e.message}`, "error");
    } finally {
      setSendingRsvp(null);
    }
  };
  const [search, setSearch]         = useState("");
  const [filterRsvp, setFilterRsvp] = useState("all");
  const [filterMeal, setFilterMeal] = useState("all");
  const [filterSeated, setFilterSeated] = useState("all");
  const [filterParty, setFilterParty]   = useState("all");
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [sortKey, setSortKey]           = useState<SortKey>("name");
  const [sortDir, setSortDir]           = useState<SortDir>("asc");
  const [showAdd, setShowAdd]           = useState(false);
  const [editGuest, setEditGuest]       = useState<Guest | null>(null);
  const [form, setForm]                 = useState<Partial<Guest>>({});
  const [csvMsg, setCsvMsg]             = useState("");
  const [bulkRsvp, setBulkRsvp]         = useState("");
  const [bulkMeal, setBulkMeal]         = useState("");
  const [bulkParty, setBulkParty]       = useState("");

  const cs = {
    surface:    "var(--surface)",
    surface2:   "var(--surface2)",
    border:     "var(--border)",
    borderSoft: "var(--border-soft)",
    text:       "var(--text)",
    textMid:    "var(--text-mid)",
    textSoft:   "var(--text-soft)",
    textMuted:  "var(--text-muted)",
    accent:     "var(--accent)",
    accentDark: "var(--accent-dark)",
    accentBg:   "var(--accent-bg)",
    bg:         "var(--bg)",
  };

  const groupColor = (groupId?: string | null) => {
    if (!groupId) return cs.textMuted;
    const idx = groups.findIndex(g => g.id === groupId) % GROUP_COLORS.length;
    return GROUP_COLORS[idx < 0 ? 0 : idx];
  };

  const rsvpStyle = (rsvp?: string) => {
    if (rsvp === "confirmed") return { bg: "rgba(76,175,125,0.15)", color: "var(--success)", border: "rgba(76,175,125,0.3)" };
    if (rsvp === "declined")  return { bg: "rgba(224,92,106,0.15)", color: "var(--danger)",  border: "rgba(224,92,106,0.3)" };
    return { bg: "rgba(240,168,88,0.15)", color: "var(--warning)", border: "rgba(240,168,88,0.3)" };
  };

  const filtered = guests.filter(g => {
    const name = `${g.first_name} ${g.last_name}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || (g.email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchRsvp   = filterRsvp === "all" || g.rsvp === filterRsvp;
    const matchMeal   = filterMeal === "all" || g.meal === filterMeal;
    const matchSeated = filterSeated === "all" || (filterSeated === "seated" ? !!g.table_id : !g.table_id);
    const matchParty  = filterParty === "all" || g.group_id === filterParty;
    return matchSearch && matchRsvp && matchMeal && matchSeated && matchParty;
  }).sort((a, b) => {
    let av = "", bv = "";
    if (sortKey === "name")  { av = `${a.first_name} ${a.last_name}`; bv = `${b.first_name} ${b.last_name}`; }
    if (sortKey === "rsvp")  { av = a.rsvp ?? ""; bv = b.rsvp ?? ""; }
    if (sortKey === "meal")  { av = a.meal ?? ""; bv = b.meal ?? ""; }
    if (sortKey === "table") { av = tables.find(t => t.id === a.table_id)?.name ?? ""; bv = tables.find(t => t.id === b.table_id)?.name ?? ""; }
    if (sortKey === "party") { av = groups.find(g => g.id === a.group_id)?.name ?? ""; bv = groups.find(g => g.id === b.group_id)?.name ?? ""; }
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const toggleSelect = (id: string) => setSelected(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  const selectAll = () => setSelected(new Set(filtered.map(g => g.id)));
  const clearSel  = () => setSelected(new Set());

  const openAdd  = () => { setForm({ first_name: "", last_name: "", email: "", meal: "standard", rsvp: "pending" }); setEditGuest(null); setShowAdd(true); };
  const openEdit = (g: Guest) => { setForm({ ...g }); setEditGuest(g); setShowAdd(true); };

  const handleSave = () => {
    if (!form.first_name?.trim()) return;
    if (editGuest) onUpdateGuest(editGuest.id, form);
    else           onAddGuest(form);
    setShowAdd(false);
  };

  const handleCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const msg = await onImportCsv(text);
    setCsvMsg(msg);
    setTimeout(() => setCsvMsg(""), 4000);
    e.target.value = "";
  };

  const sortToggle = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };
  const sortIcon = (key: SortKey) => sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  const applyBulk = () => {
    const ids = [...selected];
    const data: Partial<Guest> = {};
    if (bulkRsvp)  data.rsvp  = bulkRsvp as any;
    if (bulkMeal)  data.meal  = bulkMeal as any;
    if (bulkParty) data.group_id = bulkParty;
    if (Object.keys(data).length) onBulkUpdate(ids, data);
    setBulkRsvp(""); setBulkMeal(""); setBulkParty("");
    clearSel();
  };

  const stats = {
    total:     guests.length,
    confirmed: guests.filter(g => g.rsvp === "confirmed").length,
    pending:   guests.filter(g => g.rsvp === "pending").length,
    declined:  guests.filter(g => g.rsvp === "declined").length,
    seated:    guests.filter(g => !!g.table_id).length,
  };

  const inputCls = "px-3 py-2 border rounded-lg text-sm";
  const inputStyle = { background: cs.surface, borderColor: cs.borderSoft, color: cs.text };

  return (
    <div className="flex flex-col h-full" style={{ background: cs.bg }}>

      {/* Stats bar */}
      <div className="px-6 py-3 flex items-center flex-wrap gap-4 text-sm flex-shrink-0"
        style={{ background: cs.surface, borderBottom: `1px solid ${cs.border}` }}>
        <span className="font-semibold" style={{ color: cs.text }}>{stats.total} guests</span>
        <span style={{ color: "var(--success)" }}>✓ {stats.confirmed} confirmed</span>
        <span style={{ color: "var(--warning)" }}>⏳ {stats.pending} pending</span>
        <span style={{ color: "var(--danger)" }}>✗ {stats.declined} declined</span>
        <span style={{ color: "var(--accent)" }}>🪑 {stats.seated} seated</span>
        <div className="flex-1"/>
        {!isDemo && (
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:opacity-80"
            style={{ border: `1px solid ${cs.borderSoft}`, color: cs.textSoft }}>
            📎 Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleCsv}/>
          </label>
        )}
        {isDemo ? (
          <a href="/signup" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 flex items-center gap-1"
            style={{ background: cs.accent }}>
            🔒 Sign up to add guests
          </a>
        ) : (
          <button onClick={openAdd}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90"
            style={{ background: cs.accent }}>
            + Add Guest
          </button>
        )}
      </div>

      {csvMsg && (
        <div className="px-6 py-2 text-sm border-b"
          style={{ background: csvMsg.includes("✓") ? "rgba(76,175,125,0.1)" : "rgba(224,92,106,0.1)", color: csvMsg.includes("✓") ? "var(--success)" : "var(--danger)", borderColor: cs.border }}>
          {csvMsg}
        </div>
      )}

      {/* Filters */}
      <div className="px-6 py-2.5 flex items-center gap-2 flex-wrap flex-shrink-0"
        style={{ background: cs.surface, borderBottom: `1px solid ${cs.border}` }}>
        <input type="search" placeholder="Search guests…" value={search} onChange={e => setSearch(e.target.value)}
          className={`${inputCls} flex-1 min-w-[140px] max-w-xs`} style={inputStyle}/>
        <select value={filterRsvp} onChange={e => setFilterRsvp(e.target.value)}
          className={inputCls} style={inputStyle}>
          <option value="all">All RSVPs</option>
          {RSVP_OPTIONS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
        <select value={filterMeal} onChange={e => setFilterMeal(e.target.value)}
          className={inputCls} style={inputStyle}>
          <option value="all">All Meals</option>
          {MEALS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filterSeated} onChange={e => setFilterSeated(e.target.value)}
          className={inputCls} style={inputStyle}>
          <option value="all">Seated + Unseated</option>
          <option value="seated">Seated</option>
          <option value="unseated">Unseated</option>
        </select>
        <select value={filterParty} onChange={e => setFilterParty(e.target.value)}
          className={inputCls} style={inputStyle}>
          <option value="all">All Parties</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        {(search || filterRsvp !== "all" || filterMeal !== "all" || filterSeated !== "all" || filterParty !== "all") && (
          <button onClick={() => { setSearch(""); setFilterRsvp("all"); setFilterMeal("all"); setFilterSeated("all"); setFilterParty("all"); }}
            className="text-xs px-2 py-1.5 rounded-lg hover:opacity-70" style={{ color: "var(--danger)", border: `1px solid rgba(224,92,106,0.3)` }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Bulk toolbar */}
      {!isDemo && selected.size > 0 && (
        <div className="px-6 py-2 flex items-center gap-3 flex-wrap flex-shrink-0"
          style={{ background: "var(--accent-bg)", borderBottom: `1px solid var(--border)` }}>
          <span className="text-xs font-semibold" style={{ color: cs.accent }}>{selected.size} selected</span>
          <select value={bulkRsvp} onChange={e => setBulkRsvp(e.target.value)}
            className="px-2 py-1.5 rounded-lg text-xs border" style={inputStyle}>
            <option value="">Set RSVP…</option>
            {RSVP_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={bulkMeal} onChange={e => setBulkMeal(e.target.value)}
            className="px-2 py-1.5 rounded-lg text-xs border" style={inputStyle}>
            <option value="">Set Meal…</option>
            {MEALS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={bulkParty} onChange={e => setBulkParty(e.target.value)}
            className="px-2 py-1.5 rounded-lg text-xs border" style={inputStyle}>
            <option value="">Assign Party…</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          {(bulkRsvp || bulkMeal || bulkParty) && (
            <button onClick={applyBulk}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ background: cs.accent }}>Apply</button>
          )}
          <button onClick={() => { if (confirm(`Delete ${selected.size} guests?`)) { onBulkDelete([...selected]); clearSel(); } }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ color: "var(--danger)", border: "1px solid rgba(224,92,106,0.3)" }}>
            🗑 Delete
          </button>
          <button onClick={clearSel} className="text-xs hover:opacity-70 ml-auto" style={{ color: cs.textMuted }}>✕ Clear</button>
        </div>
      )}

      {/* Guest table */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-sm mb-4" style={{ color: cs.textMuted }}>
              {search || filterRsvp !== "all" ? "No guests match your filters." : "No guests yet. Add your first guest!"}
            </p>
            {!search && filterRsvp === "all" && (
              <button onClick={openAdd} className="text-sm hover:underline font-medium" style={{ color: cs.accent }}>+ Add Guest</button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0" style={{ background: cs.surface }}>
              <tr style={{ borderBottom: `1px solid ${cs.border}` }}>
                <th className="w-10 px-4 py-3 text-left">
                  <input type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={e => e.target.checked ? selectAll() : clearSel()}
                    className="rounded"
                    style={{ accentColor: cs.accent }}/>
                </th>
                {(["name","party","rsvp","meal","table"] as SortKey[]).map(k => (
                  <th key={k} className="px-4 py-3 text-left cursor-pointer select-none"
                    style={{ color: sortKey === k ? cs.accent : cs.textMuted, fontWeight: 600 }}
                    onClick={() => sortToggle(k)}>
                    {k.charAt(0).toUpperCase() + k.slice(1)}{sortIcon(k)}
                  </th>
                ))}
                <th className="px-4 py-3 text-left" style={{ color: cs.textMuted, fontWeight: 600 }}>Needs</th>
                <th className="px-4 py-3"/>
              </tr>
            </thead>
            <tbody>
              {filtered.map(g => {
                const tableLabel = g.table_id ? tables.find(t => t.id === g.table_id)?.name ?? "?" : "—";
                const partyLabel = g.group_id ? groups.find(gr => gr.id === g.group_id)?.name ?? "?" : "—";
                const rv = rsvpStyle(g.rsvp);
                return (
                  <tr key={g.id}
                    draggable
                    onDragStart={e => { e.dataTransfer.setData("guestId", g.id); e.dataTransfer.effectAllowed = "move"; }}
                    className="group cursor-pointer"
                    style={{ borderBottom: `1px solid ${cs.border}` }}
                    onMouseEnter={e => (e.currentTarget.style.background = cs.surface2)}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    onClick={() => toggleSelect(g.id)}
                  >
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(g.id)}
                        onChange={() => toggleSelect(g.id)}
                        style={{ accentColor: cs.accent }}/>
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: cs.text }}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: groupColor(g.group_id) }}/>
                        {g.first_name} {g.last_name}
                        {g.email && <span className="text-xs hidden lg:block" style={{ color: cs.textMuted }}>{g.email}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: cs.textSoft }}>{partyLabel}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                        style={{ background: rv.bg, color: rv.color, border: `1px solid ${rv.border}` }}>
                        {g.rsvp || "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: cs.textSoft }}>
                      {MEAL_ICON[g.meal || "standard"]} {g.meal || "standard"}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: g.table_id ? cs.textSoft : "var(--warning)" }}>
                      {tableLabel}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: cs.textMuted }}>
                      {g.allergies ? `⚠ ${g.allergies}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      {!isDemo && g.email && (
                        <button onClick={() => sendRsvp(g)}
                          disabled={sendingRsvp === g.id}
                          className="opacity-0 group-hover:opacity-100 text-xs mr-3 hover:underline transition-opacity"
                          style={{ color: cs.accent }}>
                          {sendingRsvp === g.id ? "Sending…" : "Send RSVP"}
                        </button>
                      )}
                      {!isDemo && (
                        <button onClick={() => openEdit(g)}
                          className="opacity-0 group-hover:opacity-100 text-xs mr-3 hover:underline transition-opacity"
                          style={{ color: cs.accent }}>Edit</button>
                      )}
                      {!isDemo && (
                        <button onClick={() => { if (confirm(`Remove ${g.first_name}?`)) onDeleteGuest(g.id); }}
                          className="opacity-0 group-hover:opacity-100 text-xs transition-opacity hover:opacity-70"
                          style={{ color: "var(--danger)" }}>✕</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {!isDemo && showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in"
            style={{ background: cs.surface, border: `1px solid ${cs.border}` }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-playfair text-xl font-bold" style={{ color: cs.text }}>
                {editGuest ? "Edit Guest" : "Add Guest"}
              </h3>
              <button onClick={() => setShowAdd(false)} className="text-xl leading-none hover:opacity-60" style={{ color: cs.textMuted }}>×</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: cs.textSoft }}>First name *</label>
                  <input type="text" value={form.first_name || ""} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))}
                    className={`w-full ${inputCls}`} style={inputStyle} placeholder="Jane"/>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: cs.textSoft }}>Last name</label>
                  <input type="text" value={form.last_name || ""} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))}
                    className={`w-full ${inputCls}`} style={inputStyle} placeholder="Smith"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: cs.textSoft }}>Email</label>
                  <input type="email" value={form.email || ""} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className={`w-full ${inputCls}`} style={inputStyle} placeholder="jane@example.com"/>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: cs.textSoft }}>Phone</label>
                  <input type="tel" value={form.phone || ""} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    className={`w-full ${inputCls}`} style={inputStyle} placeholder="+1 555 …"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: cs.textSoft }}>RSVP status</label>
                  <select value={form.rsvp || "pending"} onChange={e => setForm(p => ({ ...p, rsvp: e.target.value as any }))}
                    className={`w-full ${inputCls}`} style={inputStyle}>
                    {RSVP_OPTIONS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: cs.textSoft }}>Meal preference</label>
                  <select value={form.meal || "standard"} onChange={e => setForm(p => ({ ...p, meal: e.target.value as any }))}
                    className={`w-full ${inputCls}`} style={inputStyle}>
                    {MEALS.map(m => <option key={m} value={m}>{MEAL_ICON[m]} {m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: cs.textSoft }}>Party / Group</label>
                <select value={form.group_id || ""} onChange={e => setForm(p => ({ ...p, group_id: e.target.value || null }))}
                  className={`w-full ${inputCls}`} style={inputStyle}>
                  <option value="">No group</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: cs.textSoft }}>Allergies / dietary notes</label>
                <input type="text" value={form.allergies || ""} onChange={e => setForm(p => ({ ...p, allergies: e.target.value }))}
                  className={`w-full ${inputCls}`} style={inputStyle} placeholder="Nuts, dairy, shellfish…"/>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: cs.textSoft }}>Additional notes</label>
                <textarea value={form.notes || ""} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  className={`w-full ${inputCls} resize-none`} style={inputStyle} rows={2} placeholder="Wheelchair access, high chair…"/>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)}
                className="flex-1 py-2.5 rounded-xl text-sm hover:opacity-80"
                style={{ border: `1px solid ${cs.borderSoft}`, color: cs.textSoft }}>Cancel</button>
              <button onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
                style={{ background: cs.accent }}>
                {editGuest ? "Save Changes" : "Add Guest"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
