
"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
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
  standard: "#c9a96e", vegetarian: "#4caf7d", vegan: "#2e7d52",
  "gluten-free": "#f0a858", halal: "#6E9EC9", kosher: "#8B7BA8", children: "#e8b4cb",
};
const MEAL_ICON: Record<string, string> = {
  standard: "🍽", vegetarian: "🌿", vegan: "🌱",
  "gluten-free": "🌾", halal: "☪", kosher: "✡", children: "🧒",
};

const PRESET_TABLES: { label: string; shape: "round" | "rectangle" | "oval"; capacity: number }[] = [
  { label: "Round 6",    shape: "round",     capacity: 6  },
  { label: "Round 8",    shape: "round",     capacity: 8  },
  { label: "Round 10",   shape: "round",     capacity: 10 },
  { label: "Round 12",   shape: "round",     capacity: 12 },
  { label: "Square 4",   shape: "rectangle", capacity: 4  },
  { label: "Banquet 10", shape: "oval",      capacity: 10 },
  { label: "Banquet 12", shape: "oval",      capacity: 12 },
];

const SNAP_GRID = 20;

type SideTab = "add" | "custom" | "guests";

interface ContextMenu { x: number; y: number; tableId: string; }

function snapToGrid(v: number): number {
  return Math.round(v / SNAP_GRID) * SNAP_GRID;
}

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
  const [sideTab, setSideTab]   = useState<SideTab>("add");
  const [customShape, setCustomShape] = useState<"round"|"rectangle"|"oval">("round");
  const [customCap, setCustomCap] = useState(8);
  const [customName, setCustomName] = useState("");
  const [guestSearch, setGuestSearch] = useState("");
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [ctxMenu, setCtxMenu]   = useState<ContextMenu | null>(null);
  // New features
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [findQuery, setFindQuery]     = useState("");

  const cs = {
    bg: "var(--canvas-bg)", surface: "var(--surface)", surface2: "var(--surface2)",
    border: "var(--border)", borderSoft: "var(--border-soft)", text: "var(--text)",
    textMid: "var(--text-mid)", textSoft: "var(--text-soft)", textMuted: "var(--text-muted)",
    accent: "var(--accent)", accentBg: "var(--accent-bg)", grid: "var(--canvas-grid)",
  };

  // ── Memoised derivations ──
  const tableGuests = useCallback((tableId: string) =>
    guests.filter(g => g.table_id === tableId), [guests]);

  const unseatedGuests = useMemo(
    () => guests.filter(g => !g.table_id && g.rsvp !== "declined"),
    [guests]
  );

  const filteredUnseated = useMemo(() => {
    if (!guestSearch) return unseatedGuests;
    const q = guestSearch.toLowerCase();
    return unseatedGuests.filter(g =>
      `${g.first_name} ${g.last_name}`.toLowerCase().includes(q)
    );
  }, [unseatedGuests, guestSearch]);

  const { seated, totalCapacity } = useMemo(() => ({
    seated:        tables.reduce((s, t) => s + tableGuests(t.id).length, 0),
    totalCapacity: tables.reduce((s, t) => s + t.capacity, 0),
  }), [tables, tableGuests]);

  const ctxTable = useMemo(
    () => ctxMenu ? tables.find(t => t.id === ctxMenu.tableId) ?? null : null,
    [ctxMenu, tables]
  );

  const groupColor = useCallback((groupId?: string | null) => {
    if (!groupId) return "var(--text-muted)";
    const idx = groups.findIndex(g => g.id === groupId) % GROUP_COLORS.length;
    return GROUP_COLORS[idx < 0 ? 0 : idx];
  }, [groups]);

  const tableSize = useCallback((t: Table) => {
    if (t.shape === "round")     return { w: 100 + Math.min(t.capacity, 12) * 4, h: 100 + Math.min(t.capacity, 12) * 4 };
    if (t.shape === "rectangle") return { w: 80 + t.capacity * 10, h: 70 };
    return { w: 140 + t.capacity * 5, h: 80 };
  }, []);

  // ── Find Guest: resolve which table is highlighted ──
  const highlightedTableId = useMemo(() => {
    if (!findQuery.trim()) return null;
    const q = findQuery.toLowerCase();
    const match = guests.find(g =>
      g.table_id && `${g.first_name} ${g.last_name}`.toLowerCase().includes(q)
    );
    return match?.table_id ?? null;
  }, [findQuery, guests]);

  // Close context menu on outside click
  useEffect(() => {
    const close = () => setCtxMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  // ── Keyboard navigation for selected table ──
  useEffect(() => {
    if (!selected) return;
    const step = snapEnabled ? SNAP_GRID : 10;
    const onKeyDown = (e: KeyboardEvent) => {
      const dirs: Record<string, { dx: number; dy: number }> = {
        ArrowLeft:  { dx: -step, dy: 0 },
        ArrowRight: { dx:  step, dy: 0 },
        ArrowUp:    { dx: 0, dy: -step },
        ArrowDown:  { dx: 0, dy:  step },
      };
      if (!dirs[e.key]) return;
      // Don't hijack if user is typing in an input
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      e.preventDefault();
      const t = tables.find(t => t.id === selected);
      if (!t) return;
      let nx = t.x + dirs[e.key].dx;
      let ny = t.y + dirs[e.key].dy;
      if (snapEnabled) { nx = snapToGrid(nx); ny = snapToGrid(ny); }
      onUpdateTable(selected, { x: nx, y: ny });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, tables, snapEnabled, onUpdateTable]);

  /* ── Pan canvas ── */
  const onPointerDownCanvas = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-table]")) return;
    setCtxMenu(null);
    setPanning(true);
    setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [offset]);

  const onPointerMoveCanvas = useCallback((e: React.PointerEvent) => {
    if (panning) setOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    if (dragging) {
      let x = (e.clientX - offset.x) / scale - dragging.ox;
      let y = (e.clientY - offset.y) / scale - dragging.oy;
      if (snapEnabled) { x = snapToGrid(x); y = snapToGrid(y); }
      onUpdateTable(dragging.id, { x, y });
    }
  }, [panning, panStart, dragging, offset, scale, snapEnabled, onUpdateTable]);

  const onPointerUpCanvas = useCallback(() => { setPanning(false); setDragging(null); }, []);

  /* ── Wheel zoom ── */
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setScale(s => Math.min(3, Math.max(0.2, s * (e.deltaY > 0 ? 0.9 : 1.1))));
  }, []);
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  /* ── Table drag ── */
  const onTablePointerDown = useCallback((e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    setSelected(id);
    const t = tables.find(t => t.id === id)!;
    setDragging({ id, ox: (e.clientX - offset.x) / scale - t.x, oy: (e.clientY - offset.y) / scale - t.y });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [tables, offset, scale]);

  /* ── Right-click context menu ── */
  const onTableContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected(id);
    setCtxMenu({ x: e.clientX, y: e.clientY, tableId: id });
  }, []);

  /* ── Guest drag-and-drop ── */
  const onGuestDragOver = useCallback((e: React.DragEvent, tableId: string) => {
    e.preventDefault();
    const t = tables.find(t => t.id === tableId)!;
    if (guests.filter(g => g.table_id === tableId).length < t.capacity) setDropTarget(tableId);
  }, [tables, guests]);

  const onGuestDrop = useCallback((e: React.DragEvent, tableId: string) => {
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
  }, [tables, guests, onSeatGuest]);

  /* ── Zoom to fit ── */
  const fitView = useCallback(() => {
    if (!tables.length) { setOffset({ x: 40, y: 40 }); setScale(1); return; }
    const xs = tables.map(t => t.x), ys = tables.map(t => t.y);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    const maxX = Math.max(...xs) + 160, maxY = Math.max(...ys) + 120;
    const W = canvasRef.current?.clientWidth ?? 800, H = canvasRef.current?.clientHeight ?? 600;
    const s = Math.min(0.95 * W / (maxX - minX + 80), 0.95 * H / (maxY - minY + 80), 2);
    setScale(s);
    setOffset({ x: (W - (maxX - minX + 80) * s) / 2 - minX * s + 40 * s, y: (H - (maxY - minY + 80) * s) / 2 - minY * s + 40 * s });
  }, [tables]);

  const addPreset = useCallback((p: typeof PRESET_TABLES[number]) => {
    const n = tables.filter(t => t.shape === p.shape && t.capacity === p.capacity).length;
    onAddTable(customName.trim() || `${p.label} ${n + 1}`, p.shape, p.capacity);
    setCustomName("");
  }, [tables, customName, onAddTable]);

  const addCustomTable = useCallback(() => {
    onAddTable(customName.trim() || `Table ${tables.length + 1}`, customShape, customCap);
    setCustomName("");
  }, [customName, tables, customShape, customCap, onAddTable]);

  return (
    <>
      {/* Pulse animation for find-guest highlight */}
      <style>{`
        @keyframes tablePulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(201,169,110,0.7), 0 4px 24px rgba(201,169,110,0.3); }
          50%      { box-shadow: 0 0 0 8px rgba(201,169,110,0), 0 4px 32px rgba(201,169,110,0.5); }
        }
        .table-highlight-pulse {
          animation: tablePulse 1.2s ease-in-out infinite;
          border-color: #c9a96e !important;
        }
      `}</style>

      <div className="flex h-full overflow-hidden" style={{ background: cs.bg }}>

        {/* ── LEFT SIDEBAR ── */}
        <div className="w-64 flex-shrink-0 flex flex-col border-r" style={{ background: cs.surface, borderColor: cs.border }}>

          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: cs.border }}>
            {([["add","Add"], ["custom","Custom"], ["guests","Guests"]] as [SideTab, string][]).map(([tab, label]) => (
              <button key={tab} onClick={() => setSideTab(tab)}
                className="flex-1 py-2.5 text-xs font-semibold transition-colors"
                style={{
                  color: sideTab === tab ? cs.accent : cs.textMuted,
                  borderBottom: sideTab === tab ? `2px solid ${cs.accent}` : "2px solid transparent",
                  background: "transparent",
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Tab: Add Tables */}
          {sideTab === "add" && (
            <div className="p-3 flex-1 overflow-y-auto">
              <p className="text-xs mb-3" style={{ color: cs.textMuted }}>Click a preset to add instantly:</p>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESET_TABLES.map(p => (
                  <button key={p.label} onClick={() => addPreset(p)}
                    className="px-2 py-2.5 rounded-xl text-xs font-medium text-left hover:opacity-80 transition-opacity"
                    style={{ background: cs.surface2, color: cs.textSoft, border: `1px solid ${cs.border}` }}>
                    {p.shape === "round" ? "⭕" : p.shape === "rectangle" ? "⬜" : "🔲"} {p.label}
                  </button>
                ))}
              </div>
              {/* Meal Key */}
              <div className="mt-4 pt-3 border-t" style={{ borderColor: cs.border }}>
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
          )}

          {/* Tab: Custom */}
          {sideTab === "custom" && (
            <div className="p-3 flex-1 overflow-y-auto">
              <p className="text-xs mb-3" style={{ color: cs.textMuted }}>Build a custom table:</p>
              <div className="space-y-2.5">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: cs.textMuted }}>Name</label>
                  <input type="text" value={customName} onChange={e => setCustomName(e.target.value)}
                    placeholder="e.g. Head Table" className="w-full px-2 py-1.5 rounded-lg text-xs border"
                    style={{ background: cs.surface2, borderColor: cs.borderSoft, color: cs.text }}/>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: cs.textMuted }}>Shape</label>
                  <select value={customShape} onChange={e => setCustomShape(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded-lg text-xs border"
                    style={{ background: cs.surface2, borderColor: cs.borderSoft, color: cs.text }}>
                    <option value="round">⭕ Round</option>
                    <option value="rectangle">⬜ Rectangle</option>
                    <option value="oval">🔲 Oval / Banquet</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: cs.textMuted }}>Seats: {customCap}</label>
                  <input type="range" min={2} max={30} value={customCap}
                    onChange={e => setCustomCap(+e.target.value)} className="w-full"/>
                </div>
                <button onClick={addCustomTable}
                  className="w-full py-2 rounded-xl text-xs font-semibold text-white mt-2"
                  style={{ background: cs.accent }}>
                  + Add Custom Table
                </button>
              </div>
            </div>
          )}

          {/* Tab: Guests (unseated) */}
          {sideTab === "guests" && (
            <div className="flex-1 overflow-hidden flex flex-col p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: cs.textMuted }}>
                  Unassigned ({unseatedGuests.length})
                </span>
              </div>
              <input type="search" value={guestSearch} onChange={e => setGuestSearch(e.target.value)}
                placeholder="Search…" className="w-full px-2 py-1.5 rounded-lg text-xs border mb-2"
                style={{ background: cs.surface2, borderColor: cs.borderSoft, color: cs.text }}/>
              <div className="flex-1 overflow-y-auto space-y-0.5">
                {filteredUnseated.length === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: cs.textMuted }}>
                    {unseatedGuests.length === 0 ? "🎉 All guests seated!" : "No matches"}
                  </p>
                )}
                {filteredUnseated.map(g => (
                  <div key={g.id} draggable
                    onDragStart={e => { e.dataTransfer.setData("guestId", g.id); e.dataTransfer.effectAllowed = "move"; }}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing hover:opacity-80"
                    style={{ background: cs.surface2 }}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: groupColor(g.group_id) }}/>
                    <span className="text-xs flex-1 truncate" style={{ color: cs.text }}>{g.first_name} {g.last_name}</span>
                    <span className="text-xs">{MEAL_ICON[g.meal || "standard"]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── CENTER CANVAS ── */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b flex-shrink-0 flex-wrap"
            style={{ background: cs.surface, borderColor: cs.border }}>
            <div className="flex items-center gap-4 text-xs" style={{ color: cs.textMuted }}>
              <span>{tables.length} tables</span>
              <span style={{ color: "var(--success)" }}>{seated} seated</span>
              <span style={{ color: unseatedGuests.length > 0 ? "var(--warning)" : "var(--success)" }}>
                {unseatedGuests.length} unseated
              </span>
              <span style={{ color: cs.textMuted }}>cap {totalCapacity}</span>
            </div>

            {/* Find Guest search */}
            <div className="relative flex items-center">
              <span className="absolute left-2 text-xs pointer-events-none" style={{ color: cs.textMuted }}>🔍</span>
              <input
                type="search"
                value={findQuery}
                onChange={e => setFindQuery(e.target.value)}
                placeholder="Find guest…"
                className="pl-6 pr-2 py-1.5 rounded-lg text-xs border"
                style={{ background: cs.surface2, borderColor: findQuery ? cs.accent : cs.borderSoft, color: cs.text, width: 130 }}
              />
              {highlightedTableId && (
                <span className="absolute -right-1 -top-1 w-2 h-2 rounded-full" style={{ background: cs.accent }}/>
              )}
            </div>

            <div className="flex-1"/>

            {/* Snap-to-grid toggle */}
            <button
              onClick={() => setSnapEnabled(s => !s)}
              title="Snap to grid"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs hover:opacity-80 transition-all"
              style={{
                background: snapEnabled ? cs.accentBg : cs.surface2,
                border: `1px solid ${snapEnabled ? cs.accent : cs.border}`,
                color: snapEnabled ? cs.accent : cs.textSoft,
              }}>
              ⊞ Snap
            </button>

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
            <button onClick={fitView} className="px-2.5 py-1.5 rounded-lg text-xs hover:opacity-70"
              style={{ background: cs.surface2, color: cs.textSoft, border: `1px solid ${cs.border}` }}>⊡ Fit</button>
            <button onClick={() => { setScale(1); setOffset({ x: 40, y: 40 }); }}
              className="px-2.5 py-1.5 rounded-lg text-xs hover:opacity-70"
              style={{ background: cs.surface2, color: cs.textSoft, border: `1px solid ${cs.border}` }}>Reset</button>
          </div>

          {/* Canvas */}
          <div ref={canvasRef}
            className="flex-1 overflow-hidden relative select-none"
            style={{ background: cs.bg, cursor: panning ? "grabbing" : "grab" }}
            onPointerDown={onPointerDownCanvas}
            onPointerMove={onPointerMoveCanvas}
            onPointerUp={onPointerUpCanvas}
            onPointerLeave={onPointerUpCanvas}
            onDragOver={e => e.preventDefault()}>

            {/* Grid */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <pattern id="chart-grid" width={40 * scale} height={40 * scale} patternUnits="userSpaceOnUse"
                  patternTransform={`translate(${offset.x % (40 * scale)},${offset.y % (40 * scale)})`}>
                  <path d={`M ${40 * scale} 0 L 0 0 0 ${40 * scale}`} fill="none" stroke={cs.grid} strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#chart-grid)"/>
            </svg>

            {/* Tables */}
            <div style={{ transform: `translate(${offset.x}px,${offset.y}px) scale(${scale})`, transformOrigin: "0 0", position: "absolute", top: 0, left: 0 }}>
              {tables.map((table, tableIndex) => {
                const tg = tableGuests(table.id);
                const isFull    = tg.length >= table.capacity;
                const isDrop    = dropTarget === table.id;
                const isSel     = selected === table.id;
                const isHighlit = highlightedTableId === table.id;
                const { w, h }  = tableSize(table);
                const isRound = table.shape === "round", isOval = table.shape === "oval";
                const br = isRound || isOval ? "50%" : "14px";

                return (
                  <div key={table.id}
                    style={{ position: "absolute", left: table.x, top: table.y }}>

                    {/* Table number label above table */}
                    <div style={{
                      position: "absolute",
                      top: -22,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: isSel ? cs.accent : cs.surface,
                      color: isSel ? "#fff" : cs.textMuted,
                      border: `1px solid ${isSel ? cs.accent : cs.border}`,
                      borderRadius: 99,
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "1px 7px",
                      whiteSpace: "nowrap",
                      pointerEvents: "none",
                      zIndex: 20,
                      letterSpacing: "0.03em",
                    }}>
                      #{tableIndex + 1}
                    </div>

                    <div data-table={table.id}
                      className={isHighlit ? "table-highlight-pulse" : ""}
                      style={{
                        width: w, height: h,
                        borderRadius: br,
                        background: isDrop ? "var(--accent-bg)" : darkMode ? "var(--surface2)" : "var(--surface)",
                        border: `2px solid ${isSel ? "var(--accent)" : isDrop ? "var(--accent)" : "var(--border-soft)"}`,
                        boxShadow: isSel ? "0 4px 24px rgba(201,169,110,0.25)" : "0 2px 10px rgba(0,0,0,0.12)",
                        cursor: dragging?.id === table.id ? "grabbing" : "grab",
                        userSelect: "none", display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        zIndex: isSel ? 10 : 1, transition: "border-color 0.15s, box-shadow 0.15s",
                        outline: isHighlit ? "2px solid #c9a96e" : "none",
                        outlineOffset: 2,
                      }}
                      onPointerDown={e => onTablePointerDown(e, table.id)}
                      onContextMenu={e => onTableContextMenu(e, table.id)}
                      onDragOver={e => onGuestDragOver(e, table.id)}
                      onDrop={e => onGuestDrop(e, table.id)}
                      onDragLeave={() => setDropTarget(null)}>

                      {editingTableId === table.id ? (
                        <input autoFocus value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onBlur={() => { onUpdateTable(table.id, { name: editName }); setEditingTableId(null); }}
                          onKeyDown={e => { if (e.key === "Enter") { onUpdateTable(table.id, { name: editName }); setEditingTableId(null); } }}
                          onPointerDown={e => e.stopPropagation()}
                          className="text-xs font-semibold text-center border-b w-4/5 bg-transparent outline-none"
                          style={{ color: "var(--text)", borderColor: "var(--accent)" }}/>
                      ) : (
                        <div className="font-semibold text-xs truncate px-3 max-w-full text-center"
                          style={{ color: "var(--text)" }}
                          onDoubleClick={e => { e.stopPropagation(); setEditingTableId(table.id); setEditName(table.name); }}>
                          {table.name}
                        </div>
                      )}

                      <div className="text-xs mt-0.5" style={{ color: isFull ? "var(--warning)" : "var(--text-muted)" }}>
                        {tg.length}/{table.capacity}
                      </div>

                      <div className="flex flex-wrap justify-center gap-0.5 px-3 mt-1 max-h-8 overflow-hidden">
                        {tg.slice(0, 12).map(g => (
                          <div key={g.id} title={`${g.first_name} ${g.last_name} — ${g.meal || "standard"}`}
                            style={{ background: MEAL_COLORS[g.meal || "standard"] ?? groupColor(g.group_id), width: 9, height: 9, borderRadius: "50%", flexShrink: 0 }}/>
                        ))}
                        {tg.length > 12 && <span style={{ fontSize: 9, color: "var(--text-muted)" }}>+{tg.length - 12}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty state */}
            {tables.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <div className="text-5xl mb-4 opacity-30">🪑</div>
                <p className="text-sm opacity-50" style={{ color: "var(--text-muted)" }}>No tables yet — pick a preset from the left panel.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL — Table Details ── */}
        {selected && (() => {
          const table = tables.find(t => t.id === selected);
          if (!table) return null;
          const tg = tableGuests(table.id);
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
                  <button onClick={() => setSelected(null)} className="text-xl leading-none hover:opacity-60"
                    style={{ color: cs.textMuted }}>×</button>
                </div>
              </div>

              <div className="px-4 py-2 border-b" style={{ borderColor: cs.border }}>
                <label className="text-xs mb-1 block" style={{ color: cs.textMuted }}>Rename</label>
                <input type="text" defaultValue={table.name}
                  onBlur={e => onUpdateTable(table.id, { name: e.target.value })}
                  onKeyDown={e => { if (e.key === "Enter") onUpdateTable(table.id, { name: (e.target as HTMLInputElement).value }); }}
                  className="w-full px-2 py-1.5 rounded-lg text-xs border"
                  style={{ background: cs.surface2, borderColor: cs.borderSoft, color: cs.text }}/>
              </div>

              <div className="px-4 py-2 border-b" style={{ borderColor: cs.border }}>
                <label className="text-xs mb-1 block" style={{ color: cs.textMuted }}>Capacity</label>
                <div className="flex items-center gap-2">
                  <input type="range" min={2} max={30} defaultValue={table.capacity}
                    onMouseUp={e => onUpdateTable(table.id, { capacity: +(e.target as HTMLInputElement).value })}
                    className="flex-1"/>
                  <span className="text-xs w-6 text-right" style={{ color: cs.text }}>{table.capacity}</span>
                </div>
              </div>

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
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: groupColor(g.group_id) }}/>
                    <span className="text-xs flex-1 truncate" style={{ color: cs.text }}>{g.first_name} {g.last_name}</span>
                    <span className="text-xs">{MEAL_ICON[g.meal || "standard"]}</span>
                    <button onClick={() => onSeatGuest(g.id, null, null)}
                      className="opacity-0 group-hover:opacity-100 text-xs hover:opacity-70"
                      style={{ color: "var(--danger)" }}>✕</button>
                  </div>
                ))}
              </div>

              <div className="mx-3 mb-2 p-3 rounded-xl border-2 border-dashed text-center text-xs"
                style={{ borderColor: cs.border, color: cs.textMuted }}
                onDragOver={e => onGuestDragOver(e, table.id)}
                onDrop={e => onGuestDrop(e, table.id)}
                onDragLeave={() => setDropTarget(null)}>
                {dropTarget === table.id ? "Drop to seat" : "Drag a guest here"}
              </div>

              <div className="px-3 pb-3 space-y-2">
                <button onClick={() => { if (confirm(`Remove all guests from "${table.name}"?`)) tg.forEach(g => onSeatGuest(g.id, null, null)); }}
                  className="w-full py-2 rounded-xl text-xs font-medium hover:opacity-80"
                  style={{ border: `1px solid var(--danger)`, color: "var(--danger)" }}>
                  Clear table
                </button>
                <button onClick={() => { if (confirm(`Delete "${table.name}"?`)) { onDeleteTable(table.id); setSelected(null); } }}
                  className="w-full py-2 rounded-xl text-xs font-medium hover:opacity-80 text-white"
                  style={{ background: "var(--danger)" }}>
                  🗑 Delete table
                </button>
              </div>
            </div>
          );
        })()}

        {/* ── RIGHT-CLICK CONTEXT MENU ── */}
        {ctxMenu && ctxTable && (
          <div
            className="fixed z-50 rounded-xl overflow-hidden shadow-xl text-xs"
            style={{ top: ctxMenu.y, left: ctxMenu.x, background: cs.surface, border: `1px solid ${cs.border}`, minWidth: 160 }}
            onClick={e => e.stopPropagation()}>
            <div className="px-3 py-2 border-b font-semibold truncate" style={{ borderColor: cs.border, color: cs.text }}>
              {ctxTable.name}
            </div>
            <button className="w-full text-left px-3 py-2 hover:opacity-70 transition-opacity"
              style={{ color: cs.text }}
              onClick={() => { setEditingTableId(ctxTable.id); setEditName(ctxTable.name); setCtxMenu(null); }}>
              ✏️ Rename
            </button>
            <button className="w-full text-left px-3 py-2 hover:opacity-70 transition-opacity"
              style={{ color: cs.text }}
              onClick={() => {
                const tg = tableGuests(ctxTable.id);
                if (confirm(`Remove all guests from "${ctxTable.name}"?`)) tg.forEach(g => onSeatGuest(g.id, null, null));
                setCtxMenu(null);
              }}>
              🧹 Clear guests
            </button>
            <button className="w-full text-left px-3 py-2 hover:opacity-70 transition-opacity"
              style={{ color: cs.text }}
              onClick={() => {
                onAddTable(`${ctxTable.name} (copy)`, ctxTable.shape, ctxTable.capacity);
                setCtxMenu(null);
              }}>
              📋 Duplicate
            </button>
            <div className="border-t my-0.5" style={{ borderColor: cs.border }}/>
            <button className="w-full text-left px-3 py-2 hover:opacity-70 transition-opacity"
              style={{ color: "var(--danger)" }}
              onClick={() => {
                if (confirm(`Delete "${ctxTable.name}"?`)) { onDeleteTable(ctxTable.id); setSelected(null); }
                setCtxMenu(null);
              }}>
              🗑 Delete table
            </button>
          </div>
        )}
      </div>
    </>
  );
}
