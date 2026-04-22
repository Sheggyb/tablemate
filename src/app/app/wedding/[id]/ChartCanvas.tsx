"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { Table, Guest, Group, Rule } from "@/lib/types";

interface Props {
  tables:        Table[];
  guests:        Guest[];
  groups:        Group[];
  rules:         Rule[];
  darkMode:      boolean;
  onAddTable:    (name: string, shape: "round" | "rectangle" | "oval", capacity: number) => void;
  onUpdateTable: (id: string, data: Partial<Table>) => void;
  onDeleteTable: (id: string) => void;
  onSeatGuest:   (guestId: string, tableId: string | null, seatIndex: number | null) => void;
  onAutoSeat:    () => void;
}

const GROUP_COLORS = ["#c9a96e","#7B9E87","#8B7BA8","#C97B6E","#6E9EC9","#B8A86E","#e8b4cb","#9EC9A6"];

const MEAL_COLORS: Record<string, string> = {
  standard: "#c9a96e",
  vegetarian: "#4caf7d",
  vegan: "#2e7d52",
  "gluten-free": "#f0a858",
  halal: "#6E9EC9",
  kosher: "#8B7BA8",
  children: "#e8b4cb",
};

const MEAL_ICON: Record<string, string> = {
  standard: "🍽", vegetarian: "🌿", vegan: "🌱",
  "gluten-free": "🌾", halal: "☪", kosher: "✡", children: "🧒",
};

const PRESET_TABLES: { label: string; shape: "round" | "rectangle" | "oval"; capacity: number }[] = [
  { label: "Round 6",      shape: "round",     capacity: 6  },
  { label: "Round 8",      shape: "round",     capacity: 8  },
  { label: "Round 10",     shape: "round",     capacity: 10 },
  { label: "Round 12",     shape: "round",     capacity: 12 },
  { label: "Square 4",     shape: "rectangle", capacity: 4  },
  { label: "Banquet 10",   shape: "oval",      capacity: 10 },
  { label: "Banquet 12",   shape: "oval",      capacity: 12 },
];

