"use client";

import { useState, useCallback } from "react";
import type { Guest, Group, Table } from "@/lib/types";

interface Props {
  guests:        Guest[];
  groups:        Group[];
  tables:        Table[];
  plan:          string;
  onAddGuest:    (data: Partial<Guest>) => void;
  onUpdateGuest: (id: string, data: Partial<Guest>) => void;
  onDeleteGuest: (id: string) => void;
  onSendRsvp:    (ids: string[]) => void;
  onAddGroup:    (name: string) => void;
}

const MEALS = ["standard","vegetarian","vegan","gluten-free","halal","kosher","children"];
const RSVP_COLOR: Record<string, string> = {
  pending:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  confirmed: "bg-green-50 text-green-700 border-green-200",
  declined:  "bg-red-50 text-red-700 border-red-200",
};
const MEAL_ICON: Record<string, string> = {
  standard: "🍽️", vegetarian: "🌿", vegan: "🌱",
  "gluten-free": "🌾", halal: "☪️", kosher: "✡️", children: "🧒",
};

export default function GuestPanel({ guests, groups, tables, plan, onAddGuest, onUpdateGuest, onDeleteGuest, onSendRsvp, onAddGroup }: Props) {
  const [search, setSearch]         = useState("");
  const [filterRsvp, setFilterRsvp] = useState("all");
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd]       = useState(false);
  const [editGuest, setEditGuest]   = useState<Guest | null>(null);
  const [form, setForm]             = useState<Partial<Guest>>({ first_name: "", last_name: "", email: "", meal: "standard", rsvp: "pending" });
  const [csvError, setCsvError]     = useState("");

  const canSendRsvp = plan !== "free";

  const filtered = guests.filter(g => {
    const name = `${g.first_name} ${g.last_name}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || g.email?.includes(search.toLowerCase());
    const matchRsvp   = filterRsvp === "all" || g.rsvp === filterRsvp;
    return matchSearch && matchRsvp;
  });

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const selectAll = () => setSelected(new Set(filtered.map(g => g.id)));
  const clearSel  = () => setSelected(new Set());

  const openAdd   = () => { setForm({ first_name:"", last_name:"", email:"", meal:"standard", rsvp:"pending" }); setEditGuest(null); setShowAdd(true); };
  const openEdit  = (g: Guest) => { setForm(g); setEditGuest(g); setShowAdd(true); };

  const handleSave = () => {
    if (!form.first_name?.trim()) return;
    if (editGuest) onUpdateGuest(editGuest.id, form);
    else           onAddGuest(form);
    setShowAdd(false);
  };

  const handleCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvError("");
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").filter(Boolean);
    const header = lines[0].toLowerCase().split(",").map(h => h.trim().replace(/"/g,""));
    const getCol = (row: string[], col: string) => {
      const i = header.indexOf(col);
      return i >= 0 ? row[i]?.trim().replace(/"/g,"") : "";
    };
    let added = 0;
    for (const line of lines.slice(1)) {
      const cols = line.split(",");
      const first = getCol(cols,"first_name") || getCol(cols,"firstname") || getCol(cols,"first");
      const last  = getCol(cols,"last_name")  || getCol(cols,"lastname")  || getCol(cols,"last");
      const email = getCol(cols,"email");
      if (!first && !last) continue;
      onAddGuest({ first_name: first, last_name: last, email, meal: "standard", rsvp: "pending" });
      added++;
    }
    if (!added) setCsvError("No guests found. CSV must have first_name/last_name columns.");
    e.target.value = "";
  };

  const stats = {
    total:     guests.length,
    confirmed: guests.filter(g => g.rsvp === "confirmed").length,
    pending:   guests.filter(g => g.rsvp === "pending").length,
    declined:  guests.filter(g => g.rsvp === "declined").length,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Stats bar */}
      <div className="bg-white border-b border-[#EDE8E0] px-6 py-3 flex items-center gap-6 text-sm flex-shrink-0">
        <div className="text-[#2A2328] font-semibold">{stats.total} guests</div>
        <div className="text-green-600">✓ {stats.confirmed} confirmed</div>
        <div className="text-yellow-600">⏳ {stats.pending} pending</div>
        <div className="text-red-500">✗ {stats.declined} declined</div>
        <div className="flex-1"/>
        <label className="flex items-center gap-1.5 px-3 py-1.5 border border-[#DDD7D0] rounded-lg text-xs text-[#6B6068] hover:border-[#C9956E] cursor-pointer transition-colors">
          📎 Import CSV
          <input type="file" accept=".csv" className="hidden" onChange={handleCsv}/>
        </label>
        <button onClick={openAdd}
          className="px-3 py-1.5 bg-[#C9956E] hover:bg-[#B8845D] text-white text-xs font-semibold rounded-lg transition-colors">
          + Add Guest
        </button>
      </div>

      {csvError && <div className="bg-red-50 px-6 py-2 text-sm text-red-600 border-b border-red-100">{csvError}</div>}

      {/* Filters + bulk actions */}
      <div className="bg-white border-b border-[#EDE8E0] px-6 py-2.5 flex items-center gap-3 flex-shrink-0">
        <input type="search" placeholder="Search guests…" value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 max-w-xs px-3 py-1.5 border border-[#DDD7D0] rounded-lg text-sm focus:outline-none focus:border-[#C9956E]"/>
        <select value={filterRsvp} onChange={e => setFilterRsvp(e.target.value)}
          className="px-3 py-1.5 border border-[#DDD7D0] rounded-lg text-sm focus:outline-none focus:border-[#C9956E] text-[#4A4348]">
          <option value="all">All RSVPs</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="declined">Declined</option>
        </select>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-[#6B6068]">{selected.size} selected</span>
            {canSendRsvp ? (
              <button onClick={() => { onSendRsvp([...selected]); clearSel(); }}
                className="px-3 py-1.5 bg-[#FDF4EC] border border-[#EDD5BC] text-[#C9956E] text-xs font-semibold rounded-lg hover:bg-[#FDE8D0] transition-colors">
                📧 Send RSVP
              </button>
            ) : (
              <span className="text-xs text-[#9B9098]">Upgrade to send RSVPs</span>
            )}
            <button onClick={clearSel} className="text-xs text-[#9B9098] hover:text-[#2A2328]">Clear</button>
          </div>
        )}

        {selected.size === 0 && filtered.length > 0 && (
          <button onClick={selectAll} className="ml-auto text-xs text-[#9B9098] hover:text-[#C9956E] transition-colors">
            Select all
          </button>
        )}
      </div>

      {/* Guest list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-sm text-[#9B9098] mb-4">
              {search ? "No guests match your search." : "No guests yet. Add your first guest!"}
            </p>
            {!search && <button onClick={openAdd} className="text-sm text-[#C9956E] hover:underline font-medium">+ Add Guest</button>}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#FDFBF8] sticky top-0">
              <tr>
                <th className="w-10 px-4 py-3 text-left">
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={e => e.target.checked ? selectAll() : clearSel()}
                    className="rounded border-[#DDD7D0] accent-[#C9956E]"/>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[#2A2328]">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-[#2A2328] hidden md:table-cell">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-[#2A2328]">RSVP</th>
                <th className="px-4 py-3 text-left font-semibold text-[#2A2328] hidden sm:table-cell">Meal</th>
                <th className="px-4 py-3 text-left font-semibold text-[#2A2328] hidden lg:table-cell">Table</th>
                <th className="px-4 py-3"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE8E0]">
              {filtered.map(g => {
                const tableLabel = g.table_id ? tables.find(t => t.id === g.table_id)?.name ?? "?" : "—";
                return (
                  <tr key={g.id}
                    draggable
                    onDragStart={e => { e.dataTransfer.setData("guestId", g.id); e.dataTransfer.effectAllowed = "move"; }}
                    className="hover:bg-[#FDFBF8] cursor-pointer group"
                    onClick={() => toggleSelect(g.id)}
                  >
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(g.id)}
                        onChange={() => toggleSelect(g.id)}
                        className="rounded border-[#DDD7D0] accent-[#C9956E]"/>
                    </td>
                    <td className="px-4 py-3 font-medium text-[#2A2328]">{g.first_name} {g.last_name}</td>
                    <td className="px-4 py-3 text-[#6B6068] hidden md:table-cell">{g.email || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs border capitalize font-medium ${RSVP_COLOR[g.rsvp || "pending"]}`}>
                        {g.rsvp || "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#6B6068] hidden sm:table-cell">
                      {MEAL_ICON[g.meal || "standard"]} {g.meal || "standard"}
                    </td>
                    <td className="px-4 py-3 text-[#6B6068] hidden lg:table-cell">{tableLabel}</td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEdit(g)}
                        className="opacity-0 group-hover:opacity-100 text-xs text-[#C9956E] hover:underline mr-2 transition-opacity">Edit</button>
                      <button onClick={() => { if (confirm(`Remove ${g.first_name}?`)) onDeleteGuest(g.id); }}
                        className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-600 transition-opacity">✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#EDE8E0] p-6 w-full max-w-md shadow-xl">
            <h3 className="font-playfair text-lg font-bold text-[#2A2328] mb-5">{editGuest ? "Edit Guest" : "Add Guest"}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#2A2328] mb-1">First name *</label>
                  <input type="text" value={form.first_name || ""} onChange={e => setForm(p => ({...p, first_name: e.target.value}))}
                    className="w-full px-3 py-2 border border-[#DDD7D0] rounded-lg text-sm focus:outline-none focus:border-[#C9956E]"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#2A2328] mb-1">Last name</label>
                  <input type="text" value={form.last_name || ""} onChange={e => setForm(p => ({...p, last_name: e.target.value}))}
                    className="w-full px-3 py-2 border border-[#DDD7D0] rounded-lg text-sm focus:outline-none focus:border-[#C9956E]"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#2A2328] mb-1">Email (for RSVP)</label>
                <input type="email" value={form.email || ""} onChange={e => setForm(p => ({...p, email: e.target.value}))}
                  className="w-full px-3 py-2 border border-[#DDD7D0] rounded-lg text-sm focus:outline-none focus:border-[#C9956E]"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#2A2328] mb-1">RSVP status</label>
                  <select value={form.rsvp || "pending"} onChange={e => setForm(p => ({...p, rsvp: e.target.value as any}))}
                    className="w-full px-3 py-2 border border-[#DDD7D0] rounded-lg text-sm focus:outline-none focus:border-[#C9956E]">
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#2A2328] mb-1">Meal preference</label>
                  <select value={form.meal || "standard"} onChange={e => setForm(p => ({...p, meal: e.target.value as any}))}
                    className="w-full px-3 py-2 border border-[#DDD7D0] rounded-lg text-sm focus:outline-none focus:border-[#C9956E]">
                    {MEALS.map(m => <option key={m} value={m}>{MEAL_ICON[m]} {m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#2A2328] mb-1">Party / group</label>
                <select value={form.group_id || ""} onChange={e => setForm(p => ({...p, group_id: e.target.value || undefined}))}
                  className="w-full px-3 py-2 border border-[#DDD7D0] rounded-lg text-sm focus:outline-none focus:border-[#C9956E]">
                  <option value="">No group</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#2A2328] mb-1">Allergies / notes</label>
                <input type="text" value={form.allergies || ""} onChange={e => setForm(p => ({...p, allergies: e.target.value}))}
                  className="w-full px-3 py-2 border border-[#DDD7D0] rounded-lg text-sm focus:outline-none focus:border-[#C9956E]"
                  placeholder="Nuts, dairy, etc."/>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)}
                className="flex-1 py-2.5 border border-[#DDD7D0] rounded-xl text-sm text-[#6B6068] hover:border-[#C9956E]">
                Cancel
              </button>
              <button onClick={handleSave}
                className="flex-1 py-2.5 bg-[#C9956E] text-white rounded-xl text-sm font-semibold hover:bg-[#B8845D]">
                {editGuest ? "Save Changes" : "Add Guest"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
