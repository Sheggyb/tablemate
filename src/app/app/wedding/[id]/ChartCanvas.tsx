"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { Table, Guest, Group, Rule } from "@/lib/types";

interface Props {
  tables:        Table[];
  guests:        Guest[];
  groups:        Group[];
  rules:         Rule[];
  onAddTable:    (name: string, shape: "round" | "rectangle" | "oval", capacity: number) => void;
  onUpdateTable: (id: string, data: Partial<Table>) => void;
  onDeleteTable: (id: string) => void;
  onSeatGuest:   (guestId: string, tableId: string | null, seatIndex: number | null) => void;
}

const TABLE_W = 120;
const TABLE_H = 80;
const COLORS   = ["#C9956E","#7B9E87","#8B7BA8","#C97B6E","#6E9EC9","#B8A86E"];

export default function ChartCanvas({ tables, guests, groups, rules, onAddTable, onUpdateTable, onDeleteTable, onSeatGuest }: Props) {
  const canvasRef   = useRef<HTMLDivElement>(null);
  const [offset, setOffset]     = useState({ x: 0, y: 0 });
  const [scale, setScale]       = useState(1);
  const [panning, setPanning]   = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTable, setNewTable] = useState({ name: "Table 1", shape: "round" as "round"|"rectangle"|"oval", capacity: 8 });

  const tableGuests = useCallback((tableId: string) =>
    guests.filter(g => g.table_id === tableId), [guests]);

  /* ── Pan canvas ── */
  const onPointerDownCanvas = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).dataset.table) return;
    setPanning(true);
    setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMoveCanvas = (e: React.PointerEvent) => {
    if (!panning) return;
    setOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };
  const onPointerUpCanvas = () => setPanning(false);

  /* ── Wheel zoom ── */
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(s => Math.min(2, Math.max(0.3, s * delta)));
  };

  /* ── Table drag ── */
  const onTablePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    setSelected(id);
    const t = tables.find(t => t.id === id)!;
    setDragging({ id, ox: e.clientX / scale - t.x, oy: e.clientY / scale - t.y });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onTablePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const x = e.clientX / scale - dragging.ox;
    const y = e.clientY / scale - dragging.oy;
    onUpdateTable(dragging.id, { x, y });
  };
  const onTablePointerUp = () => setDragging(null);

  /* ── Guest drag (from guest list onto table) ── */
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
    const used = new Set(seated.map(g => g.seat_index).filter(s => s !== null && s !== undefined));
    let si = 0;
    while (used.has(si)) si++;
    onSeatGuest(guestId, tableId, si);
    setDropTarget(null);
  };
  const onGuestDragLeave = () => setDropTarget(null);

  const unseatGuest = (guestId: string) => onSeatGuest(guestId, null, null);

  const groupColor = (groupId?: string | null) => {
    if (!groupId) return "#9B9098";
    const idx = groups.findIndex(g => g.id === groupId) % COLORS.length;
    return COLORS[idx < 0 ? 0 : idx];
  };

  const addTableModal = showAddTable && (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#EDE8E0] p-6 w-full max-w-sm shadow-xl">
        <h3 className="font-playfair text-lg font-bold text-[#2A2328] mb-4">Add Table</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2A2328] mb-1">Table name</label>
            <input type="text" value={newTable.name} onChange={e => setNewTable(p => ({...p, name: e.target.value}))}
              className="w-full px-3 py-2 border border-[#DDD7D0] rounded-lg text-sm focus:outline-none focus:border-[#C9956E]"
              placeholder="Table 1"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2A2328] mb-1">Shape</label>
            <select value={newTable.shape} onChange={e => setNewTable(p => ({...p, shape: e.target.value as any}))}
              className="w-full px-3 py-2 border border-[#DDD7D0] rounded-lg text-sm focus:outline-none focus:border-[#C9956E]">
              <option value="round">Round</option>
              <option value="rectangle">Rectangle</option>
              <option value="oval">Oval</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2A2328] mb-1">Capacity</label>
            <input type="number" min={2} max={30} value={newTable.capacity}
              onChange={e => setNewTable(p => ({...p, capacity: +e.target.value}))}
              className="w-full px-3 py-2 border border-[#DDD7D0] rounded-lg text-sm focus:outline-none focus:border-[#C9956E]"/>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setShowAddTable(false)}
            className="flex-1 py-2 border border-[#DDD7D0] rounded-lg text-sm text-[#6B6068] hover:border-[#C9956E]">
            Cancel
          </button>
          <button onClick={() => {
            onAddTable(newTable.name, newTable.shape, newTable.capacity);
            setShowAddTable(false);
            setNewTable(p => ({...p, name: `Table ${tables.length + 2}`}));
          }} className="flex-1 py-2 bg-[#C9956E] text-white rounded-lg text-sm font-semibold hover:bg-[#B8845D]">
            Add Table
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#F8F4EF]">
      {/* Toolbar */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        <button onClick={() => setShowAddTable(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#EDE8E0] rounded-xl text-sm font-medium text-[#2A2328] shadow-sm hover:border-[#C9956E] transition-colors">
          + Add Table
        </button>
        <button onClick={() => { setScale(1); setOffset({x:0,y:0}); }}
          className="px-3 py-2 bg-white border border-[#EDE8E0] rounded-xl text-xs text-[#6B6068] shadow-sm hover:border-[#C9956E] transition-colors">
          Reset View
        </button>
        <div className="px-3 py-2 bg-white border border-[#EDE8E0] rounded-xl text-xs text-[#9B9098] shadow-sm">
          {Math.round(scale * 100)}%
        </div>
      </div>

      {/* Canvas */}
      <div
        className={`w-full h-full select-none ${panning ? "cursor-grabbing" : "cursor-grab"}`}
        onPointerDown={onPointerDownCanvas}
        onPointerMove={(e) => { onPointerMoveCanvas(e); onTablePointerMove(e); }}
        onPointerUp={() => { onPointerUpCanvas(); onTablePointerUp(); }}
        onWheel={onWheel}
        ref={canvasRef}
      >
        {/* Grid background */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"
              patternTransform={`translate(${offset.x % 40},${offset.y % 40}) scale(${scale})`}>
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E8E3DC" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>

        {/* Tables */}
        <div style={{ transform: `translate(${offset.x}px,${offset.y}px) scale(${scale})`, transformOrigin: "0 0", position: "absolute" }}>
          {tables.map(table => {
            const seated   = tableGuests(table.id);
            const isFull   = seated.length >= table.capacity;
            const isDrop   = dropTarget === table.id;
            const isSel    = selected === table.id;
            const isRound  = table.shape === "round";
            const isOval   = table.shape === "oval";

            return (
              <div
                key={table.id}
                data-table={table.id}
                style={{
                  position: "absolute",
                  left: table.x,
                  top: table.y,
                  width: TABLE_W + (isRound ? 0 : 40),
                  height: TABLE_H,
                  borderRadius: isRound ? "50%" : isOval ? "50%" : "12px",
                  background: isDrop ? "#FDF4EC" : "white",
                  border: `2px solid ${isSel ? "#C9956E" : isDrop ? "#C9956E" : "#DDD7D0"}`,
                  boxShadow: isSel ? "0 4px 20px rgba(201,149,110,0.2)" : "0 2px 8px rgba(0,0,0,0.06)",
                  cursor: dragging?.id === table.id ? "grabbing" : "grab",
                  userSelect: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                  zIndex: isSel ? 10 : 1,
                }}
                onPointerDown={e => onTablePointerDown(e, table.id)}
                onPointerUp={onTablePointerUp}
                onDragOver={e => onGuestDragOver(e, table.id)}
                onDrop={e => onGuestDrop(e, table.id)}
                onDragLeave={onGuestDragLeave}
              >
                <div className="font-semibold text-xs text-[#2A2328] truncate px-2 max-w-full">{table.name}</div>
                <div className={`text-xs mt-0.5 ${isFull ? "text-amber-600" : "text-[#9B9098]"}`}>
                  {seated.length}/{table.capacity}
                </div>
                {/* Seated guests mini bubbles */}
                <div className="flex flex-wrap justify-center gap-0.5 px-2 mt-1 max-h-[28px] overflow-hidden">
                  {seated.slice(0, 8).map(g => (
                    <div key={g.id} title={`${g.first_name} ${g.last_name}`}
                      style={{ background: groupColor(g.group_id), width: 10, height: 10, borderRadius: "50%" }}/>
                  ))}
                  {seated.length > 8 && <div className="text-[9px] text-[#9B9098]">+{seated.length-8}</div>}
                </div>
                {/* Context menu icon */}
                {isSel && (
                  <button
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-100 border border-red-300 text-red-600 rounded-full text-xs flex items-center justify-center hover:bg-red-200 z-20"
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); if (confirm(`Delete "${table.name}"?`)) { onDeleteTable(table.id); setSelected(null); }}}
                  >×</button>
                )}
              </div>
            );
          })}
        </div>

        {tables.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <div className="text-4xl mb-3 opacity-40">🪑</div>
            <p className="text-sm text-[#9B9098] opacity-60">No tables yet. Click "+ Add Table" to start.</p>
          </div>
        )}
      </div>

      {/* Selected table detail panel */}
      {selected && (() => {
        const table   = tables.find(t => t.id === selected);
        if (!table) return null;
        const seated  = tableGuests(table.id);
        const vacant  = table.capacity - seated.length;
        return (
          <div className="absolute right-3 top-3 bottom-3 w-64 bg-white rounded-2xl border border-[#EDE8E0] shadow-xl flex flex-col overflow-hidden z-30">
            <div className="p-4 border-b border-[#EDE8E0]">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-[#2A2328] text-sm">{table.name}</h3>
                  <p className="text-xs text-[#9B9098]">{seated.length}/{table.capacity} seated · {vacant} vacant</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-[#9B9098] hover:text-[#2A2328] text-lg leading-none">×</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {seated.map(g => (
                <div key={g.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#FDFBF8] group">
                  <div style={{ background: groupColor(g.group_id), width: 8, height: 8, borderRadius: "50%", flexShrink: 0 }}/>
                  <span className="text-sm text-[#2A2328] flex-1 truncate">{g.first_name} {g.last_name}</span>
                  <button onClick={() => unseatGuest(g.id)}
                    className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-600 transition-opacity">
                    ✕
                  </button>
                </div>
              ))}
              {seated.length === 0 && (
                <p className="text-xs text-[#9B9098] text-center py-4">Drag guests here to seat them</p>
              )}
            </div>
          </div>
        );
      })()}

      {addTableModal}
    </div>
  );
}