export default function ChartCanvas({
  tables, guests, groups, rules, darkMode,
  onAddTable, onUpdateTable, onDeleteTable, onSeatGuest, onAutoSeat
}: Props) {
  const canvasRef   = useRef<HTMLDivElement>(null);
  const [offset, setOffset]     = useState({ x: 40, y: 40 });
  const [scale, setScale]       = useState(1);
  const [panning, setPanning]   = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(true);
  const [customShape, setCustomShape] = useState<"round"|"rectangle"|"oval">("round");
  const [customCap, setCustomCap] = useState(8);
  const [customName, setCustomName] = useState("");
  const [guestSearch, setGuestSearch] = useState("");
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // Surface & border colors from CSS vars (react to darkMode)
  const cs = {
    bg:         "var(--canvas-bg)",
    surface:    "var(--surface)",
    surface2:   "var(--surface2)",
    border:     "var(--border)",
    borderSoft: "var(--border-soft)",
    text:       "var(--text)",
    textMid:    "var(--text-mid)",
    textSoft:   "var(--text-soft)",
    textMuted:  "var(--text-muted)",
    accent:     "var(--accent)",
    accentBg:   "var(--accent-bg)",
    grid:       "var(--canvas-grid)",
  };

  const tableGuests = useCallback((tableId: string) =>
    guests.filter(g => g.table_id === tableId), [guests]);

  const unseatedGuests = guests.filter(g => !g.table_id && g.rsvp !== "declined");

  const filteredUnseated = unseatedGuests.filter(g => {
    if (!guestSearch) return true;
    const name = `${g.first_name} ${g.last_name}`.toLowerCase();
    return name.includes(guestSearch.toLowerCase());
  });

  const groupColor = (groupId?: string | null) => {
    if (!groupId) return "var(--text-muted)";
    const idx = groups.findIndex(g => g.id === groupId) % GROUP_COLORS.length;
    return GROUP_COLORS[idx < 0 ? 0 : idx];
  };

  /* ── Pan canvas ── */
  const onPointerDownCanvas = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-table]")) return;
    setPanning(true);
    setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMoveCanvas = (e: React.PointerEvent) => {
    if (panning) setOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    if (dragging) {
      const x = (e.clientX - offset.x) / scale - dragging.ox;
      const y = (e.clientY - offset.y) / scale - dragging.oy;
      onUpdateTable(dragging.id, { x, y });
    }
  };
  const onPointerUpCanvas = () => { setPanning(false); setDragging(null); };

  /* ── Wheel zoom ── */
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(s => Math.min(3, Math.max(0.2, s * delta)));
  }, []);
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  /* ── Table drag ── */
  const onTablePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    setSelected(id);
    const t = tables.find(t => t.id === id)!;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragging({
      id,
      ox: (e.clientX - offset.x) / scale - t.x,
      oy: (e.clientY - offset.y) / scale - t.y,
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  /* ── Guest drag-and-drop onto table ── */
  const onGuestDragOver = (e: React.DragEvent, tableId: string) => {
    e.preventDefault();
    const t = tables.find(t => t.id === tableId)!;
    const seated = guests.filter(g => g.table_id === tableId).length;
    if (seated < t.capacity) setDropTarget(tableId);
  };
  const onGuestDrop = (e: React.DragEvent, tableId: string) => {
    e.preventDefault();
    const guestId = e.dataTransfer.getData("guestId");
    if (!guestId) return;
    const t = tables.find(t => t.id === tableId)!;
    const seated = guests.filter(g => g.table_id === tableId);
    if (seated.length >= t.capacity) return;
    const used = new Set(seated.map(g => g.seat_index).filter(s => s != null));
    let si = 0; while (used.has(si)) si++;
    onSeatGuest(guestId, tableId, si);
    setDropTarget(null);
  };

  const fitView = () => {
    if (!tables.length) { setOffset({ x: 40, y: 40 }); setScale(1); return; }
    const xs = tables.map(t => t.x);
    const ys = tables.map(t => t.y);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    const maxX = Math.max(...xs) + 160, maxY = Math.max(...ys) + 120;
    const W = canvasRef.current?.clientWidth ?? 800;
    const H = canvasRef.current?.clientHeight ?? 600;
    const s = Math.min(0.95 * W / (maxX - minX + 80), 0.95 * H / (maxY - minY + 80), 2);
    setScale(s);
    setOffset({ x: (W - (maxX - minX + 80) * s) / 2 - minX * s + 40 * s, y: (H - (maxY - minY + 80) * s) / 2 - minY * s + 40 * s });
  };

  const addPreset = (p: typeof PRESET_TABLES[number]) => {
    const n = tables.filter(t => t.shape === p.shape && t.capacity === p.capacity).length;
    const name = customName.trim() || `${p.label} ${n + 1}`;
    onAddTable(name, p.shape, p.capacity);
    setCustomName("");
  };

  const addCustomTable = () => {
    const name = customName.trim() || `Table ${tables.length + 1}`;
    onAddTable(name, customShape, customCap);
    setCustomName("");
  };

  // Table size
  const tableSize = (t: Table) => {
    if (t.shape === "round")     return { w: 100 + Math.min(t.capacity, 12) * 4, h: 100 + Math.min(t.capacity, 12) * 4 };
    if (t.shape === "rectangle") return { w: 80 + t.capacity * 10, h: 70 };
    return { w: 140 + t.capacity * 5, h: 80 };
  };

  const seated = tables.reduce((sum, t) => sum + tableGuests(t.id).length, 0);
  const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);

  return (
    <div className="flex h-full overflow-hidden" style={{ background: cs.bg }}>

      {/* ── LEFT SIDEBAR ── */}
      <div className="w-64 flex-shrink-0 flex flex-col border-r overflow-y-auto"
        style={{ background: cs.surface, borderColor: cs.border }}>

        {/* Add Table header */}
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: cs.textMuted }}>Add Table</h3>
          {/* Presets */}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {PRESET_TABLES.map(p => (
              <button key={p.label} onClick={() => addPreset(p)}
                className="px-2 py-1.5 rounded-lg text-xs font-medium text-left hover:opacity-80 transition-opacity"
                style={{ background: cs.surface2, color: cs.textSoft, border: `1px solid ${cs.border}` }}>
                {p.shape === "round" ? "⭕" : p.shape === "rectangle" ? "⬜" : "🔲"} {p.label}
              </button>
            ))}
          </div>
          {/* Custom */}
          <div className="space-y-2 p-3 rounded-xl mb-2" style={{ background: cs.surface2, border: `1px solid ${cs.border}` }}>
            <div className="text-xs font-medium mb-1" style={{ color: cs.textMuted }}>+ Custom Table</div>
            <input type="text" value={customName} onChange={e => setCustomName(e.target.value)}
              placeholder="Name (optional)" className="w-full px-2 py-1.5 rounded-lg text-xs border"
              style={{ background: cs.surface, borderColor: cs.borderSoft, color: cs.text }}/>
            <select value={customShape} onChange={e => setCustomShape(e.target.value as any)}
              className="w-full px-2 py-1.5 rounded-lg text-xs border"
              style={{ background: cs.surface, borderColor: cs.borderSoft, color: cs.text }}>
              <option value="round">Round</option>
              <option value="rectangle">Rectangle</option>
              <option value="oval">Oval / Banquet</option>
            </select>
            <div className="flex items-center gap-2">
              <label className="text-xs" style={{ color: cs.textMuted }}>Seats:</label>
              <input type="number" min={2} max={30} value={customCap}
                onChange={e => setCustomCap(+e.target.value)}
                className="w-16 px-2 py-1.5 rounded-lg text-xs border"
                style={{ background: cs.surface, borderColor: cs.borderSoft, color: cs.text }}/>
            </div>
            <button onClick={addCustomTable}
              className="w-full py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ background: cs.accent }}>+ Add Table</button>
          </div>
        </div>

        {/* Unassigned Guests */}
        <div className="px-4 py-2 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: cs.textMuted }}>
              Unassigned ({unseatedGuests.length})
            </h3>
          </div>
          <input type="search" value={guestSearch} onChange={e => setGuestSearch(e.target.value)}
            placeholder="Search guests…" className="w-full px-2 py-1.5 rounded-lg text-xs border mb-2"
            style={{ background: cs.surface2, borderColor: cs.borderSoft, color: cs.text }}/>
          <div className="flex-1 overflow-y-auto space-y-0.5">
            {filteredUnseated.length === 0 && (
              <p className="text-xs text-center py-4" style={{ color: cs.textMuted }}>
                {unseatedGuests.length === 0 ? "🎉 All guests seated!" : "No matches"}
              </p>
            )}
            {filteredUnseated.map(g => (
              <div key={g.id}
                draggable
                onDragStart={e => { e.dataTransfer.setData("guestId", g.id); e.dataTransfer.effectAllowed = "move"; }}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing hover:opacity-80"
                style={{ background: cs.surface2 }}
                title={`${g.meal || "standard"} meal`}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: groupColor(g.group_id) }}/>
                <span className="text-xs flex-1 truncate" style={{ color: cs.text }}>{g.first_name} {g.last_name}</span>
                <span className="text-xs" title={g.meal || "standard"}>{MEAL_ICON[g.meal || "standard"]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Meal Key */}
        <div className="px-4 py-3 border-t" style={{ borderColor: cs.border }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: cs.textMuted }}>Meal Key</div>
          <div className="space-y-1">
            {Object.entries(MEAL_ICON).map(([meal, icon]) => (
              <div key={meal} className="flex items-center gap-1.5 text-xs" style={{ color: cs.textSoft }}>
                <span>{icon}</span>
                <div className="w-2 h-2 rounded-full" style={{ background: MEAL_COLORS[meal] }}/>
                <span className="capitalize">{meal}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CENTER CANVAS ── */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Canvas toolbar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b flex-shrink-0 flex-wrap"
          style={{ background: cs.surface, borderColor: cs.border }}>
          <div className="flex items-center gap-4 text-xs" style={{ color: cs.textMuted }}>
            <span>{tables.length} tables</span>
            <span style={{ color: "var(--success)" }}>{seated} seated</span>
            <span style={{ color: unseatedGuests.length > 0 ? "var(--warning)" : "var(--success)" }}>
              {unseatedGuests.length} unseated
            </span>
            <span style={{ color: cs.textMuted }}>capacity {totalCapacity}</span>
          </div>
          <div className="flex-1"/>
          <button onClick={onAutoSeat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: cs.accentBg, border: `1px solid var(--accent)`, color: "var(--accent)" }}>
            ✨ Auto-Seat
          </button>
          <div className="flex items-center gap-1 rounded-lg overflow-hidden" style={{ border: `1px solid ${cs.border}` }}>
            <button onClick={() => setScale(s => Math.max(0.2, s - 0.1))}
              className="px-2.5 py-1.5 text-xs hover:opacity-70" style={{ background: cs.surface2, color: cs.textSoft }}>−</button>
            <button onClick={() => setScale(1)}
              className="px-2.5 py-1.5 text-xs font-mono" style={{ background: cs.surface, color: cs.textSoft }}>
              {Math.round(scale * 100)}%
            </button>
            <button onClick={() => setScale(s => Math.min(3, s + 0.1))}
              className="px-2.5 py-1.5 text-xs hover:opacity-70" style={{ background: cs.surface2, color: cs.textSoft }}>+</button>
          </div>
          <button onClick={fitView}
            className="px-2.5 py-1.5 rounded-lg text-xs hover:opacity-70"
            style={{ background: cs.surface2, color: cs.textSoft, border: `1px solid ${cs.border}` }}>
            ⊡ Fit
          </button>
          <button onClick={() => { setScale(1); setOffset({ x: 40, y: 40 }); }}
            className="px-2.5 py-1.5 rounded-lg text-xs hover:opacity-70"
            style={{ background: cs.surface2, color: cs.textSoft, border: `1px solid ${cs.border}` }}>
            Reset
          </button>
        </div>

        {/* Canvas area */}
        <div
          ref={canvasRef}
          className="flex-1 overflow-hidden relative select-none"
          style={{ background: cs.bg, cursor: panning ? "grabbing" : "grab" }}
          onPointerDown={onPointerDownCanvas}
          onPointerMove={onPointerMoveCanvas}
          onPointerUp={onPointerUpCanvas}
          onPointerLeave={onPointerUpCanvas}
          onDragOver={e => e.preventDefault()}
        >
          {/* Grid SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="chart-grid" width={40 * scale} height={40 * scale} patternUnits="userSpaceOnUse"
                patternTransform={`translate(${offset.x % (40 * scale)},${offset.y % (40 * scale)})`}>
                <path d={`M ${40 * scale} 0 L 0 0 0 ${40 * scale}`} fill="none" stroke={cs.grid} strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#chart-grid)"/>
          </svg>

          {/* Tables layer */}
          <div style={{ transform: `translate(${offset.x}px,${offset.y}px) scale(${scale})`, transformOrigin: "0 0", position: "absolute", top: 0, left: 0 }}>
            {tables.map(table => {
              const seated  = tableGuests(table.id);
              const isFull  = seated.length >= table.capacity;
              const isDrop  = dropTarget === table.id;
              const isSel   = selected === table.id;
              const { w, h } = tableSize(table);
              const isRound = table.shape === "round";
              const isOval  = table.shape === "oval";
              const br = isRound || isOval ? "50%" : "14px";

              const tableBg = isDrop
                ? "var(--accent-bg)"
                : darkMode ? "var(--surface2)" : "var(--surface)";
              const tableBorder = isSel
                ? "var(--accent)"
                : isDrop ? "var(--accent)" : "var(--border-soft)";
              const shadow = isSel
                ? "0 4px 24px rgba(201,169,110,0.25)"
                : "0 2px 10px rgba(0,0,0,0.12)";

              return (
                <div
                  key={table.id}
                  data-table={table.id}
                  style={{
                    position: "absolute",
                    left: table.x,
                    top: table.y,
                    width: w,
                    height: h,
                    borderRadius: br,
                    background: tableBg,
                    border: `2px solid ${tableBorder}`,
                    boxShadow: shadow,
                    cursor: dragging?.id === table.id ? "grabbing" : "grab",
                    userSelect: "none",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: isSel ? 10 : 1,
                    transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
                  }}
                  onPointerDown={e => onTablePointerDown(e, table.id)}
                  onDragOver={e => onGuestDragOver(e, table.id)}
                  onDrop={e => onGuestDrop(e, table.id)}
                  onDragLeave={() => setDropTarget(null)}
                >
                  {/* Table name */}
                  {editingTableId === table.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onBlur={() => { onUpdateTable(table.id, { name: editName }); setEditingTableId(null); }}
                      onKeyDown={e => { if (e.key === "Enter") { onUpdateTable(table.id, { name: editName }); setEditingTableId(null); } }}
                      onPointerDown={e => e.stopPropagation()}
                      className="text-xs font-semibold text-center border-b w-4/5 bg-transparent outline-none"
                      style={{ color: "var(--text)", borderColor: "var(--accent)" }}
                    />
                  ) : (
                    <div
                      className="font-semibold text-xs truncate px-3 max-w-full text-center"
                      style={{ color: "var(--text)" }}
                      onDoubleClick={e => { e.stopPropagation(); setEditingTableId(table.id); setEditName(table.name); }}
                    >{table.name}</div>
                  )}

                  <div className="text-xs mt-0.5" style={{ color: isFull ? "var(--warning)" : "var(--text-muted)" }}>
                    {seated.length}/{table.capacity}
                  </div>

                  {/* Guest dots */}
                  <div className="flex flex-wrap justify-center gap-0.5 px-3 mt-1 max-h-8 overflow-hidden">
                    {seated.slice(0, 12).map(g => (
                      <div key={g.id}
                        title={`${g.first_name} ${g.last_name} — ${g.meal || "standard"}`}
                        style={{ background: MEAL_COLORS[g.meal || "standard"] ?? groupColor(g.group_id), width: 9, height: 9, borderRadius: "50%", flexShrink: 0 }}/>
                    ))}
                    {seated.length > 12 && <span style={{ fontSize: 9, color: "var(--text-muted)" }}>+{seated.length - 12}</span>}
                  </div>

                  {/* Delete button */}
                  {isSel && (
                    <button
                      className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full text-xs flex items-center justify-center z-20 font-bold"
                      style={{ background: "var(--danger)", color: "white" }}
                      onPointerDown={e => e.stopPropagation()}
                      onClick={e => {
                        e.stopPropagation();
                        if (confirm(`Delete "${table.name}"?`)) { onDeleteTable(table.id); setSelected(null); }
                      }}>×</button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {tables.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <div className="text-5xl mb-4 opacity-30">🪑</div>
              <p className="text-sm opacity-50" style={{ color: "var(--text-muted)" }}>No tables yet. Add a table from the left panel.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL — Table Details ── */}
      {selected && (() => {
        const table  = tables.find(t => t.id === selected);
        if (!table) return null;
        const tg     = tableGuests(table.id);
        const vacant = table.capacity - tg.length;
        return (
          <div className="w-64 flex-shrink-0 flex flex-col border-l animate-slide-in"
            style={{ background: cs.surface, borderColor: cs.border }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: cs.border }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-sm" style={{ color: cs.text }}>{table.name}</h3>
                  <p className="text-xs mt-0.5" style={{ color: cs.textMuted }}>
                    {tg.length}/{table.capacity} seated · {vacant} vacant
                  </p>
                </div>
                <button onClick={() => setSelected(null)} className="text-xl leading-none hover:opacity-60" style={{ color: cs.textMuted }}>×</button>
              </div>
            </div>

            {/* Rename */}
            <div className="px-4 py-2 border-b" style={{ borderColor: cs.border }}>
              <input type="text" defaultValue={table.name}
                onBlur={e => onUpdateTable(table.id, { name: e.target.value })}
                onKeyDown={e => { if (e.key === "Enter") onUpdateTable(table.id, { name: (e.target as HTMLInputElement).value }); }}
                className="w-full px-2 py-1.5 rounded-lg text-xs border"
                style={{ background: cs.surface2, borderColor: cs.borderSoft, color: cs.text }}
                placeholder="Table name"/>
            </div>

            {/* Seated guests list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
              {tg.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-xs" style={{ color: cs.textMuted }}>Drag guests here to seat them</p>
                </div>
              )}
              {tg.map(g => (
                <div key={g.id} className="flex items-center gap-2 p-2 rounded-lg group"
                  style={{ background: "transparent" }}
                  onMouseEnter={e => (e.currentTarget.style.background = cs.surface2)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: groupColor(g.group_id) }}/>
                  <span className="text-xs flex-1 truncate" style={{ color: cs.text }}>{g.first_name} {g.last_name}</span>
                  <span className="text-xs" title={g.meal || "standard"}>{MEAL_ICON[g.meal || "standard"]}</span>
                  <button
                    onClick={() => onSeatGuest(g.id, null, null)}
                    className="opacity-0 group-hover:opacity-100 text-xs hover:opacity-70 transition-opacity"
                    style={{ color: "var(--danger)" }}>✕</button>
                </div>
              ))}
            </div>

            {/* Drop zone for guests */}
            <div
              className="mx-3 mb-3 p-3 rounded-xl border-2 border-dashed text-center text-xs"
              style={{ borderColor: cs.border, color: cs.textMuted }}
              onDragOver={e => onGuestDragOver(e, table.id)}
              onDrop={e => onGuestDrop(e, table.id)}
              onDragLeave={() => setDropTarget(null)}
            >
              {dropTarget === table.id ? "Drop to seat" : "Drag a guest here"}
            </div>

            <div className="px-3 pb-3">
              <button onClick={() => {
                if (confirm(`Remove all guests from "${table.name}"?`)) {
                  tg.forEach(g => onSeatGuest(g.id, null, null));
                }
              }} className="w-full py-2 rounded-xl text-xs font-medium hover:opacity-80"
                style={{ border: `1px solid var(--danger)`, color: "var(--danger)" }}>
                Clear table
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
