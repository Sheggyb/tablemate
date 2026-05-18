
"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import type { Table, Guest, Group, Rule, VenueShape, VenueShapeKind } from "@/lib/types";

interface Props {
  tables:        Table[];
  guests:        Guest[];
  groups:        Group[];
  rules:         Rule[];
  darkMode:      boolean;
  onAddTable:    (name: string, shape: "round" | "rectangle" | "oval", capacity: number) => void;
  onAddTableAt:  (entries: { name: string; shape: "round" | "rectangle" | "oval"; capacity: number; x: number; y: number }[]) => void;
  onUpdateTable: (id: string, data: Partial<Table>) => void;
  onDeleteTable: (id: string) => void;
  onSeatGuest:   (guestId: string, tableId: string | null, seatIndex: number | null) => void;
  onAutoSeat:    () => void;
  isDemo?:       boolean;
  activeVenue:   import("@/lib/types").Venue;
  onUpdateLayout:(venueId: string, layout: import("@/lib/types").VenueLayout) => void;
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

type SideTab = "add" | "custom" | "guests" | "layout";
type ViewMode = "canvas" | "list" | "grid";

interface ContextMenu { x: number; y: number; tableId: string; }

function snapToGrid(v: number): number {
  return Math.round(v / SNAP_GRID) * SNAP_GRID;
}

export default function ChartCanvas({
  tables, guests, groups, rules, darkMode,
  onAddTable, onAddTableAt, onUpdateTable, onDeleteTable, onSeatGuest, onAutoSeat, isDemo = false,
  activeVenue, onUpdateLayout,
}: Props) {
  const canvasRef   = useRef<HTMLDivElement>(null);
  const [offset, setOffset]     = useState({ x: 40, y: 40 });
  const [scale, setScale]       = useState(1);
  const [panning, setPanning]   = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [sideTab, setSideTab]   = useState<SideTab>(isDemo ? "guests" : "add");
  const [customShape, setCustomShape] = useState<"round"|"rectangle"|"oval">("round");
  const [customCap, setCustomCap] = useState(8);
  const [customName, setCustomName] = useState("");
  const [guestSearch, setGuestSearch] = useState("");
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [ctxMenu, setCtxMenu]   = useState<ContextMenu | null>(null);
  // New features
  const [snapEnabled, setSnapEnabled]           = useState(false);
  const [findQuery, setFindQuery]               = useState("");
  const [viewMode, setViewMode]                 = useState<ViewMode>("canvas");
  const [focusedGuestId, setFocusedGuestId]     = useState<string | null>(null);
  const [findDropdownOpen, setFindDropdownOpen] = useState(false);
  const [findUnseatToast, setFindUnseatToast]   = useState<string | null>(null);
  const [draggingFixture, setDraggingFixture]   = useState<{ id: string; ox: number; oy: number } | null>(null);
  const [selectedFixtureId, setSelectedFixtureId] = useState<string | null>(null);
  const [resizingFixture, setResizingFixture]   = useState<{ id: string; corner: string; startX: number; startY: number; startW: number; startH: number; startFX: number; startFY: number } | null>(null);
  // Custom fixture form state
  const [customFixLabel, setCustomFixLabel]     = useState("");
  const [customFixEmoji, setCustomFixEmoji]     = useState("🎪");

  // Shape drag/resize state (replaces single-room state)
  const [selectedShapeId, setSelectedShapeId]   = useState<string | null>(null);
  const [draggingShapeId, setDraggingShapeId]   = useState<{ id: string; startClientX: number; startClientY: number; startX: number; startY: number } | null>(null);
  const [resizingShapeId, setResizingShapeId]   = useState<{ id: string; handle: string; startClientX: number; startClientY: number; startX: number; startY: number; startSX: number; startSY: number } | null>(null);

  // Room Properties panel local UI state
  const [roomPosOpen, setRoomPosOpen]           = useState(false);
  const [roomAspectLock, setRoomAspectLock]     = useState(false);

  // Generate Tables UI state
  const [genCount, setGenCount]                 = useState<string>("");
  const [genDiamCm, setGenDiamCm]               = useState<number>(150);
  const [genResult, setGenResult]               = useState<{ n: number; tight: boolean; maxFit?: number } | null>(null);

  // Migration: if old templateKind exists and shapes is empty, auto-create shapes from old fields
  const layoutShapes: VenueShape[] = useMemo(() => {
    const layout = activeVenue?.layout;
    if (!layout) return [];
    if (layout.shapes && layout.shapes.length > 0) return layout.shapes;
    // Migrate legacy single shape
    if (layout.templateKind && layout.templateKind !== "blank") {
      const kind = layout.templateKind as VenueShapeKind;
      return [{
        id: "migrated-shape",
        kind,
        label: layout.roomName ?? kind.charAt(0).toUpperCase() + kind.slice(1),
        x: layout.roomOffsetX ?? 0,
        y: layout.roomOffsetY ?? 0,
        scaleX: layout.roomScaleX ?? 1,
        scaleY: layout.roomScaleY ?? 1,
        rotation: layout.roomRotation ?? 0,
        locked: layout.roomLocked ?? false,
        fillColor: layout.roomFillColor,
        fillOpacity: layout.roomFillOpacity,
        borderColor: layout.roomBorderColor,
        borderWidth: layout.roomBorderWidth,
        borderStyle: layout.roomBorderStyle,
        cornerRadius: layout.roomCornerRadius,
      }];
    }
    return [];
  }, [activeVenue?.layout]);

  const selectedShape = useMemo(
    () => layoutShapes.find(s => s.id === selectedShapeId) ?? null,
    [layoutShapes, selectedShapeId]
  );

  // Helper to update a specific shape in layout.shapes
  const updateShape = useCallback((id: string, patch: Partial<VenueShape>) => {
    if (!activeVenue?.layout) return;
    const existingShapes = activeVenue.layout.shapes && activeVenue.layout.shapes.length > 0
      ? activeVenue.layout.shapes
      : layoutShapes;
    const updated = existingShapes.map(s => s.id === id ? { ...s, ...patch } : s);
    onUpdateLayout(activeVenue.id, { ...activeVenue.layout, shapes: updated });
  }, [activeVenue, layoutShapes, onUpdateLayout]);

  const FIXTURE_PRESETS: { kind: import("@/lib/types").FixtureKind; emoji: string; label: string; w: number; h: number; color: string }[] = [
    { kind: "stage",       emoji: "🎭", label: "Stage",       w: 200, h: 80,  color: "#7c3aed" },
    { kind: "dancefloor",  emoji: "💃", label: "Dance Floor", w: 180, h: 180, color: "#2563eb" },
    { kind: "bar",         emoji: "🍹", label: "Bar",         w: 160, h: 60,  color: "#d97706" },
    { kind: "dj",          emoji: "🎵", label: "DJ Booth",    w: 80,  h: 80,  color: "#0d9488" },
    { kind: "entrance",    emoji: "🚪", label: "Entrance",    w: 80,  h: 30,  color: "#16a34a" },
    { kind: "exit",        emoji: "🚶", label: "Exit",        w: 80,  h: 30,  color: "#16a34a" },
    { kind: "buffet",      emoji: "🍽", label: "Buffet",      w: 180, h: 60,  color: "#ea580c" },
    { kind: "cake",        emoji: "🎂", label: "Cake Table",  w: 80,  h: 80,  color: "#db2777" },
    { kind: "gifts",       emoji: "🎁", label: "Gift Table",  w: 80,  h: 60,  color: "#dc2626" },
    { kind: "photobooth",  emoji: "📷", label: "Photo Booth", w: 100, h: 100, color: "#7c3aed" },
    { kind: "cloakroom",   emoji: "🧥", label: "Coat Check",  w: 100, h: 60,  color: "#6b7280" },
    { kind: "toilets",     emoji: "🚻", label: "Toilets",     w: 80,  h: 80,  color: "#6b7280" },
    { kind: "lounge",      emoji: "🛋",  label: "Lounge",      w: 140, h: 80,  color: "#92400e" },
    { kind: "plant",       emoji: "🌿", label: "Plant",       w: 50,  h: 50,  color: "#15803d" },
  ];

  const ROOM_TEMPLATES: { kind: import("@/lib/types").RoomTemplateKind; label: string; path: string | null }[] = [
    { kind: "blank",     label: "Blank",          path: null },
    { kind: "rectangle", label: "Rectangle Hall", path: "M 100 100 L 900 100 L 900 700 L 100 700 Z" },
    { kind: "lshape",    label: "L-Shape",        path: "M 100 100 L 550 100 L 550 350 L 900 350 L 900 700 L 100 700 Z" },
    { kind: "ushape",    label: "U-Shape",        path: "M 100 100 L 300 100 L 300 400 L 700 400 L 700 100 L 900 100 L 900 700 L 100 700 Z" },
    { kind: "oval",      label: "Oval / Marquee", path: null },
    { kind: "marquee",   label: "Marquee Tent",   path: "M 100 100 L 900 100 L 900 700 L 100 700 Z" },
  ];

  // Shape kind helpers
  function isWallKind(k: VenueShapeKind) { return k === "wall-h" || k === "wall-v" || k === "wall-diagonal"; }
  function getWallBaseW(k: VenueShapeKind) { return k === "wall-v" ? 20 : k === "wall-diagonal" ? 300 : 400; }
  function getWallBaseH(k: VenueShapeKind) { return k === "wall-v" ? 400 : 20; }

  const SHAPE_BUTTONS: { kind: VenueShapeKind; label: string; icon: string }[] = [
    { kind: "rectangle",    label: "Rectangle",  icon: "⬜" },
    { kind: "lshape",       label: "L-Shape",    icon: "📐" },
    { kind: "ushape",       label: "U-Shape",    icon: "⊓" },
    { kind: "oval",         label: "Oval",       icon: "⭕" },
    { kind: "marquee",      label: "Marquee",    icon: "⛺" },
    { kind: "wall-h",       label: "Wall H",     icon: "───" },
    { kind: "wall-v",       label: "Wall V",     icon: "│" },
    { kind: "wall-diagonal",label: "Wall Diag",  icon: "╱" },
  ];

  const addShape = useCallback((kind: VenueShapeKind) => {
    const existing = activeVenue?.layout ?? { templateKind: "blank" as import("@/lib/types").RoomTemplateKind, roomPath: null, fixtures: [] };
    const existingShapes = existing.shapes ?? layoutShapes;
    const offset_n = existingShapes.length * 20;
    const isWall = isWallKind(kind);
    const label = SHAPE_BUTTONS.find(b => b.kind === kind)?.label ?? kind;
    const newShape: VenueShape = {
      id: crypto.randomUUID(),
      kind,
      label,
      x: 300 + offset_n,
      y: 200 + offset_n,
      scaleX: 1,
      scaleY: 1,
      rotation: kind === "wall-diagonal" ? 45 : 0,
      locked: false,
      fillColor: isWall ? "transparent" : undefined,
      fillOpacity: isWall ? 0 : undefined,
      borderColor: isWall ? "#888888" : undefined,
      borderWidth: isWall ? 3 : undefined,
      borderStyle: "solid",
    };
    onUpdateLayout(activeVenue.id, {
      ...existing,
      shapes: [...existingShapes, newShape],
    });
    setSelectedShapeId(newShape.id);
  }, [activeVenue, layoutShapes, onUpdateLayout]);

  const handleFixtureDragStart = useCallback((e: React.PointerEvent, fixtureId: string) => {
    e.stopPropagation();
    const fix = activeVenue?.layout?.fixtures.find(f => f.id === fixtureId);
    if (!fix) return;
    const cx = (e.clientX - offset.x) / scale;
    const cy = (e.clientY - offset.y) / scale;
    setDraggingFixture({ id: fixtureId, ox: cx - fix.x, oy: cy - fix.y });
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }, [activeVenue, offset, scale]);

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

  // ── Find: matching guests and tables for dropdown ──
  const findGuestMatches = useMemo(() => {
    if (findQuery.trim().length < 2) return [] as Guest[];
    const q = findQuery.toLowerCase();
    return guests.filter(g =>
      `${g.first_name} ${g.last_name}`.toLowerCase().includes(q)
    );
  }, [findQuery, guests]);

  const findTableMatches = useMemo(() => {
    if (findQuery.trim().length < 2) return [] as Table[];
    const q = findQuery.toLowerCase();
    return tables.filter(t => t.name.toLowerCase().includes(q));
  }, [findQuery, tables]);

  // IDs of highlighted tables (floor plan) — all tables of focused guest
  const highlightedTableIds = useMemo(() => {
    if (!focusedGuestId) return [] as string[];
    const g = guests.find(x => x.id === focusedGuestId);
    return g?.table_id ? [g.table_id] : [];
  }, [focusedGuestId, guests]);

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
    setSelectedShapeId(null);
    if (e.target === e.currentTarget) setSelected(null);
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
    if (draggingFixture && activeVenue?.layout) {
      const nx = (e.clientX - offset.x) / scale - draggingFixture.ox;
      const ny = (e.clientY - offset.y) / scale - draggingFixture.oy;
      const updated = activeVenue.layout.fixtures.map(f =>
        f.id === draggingFixture.id ? { ...f, x: nx, y: ny } : f
      );
      onUpdateLayout(activeVenue.id, { ...activeVenue.layout, fixtures: updated });
    }
    if (resizingFixture && activeVenue?.layout) {
      const dx = (e.clientX - resizingFixture.startX) / scale;
      const dy = (e.clientY - resizingFixture.startY) / scale;
      const MIN = 30;
      let nx = resizingFixture.startFX;
      let ny = resizingFixture.startFY;
      let nw = resizingFixture.startW;
      let nh = resizingFixture.startH;
      const c = resizingFixture.corner;
      if (c === "se") { nw = Math.max(MIN, nw + dx); nh = Math.max(MIN, nh + dy); }
      else if (c === "sw") { const dw = Math.min(dx, nw - MIN); nx = nx + dw; nw = nw - dw; nh = Math.max(MIN, nh + dy); }
      else if (c === "ne") { nw = Math.max(MIN, nw + dx); const dh = Math.min(dy, nh - MIN); ny = ny + dh; nh = nh - dh; }
      else if (c === "nw") { const dw = Math.min(dx, nw - MIN); nx = nx + dw; nw = nw - dw; const dh = Math.min(dy, nh - MIN); ny = ny + dh; nh = nh - dh; }
      const updated = activeVenue.layout.fixtures.map(f =>
        f.id === resizingFixture.id ? { ...f, x: nx, y: ny, w: nw, h: nh } : f
      );
      onUpdateLayout(activeVenue.id, { ...activeVenue.layout, fixtures: updated });
    }
    if (draggingShapeId && activeVenue?.layout) {
      const dx = (e.clientX - draggingShapeId.startClientX) / scale;
      const dy = (e.clientY - draggingShapeId.startClientY) / scale;
      updateShape(draggingShapeId.id, {
        x: draggingShapeId.startX + dx,
        y: draggingShapeId.startY + dy,
      });
    }
    if (resizingShapeId && activeVenue?.layout) {
      const shape = layoutShapes.find(s => s.id === resizingShapeId.id);
      if (shape) {
        const dx = (e.clientX - resizingShapeId.startClientX) / scale;
        const dy = (e.clientY - resizingShapeId.startClientY) / scale;
        const MIN_SCALE = 0.05;
        const BASE_W = isWallKind(shape.kind) ? getWallBaseW(shape.kind) : 800;
        const BASE_H = isWallKind(shape.kind) ? getWallBaseH(shape.kind) : 600;
        let nSX = resizingShapeId.startSX;
        let nSY = resizingShapeId.startSY;
        let nX = resizingShapeId.startX;
        let nY = resizingShapeId.startY;
        const h = resizingShapeId.handle;
        if (h === "e" || h === "se" || h === "ne") {
          nSX = Math.max(MIN_SCALE, resizingShapeId.startSX + dx / BASE_W);
        }
        if (h === "w" || h === "sw" || h === "nw") {
          const dsx = dx / BASE_W;
          nSX = Math.max(MIN_SCALE, resizingShapeId.startSX - dsx);
          nX = resizingShapeId.startX + dsx * BASE_W * resizingShapeId.startSX;
        }
        if (h === "s" || h === "se" || h === "sw") {
          nSY = Math.max(MIN_SCALE, resizingShapeId.startSY + dy / BASE_H);
        }
        if (h === "n" || h === "ne" || h === "nw") {
          const dsy = dy / BASE_H;
          nSY = Math.max(MIN_SCALE, resizingShapeId.startSY - dsy);
          nY = resizingShapeId.startY + dsy * BASE_H * resizingShapeId.startSY;
        }
        updateShape(resizingShapeId.id, { scaleX: nSX, scaleY: nSY, x: nX, y: nY });
      }
    }
  }, [panning, panStart, dragging, draggingFixture, resizingFixture, draggingShapeId, resizingShapeId, offset, scale, snapEnabled, onUpdateTable, activeVenue, onUpdateLayout, updateShape, layoutShapes]);

  const onPointerUpCanvas = useCallback(() => {
    setPanning(false);
    setDragging(null);
    setDraggingFixture(null);
    setResizingFixture(null);
    setDraggingShapeId(null);
    setResizingShapeId(null);
  }, []);

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
            {([["add","Add"], ["custom","Custom"], ["guests","Guests"], ["layout","Layout"]] as [SideTab, string][]).map(([tab, label]) => (
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

          {/* Tab: Layout */}
          {sideTab === "layout" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-5">
              {/* ADD SHAPE */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: cs.accent }}>Add Shape</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {SHAPE_BUTTONS.map(btn => (
                    <button key={btn.kind}
                      onClick={() => addShape(btn.kind)}
                      className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl transition-all hover:scale-105 active:scale-95"
                      style={{ background: cs.surface2, color: cs.textMuted, border: `1px solid ${cs.border}` }}
                      title={`Add ${btn.label}`}>
                      <span className="text-base leading-none">{btn.icon}</span>
                      <span className="text-[8px] font-semibold leading-tight text-center truncate w-full" style={{ letterSpacing: "0.03em" }}>{btn.label}</span>
                    </button>
                  ))}
                </div>

                {/* Shapes list */}
                {layoutShapes.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-[9px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: cs.textMuted }}>Canvas shapes</p>
                    {layoutShapes.map(shape => {
                      const isSel = selectedShapeId === shape.id;
                      return (
                        <div key={shape.id}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all"
                          style={{
                            background: isSel ? cs.accentBg : cs.surface2,
                            border: `1px solid ${isSel ? cs.accent : cs.border}`,
                            color: isSel ? cs.accent : cs.text,
                          }}
                          onClick={() => setSelectedShapeId(isSel ? null : shape.id)}>
                          <span className="text-xs w-5 text-center">{SHAPE_BUTTONS.find(b => b.kind === shape.kind)?.icon ?? "□"}</span>
                          <span className="text-xs flex-1 truncate font-medium">{shape.label}</span>
                          {shape.locked && <span title="Locked" style={{ fontSize: 10 }}>🔒</span>}
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              if (!activeVenue?.layout) return;
                              const newShapes = layoutShapes.filter(s => s.id !== shape.id);
                              onUpdateLayout(activeVenue.id, { ...activeVenue.layout, shapes: newShapes });
                              if (selectedShapeId === shape.id) setSelectedShapeId(null);
                            }}
                            style={{ fontSize: 12, color: "var(--danger)", background: "none", border: "none", cursor: "pointer", lineHeight: 1, padding: 2 }}
                            title="Remove shape">✕</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Fixtures Palette */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: cs.accent }}>Add Fixture</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {FIXTURE_PRESETS.map(preset => (
                    <button key={preset.kind}
                      onClick={() => {
                        const existing = activeVenue?.layout ?? { templateKind: "blank" as import("@/lib/types").RoomTemplateKind, roomPath: null, fixtures: [] };
                        const newFixture: import("@/lib/types").VenueFixture = {
                          id: crypto.randomUUID(),
                          kind: preset.kind,
                          label: preset.label,
                          emoji: preset.emoji,
                          x: 400 - preset.w / 2,
                          y: 300 - preset.h / 2,
                          w: preset.w,
                          h: preset.h,
                          rotation: 0,
                          color: preset.color,
                        };
                        onUpdateLayout(activeVenue.id, {
                          ...existing,
                          fixtures: [...existing.fixtures, newFixture],
                        });
                      }}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-95"
                      style={{ background: cs.surface2, color: cs.textSoft, border: `1px solid ${cs.border}` }}>
                      <span className="text-lg leading-none w-6 text-center flex-shrink-0">{preset.emoji}</span>
                      <span className="text-[11px] font-medium leading-tight truncate">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Fixture */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: cs.accent }}>Custom Fixture</p>
                <div className="rounded-xl p-3 space-y-3" style={{ background: cs.surface2, border: `1px solid ${cs.border}` }}>
                  <input
                    type="text"
                    value={customFixLabel}
                    onChange={e => setCustomFixLabel(e.target.value)}
                    placeholder="e.g. Ice Bar, Photo Corner…"
                    className="w-full px-2.5 py-2 rounded-lg text-xs border"
                    style={{ background: cs.bg, borderColor: cs.border, color: cs.text }}
                  />
                  <div>
                    <p className="text-[10px] mb-1.5" style={{ color: cs.textMuted }}>Pick an emoji:</p>
                    <div className="grid grid-cols-7 gap-1">
                      {["🎪","🍕","🎸","🎤","🎨","🏆","🕯️","🌸","⭐","🎯","🎺","🪴","🍰","🥂","🎻","🎆","🪑","🖼️","🎠","🌺"].map(em => (
                        <button key={em}
                          onClick={() => setCustomFixEmoji(em)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-sm transition-all"
                          style={{
                            background: customFixEmoji === em ? cs.accentBg : "transparent",
                            border: `1.5px solid ${customFixEmoji === em ? cs.accent : "transparent"}`,
                          }}>
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const label = customFixLabel.trim() || "Custom";
                      const existing = activeVenue?.layout ?? { templateKind: "blank" as import("@/lib/types").RoomTemplateKind, roomPath: null, fixtures: [] };
                      const newFixture: import("@/lib/types").VenueFixture = {
                        id: crypto.randomUUID(),
                        kind: "custom",
                        label,
                        emoji: customFixEmoji,
                        x: 380,
                        y: 270,
                        w: 100,
                        h: 70,
                        rotation: 0,
                        color: "#c9a96e",
                      };
                      onUpdateLayout(activeVenue.id, { ...existing, fixtures: [...existing.fixtures, newFixture] });
                      setCustomFixLabel("");
                    }}
                    disabled={!customFixLabel.trim()}
                    className="w-full py-2 rounded-xl text-xs font-semibold transition-opacity"
                    style={{
                      background: customFixLabel.trim() ? cs.accent : cs.surface,
                      color: customFixLabel.trim() ? "#fff" : cs.textMuted,
                      border: `1px solid ${customFixLabel.trim() ? cs.accent : cs.border}`,
                      opacity: customFixLabel.trim() ? 1 : 0.6,
                    }}>
                    {customFixEmoji} Add to Canvas
                  </button>
                </div>
              </div>

              {/* Placed Fixtures List */}
              {activeVenue?.layout && activeVenue.layout.fixtures.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: cs.accent }}>Placed ({activeVenue.layout.fixtures.length})</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {activeVenue.layout.fixtures.map(f => {
                      const preset = FIXTURE_PRESETS.find(p => p.kind === f.kind);
                      const emoji = f.emoji ?? preset?.emoji ?? "📦";
                      const isSel = selectedFixtureId === f.id;
                      return (
                        <div key={f.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all"
                          onClick={() => setSelectedFixtureId(isSel ? null : f.id)}
                          style={{ background: isSel ? cs.accentBg : cs.surface2, border: `1px solid ${isSel ? cs.accent : "transparent"}` }}>
                          <span className="text-sm leading-none w-5 text-center">{emoji}</span>
                          <span className="text-xs flex-1 truncate" style={{ color: isSel ? cs.accent : cs.textSoft }}>{f.label}</span>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              if (!activeVenue.layout) return;
                              if (selectedFixtureId === f.id) setSelectedFixtureId(null);
                              onUpdateLayout(activeVenue.id, {
                                ...activeVenue.layout,
                                fixtures: activeVenue.layout.fixtures.filter(x => x.id !== f.id),
                              });
                            }}
                            className="text-xs hover:opacity-60 transition-opacity flex-shrink-0"
                            style={{ color: cs.textMuted }}>🗑</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
            <div className="relative flex items-center" style={{ zIndex: 50 }}>
              <span className="absolute left-2 text-xs pointer-events-none" style={{ color: cs.textMuted }}>🔍</span>
              <input
                type="search"
                value={findQuery}
                onChange={e => {
                  setFindQuery(e.target.value);
                  setFocusedGuestId(null);
                  setFindDropdownOpen(true);
                  setFindUnseatToast(null);
                }}
                onFocus={() => { if (findQuery.trim().length >= 2) setFindDropdownOpen(true); }}
                placeholder="Find guest…"
                className="pl-6 pr-2 py-1.5 rounded-lg text-xs border"
                style={{ background: cs.surface2, borderColor: findQuery ? cs.accent : cs.borderSoft, color: cs.text, width: 140 }}
              />
              {focusedGuestId && (
                <span className="absolute -right-1 -top-1 w-2 h-2 rounded-full" style={{ background: cs.accent }}/>
              )}
              {/* Find results dropdown */}
              {findDropdownOpen && (findGuestMatches.length > 0 || findTableMatches.length > 0) && (
                <div className="absolute top-full left-0 mt-1 rounded-xl shadow-xl overflow-hidden"
                  style={{ background: cs.surface, border: `1px solid ${cs.border}`, minWidth: 280, maxHeight: 320, overflowY: "auto", zIndex: 100 }}>
                  {/* Tables section */}
                  {findTableMatches.length > 0 && (<>
                    <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border-b"
                      style={{ color: cs.textMuted, borderColor: cs.border, background: cs.surface2 }}>
                      🪑 Tables ({findTableMatches.length})
                    </div>
                    {findTableMatches.map(t => {
                      const tg = tableGuests(t.id);
                      return (
                        <button key={t.id}
                          className="w-full text-left px-3 py-2 hover:opacity-80 transition-opacity flex items-center gap-2"
                          style={{ borderBottom: `1px solid ${cs.border}`, background: selected === t.id ? cs.accentBg : "transparent" }}
                          onClick={() => {
                            setSelected(t.id);
                            setFindDropdownOpen(false);
                            setFindUnseatToast(null);
                          }}>
                          <span className="text-base leading-none">🪑</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate" style={{ color: cs.text }}>{t.name}</div>
                            <div className="text-[10px]" style={{ color: cs.textMuted }}>
                              {tg.length}/{t.capacity} seated · cap {t.capacity}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </>)}
                  {/* Guests section */}
                  {findGuestMatches.length > 0 && (<>
                    <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border-b"
                      style={{ color: cs.textMuted, borderColor: cs.border, background: cs.surface2 }}>
                      👤 Guests ({findGuestMatches.length})
                    </div>
                    {findGuestMatches.map(g => {
                      const tbl = g.table_id ? tables.find(t => t.id === g.table_id) : null;
                      const grp = g.group_id ? groups.find(gr => gr.id === g.group_id) : null;
                      const rsvpColor = g.rsvp === "confirmed" ? "var(--success)" : g.rsvp === "declined" ? "var(--danger)" : cs.textMuted;
                      const rsvpLabel = g.rsvp === "confirmed" ? "✓ Confirmed" : g.rsvp === "declined" ? "✗ Declined" : "? Pending";
                      return (
                        <button key={g.id}
                          className="w-full text-left px-3 py-2 hover:opacity-80 transition-opacity flex items-center gap-2"
                          style={{ borderBottom: `1px solid ${cs.border}`, background: focusedGuestId === g.id ? cs.accentBg : "transparent" }}
                          onClick={() => {
                            setFocusedGuestId(g.id);
                            setFindDropdownOpen(false);
                            setFindUnseatToast(null);
                            if (!g.table_id) {
                              setFindUnseatToast(`${g.first_name} ${g.last_name} is not seated yet`);
                            }
                          }}>
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: groupColor(g.group_id) }}/>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate" style={{ color: cs.text }}>{g.first_name} {g.last_name}</div>
                            <div className="text-[10px] truncate" style={{ color: cs.textMuted }}>
                              {tbl ? `📍 ${tbl.name}` : "🪑 Unseated"}{grp ? ` · ${grp.name}` : ""}
                            </div>
                          </div>
                          <span className="text-[10px] flex-shrink-0 font-medium" style={{ color: rsvpColor }}>{rsvpLabel}</span>
                        </button>
                      );
                    })}
                  </>)}
                </div>
              )}
              {/* No matches message */}
              {findDropdownOpen && findQuery.trim().length >= 2 && findGuestMatches.length === 0 && findTableMatches.length === 0 && (
                <div className="absolute top-full left-0 mt-1 rounded-xl shadow-xl px-3 py-2.5 text-xs"
                  style={{ background: cs.surface, border: `1px solid ${cs.border}`, color: cs.textMuted, minWidth: 180, zIndex: 100 }}>
                  No results found
                </div>
              )}
              {/* Unseated toast */}
              {findUnseatToast && (
                <div className="absolute top-full left-0 mt-1 rounded-xl shadow-xl px-3 py-2.5 text-xs"
                  style={{ background: cs.surface, border: `1px solid var(--warning)`, color: "var(--warning)", minWidth: 220, zIndex: 100 }}>
                  🪑 {findUnseatToast}
                </div>
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

            {/* View mode toggle */}
            <div className="flex items-center gap-0.5 rounded-lg overflow-hidden" style={{ border: `1px solid ${cs.border}` }}>
              {([["canvas","📐","Floor Plan"],["list","☰","List"],["grid","⊞","Grid"]] as [ViewMode,string,string][]).map(([mode, icon, label]) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  title={label}
                  className="px-2.5 py-1.5 text-xs hover:opacity-80 transition-all"
                  style={{
                    background: viewMode === mode ? cs.accent : cs.surface2,
                    color: viewMode === mode ? "white" : cs.textSoft,
                  }}>
                  {icon}
                </button>
              ))}
            </div>

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

          {/* ── LIST VIEW ── */}
          {viewMode === "list" && (
            <div className="flex-1 overflow-hidden flex min-h-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {tables.length === 0 && (
                <div className="text-center py-16" style={{ color: cs.textMuted }}>
                  <p className="text-4xl mb-3">📐</p>
                  <p className="text-sm">No tables yet — switch to Floor Plan and add some!</p>
                </div>
              )}
              {tables.map(t => {
                const tGuests = tableGuests(t.id);
                const cap = t.capacity || 8;
                const pct = Math.min(100, Math.round(tGuests.length / cap * 100));
                const over = tGuests.length > cap;
                const isDrop = dropTarget === t.id;
                const isSel = selected === t.id;
                return (
                  <div key={t.id} className="rounded-2xl overflow-hidden transition-all"
                    style={{
                      background: cs.surface,
                      border: `1px solid ${isDrop ? "var(--accent)" : cs.border}`,
                      boxShadow: isDrop ? "0 0 0 3px var(--accent-bg)" : "none",
                    }}
                    onDragOver={e => onGuestDragOver(e, t.id)}
                    onDrop={e => onGuestDrop(e, t.id)}
                    onDragLeave={() => setDropTarget(null)}>
                    <div className="flex items-center justify-between px-4 py-3 cursor-pointer"
                      onClick={() => setSelected(isSel ? null : t.id)}
                      style={{
                        background: isDrop ? "var(--accent-bg)" : cs.surface2,
                        borderBottom: `1px solid ${cs.border}`,
                        transition: "background 0.15s",
                      }}>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-sm" style={{ color: cs.text }}>{t.name}</span>
                        <span className="text-xs rounded-full px-2 py-0.5"
                          style={{ background: over ? "rgba(224,92,106,0.15)" : cs.accentBg,
                            color: over ? "var(--danger)" : cs.accent }}>
                          {tGuests.length}/{cap}
                        </span>
                        {over && <span className="text-xs" style={{ color: "var(--danger)" }}>⚠ Over capacity</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Capacity bar */}
                        <div className="w-20 rounded-full" style={{ height: 5, background: cs.border }}>
                          <div style={{ width: `${pct}%`, height: 5, borderRadius: 999,
                            background: over ? "var(--danger)" : pct >= 80 ? "var(--success)" : cs.accent }}/>
                        </div>
                        <span className="text-xs" style={{ color: cs.textMuted }}>{pct}%</span>
                      </div>
                    </div>
                    {tGuests.length === 0 ? (
                      <div className="px-4 py-3 text-xs" style={{ color: cs.textMuted }}>No guests seated yet</div>
                    ) : (
                      <div className="divide-y" style={{ borderColor: cs.border }}>
                        {tGuests.sort((a, b) => `${a.last_name}${a.first_name}`.localeCompare(`${b.last_name}${b.first_name}`)).map((g, i) => (
                          <div key={g.id}
                            data-guest-row={g.id}
                            ref={el => { if (el && focusedGuestId === g.id) el.scrollIntoView({ behavior: "smooth", block: "center" }); }}
                            className="flex items-center gap-3 px-4 py-2 transition-all"
                            style={{
                              background: focusedGuestId === g.id ? "var(--accent-bg)" : "transparent",
                              borderLeft: focusedGuestId === g.id ? "3px solid var(--accent)" : "3px solid transparent",
                            }}>
                            <span className="text-xs w-5 text-right flex-shrink-0" style={{ color: cs.textMuted }}>{i + 1}</span>
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: groupColor(g.group_id) }}/>
                            <span className="text-sm flex-1" style={{ color: cs.text }}>
                              {g.first_name} {g.last_name}
                            </span>
                            {g.group_id && (
                              <span className="text-xs" style={{ color: cs.textMuted }}>
                                {groups.find(gr => gr.id === g.group_id)?.name ?? ""}
                              </span>
                            )}
                            <span className="text-xs" title={g.meal || "standard"}>
                              {MEAL_ICON[g.meal || "standard"]}
                            </span>
                            <span className="text-xs rounded-full px-1.5" style={{
                              background: g.rsvp === "confirmed" ? "rgba(76,175,125,0.15)" : g.rsvp === "declined" ? "rgba(224,92,106,0.15)" : cs.surface2,
                              color: g.rsvp === "confirmed" ? "var(--success)" : g.rsvp === "declined" ? "var(--danger)" : cs.textMuted,
                            }}>
                              {g.rsvp === "confirmed" ? "✓" : g.rsvp === "declined" ? "✗" : "?"}
                            </span>
                            <button onClick={() => onSeatGuest(g.id, null, null)}
                              className="text-xs hover:opacity-60 ml-1" style={{ color: cs.textMuted }}
                              title="Remove from table">✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

            </div>
            </div>
          )}

          {/* ── GRID VIEW ── */}
          {viewMode === "grid" && (
            <div className="flex-1 overflow-hidden flex min-h-0">
              <div className="flex-1 overflow-y-auto p-4">
              {tables.length === 0 && (
                <div className="text-center py-16" style={{ color: cs.textMuted }}>
                  <p className="text-4xl mb-3">📐</p>
                  <p className="text-sm">No tables yet — switch to Floor Plan and add some!</p>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {tables.map(t => {
                  const tGuests = tableGuests(t.id);
                  const cap = t.capacity || 8;
                  const over = tGuests.length > cap;
                  const isDrop = dropTarget === t.id;
                  const isFocusedTable = focusedGuestId ? tGuests.some(g => g.id === focusedGuestId) : false;
                  const isSel = selected === t.id;
                  return (
                    <div key={t.id}
                      ref={el => { if (el && isFocusedTable) el.scrollIntoView({ behavior: "smooth", block: "center" }); }}
                      className="rounded-2xl p-4 flex flex-col gap-2 transition-all"
                      style={{
                        background: isDrop || isFocusedTable ? "var(--accent-bg)" : cs.surface,
                        border: `${isDrop || isFocusedTable || isSel ? 2 : 1}px solid ${isSel ? "var(--accent)" : isDrop || isFocusedTable ? "var(--accent)" : over ? "var(--danger)" : cs.border}`,
                        boxShadow: isDrop || isFocusedTable || isSel ? "0 0 0 3px var(--accent-bg)" : "none",
                        transform: isDrop ? "scale(1.02)" : "scale(1)",
                        cursor: "pointer",
                      }}
                      onClick={() => setSelected(isSel ? null : t.id)}
                      onDragOver={e => onGuestDragOver(e, t.id)}
                      onDrop={e => onGuestDrop(e, t.id)}
                      onDragLeave={() => setDropTarget(null)}>
                      <div className="font-semibold text-sm truncate" style={{ color: cs.text }}>{t.name}</div>
                      {/* Seat dots */}
                      <div className="flex flex-wrap gap-1.5 my-1">
                        {Array.from({ length: cap }).map((_, i) => {
                          const g = tGuests[i];
                          return (
                            <div key={i} className="w-5 h-5 rounded-full flex items-center justify-center text-[9px]"
                              title={g ? `${g.first_name} ${g.last_name}` : "Empty"}
                              style={{
                                background: g ? groupColor(g.group_id) : cs.surface2,
                                border: g ? (g.id === focusedGuestId ? "2px solid var(--accent)" : "none") : `1px dashed ${cs.border}`,
                                color: "white",
                              }}>
                              {g ? ((g.first_name?.[0] ?? "") + (g.last_name?.[0] ?? "")).toUpperCase() : ""}
                            </div>
                          );
                        })}
                        {tGuests.length > cap && Array.from({ length: tGuests.length - cap }).map((_, i) => (
                          <div key={`over-${i}`} className="w-5 h-5 rounded-full flex items-center justify-center text-[9px]"
                            title="Over capacity"
                            style={{ background: "var(--danger)", color: "white" }}>+</div>
                        ))}
                      </div>
                      <div className="text-xs" style={{ color: over ? "var(--danger)" : isDrop ? "var(--accent)" : cs.textMuted }}>
                        {isDrop ? "✚ Drop to seat" : `${tGuests.length} / ${cap} seats`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            </div>
          )}

          {/* Canvas — always mounted so canvasRef stays attached for wheel zoom */}
            <div ref={canvasRef}
            className="flex-1 overflow-hidden relative select-none"
            style={{ display: viewMode === "canvas" ? undefined : "none", background: cs.bg, cursor: panning ? "grabbing" : "grab" }}
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
              {/* Room Layout Layer — renders all VenueShapes */}
              <svg style={{ position: "absolute", top: 0, left: 0, overflow: "visible", pointerEvents: "none" }}>
                {layoutShapes.map(shape => {
                  const isSel = selectedShapeId === shape.id;
                  const isWall = isWallKind(shape.kind);
                  const BASE_W = isWall ? getWallBaseW(shape.kind) : 800;
                  const BASE_H = isWall ? getWallBaseH(shape.kind) : 600;
                  const sx = shape.scaleX, sy = shape.scaleY;
                  const cx = BASE_W / 2, cy = BASE_H / 2;

                  // Shape SVG content (in 0,0 coordinate space before scale/rotate)
                  const defaultFill = isWall ? "transparent" : (darkMode ? cs.surface : cs.surface);
                  const defaultFillOp = isWall ? 0 : (darkMode ? 0.15 : 0.9);
                  const fill = shape.fillColor ?? defaultFill;
                  const fillOp = shape.fillOpacity ?? defaultFillOp;
                  const stroke = shape.borderColor ?? cs.border;
                  const strokeW = (shape.borderWidth ?? (isWall ? 3 : 3)) / Math.min(sx, sy);
                  const strokeDash = (shape.borderStyle ?? "dashed") === "solid" ? undefined
                    : (shape.borderStyle === "dotted") ? `${2/Math.min(sx,sy)} ${4/Math.min(sx,sy)}`
                    : `${8/Math.min(sx,sy)} ${4/Math.min(sx,sy)}`;

                  const shapeEl = shape.kind === "oval"
                    ? <ellipse cx={400} cy={300} rx={400} ry={300} fill={fill} fillOpacity={fillOp} stroke={stroke} strokeWidth={strokeW} strokeDasharray={strokeDash}/>
                    : shape.kind === "rectangle"
                    ? <rect x={0} y={0} width={800} height={600} rx={(shape.cornerRadius ?? 0)/Math.min(sx,sy)} fill={fill} fillOpacity={fillOp} stroke={stroke} strokeWidth={strokeW} strokeDasharray={strokeDash}/>
                    : shape.kind === "lshape"
                    ? <path d="M 0 0 L 450 0 L 450 250 L 800 250 L 800 600 L 0 600 Z" fill={fill} fillOpacity={fillOp} stroke={stroke} strokeWidth={strokeW} strokeDasharray={strokeDash}/>
                    : shape.kind === "ushape"
                    ? <path d="M 0 0 L 200 0 L 200 300 L 600 300 L 600 0 L 800 0 L 800 600 L 0 600 Z" fill={fill} fillOpacity={fillOp} stroke={stroke} strokeWidth={strokeW} strokeDasharray={strokeDash}/>
                    : shape.kind === "marquee"
                    ? <><rect x={0} y={0} width={800} height={600} fill={fill} fillOpacity={fillOp} stroke={stroke} strokeWidth={strokeW} strokeDasharray={strokeDash}/><path d="M 400 0 L 400 -40" stroke={stroke} strokeWidth={strokeW}/></>
                    : isWall
                    ? <rect x={0} y={0} width={BASE_W} height={BASE_H} fill={fill} fillOpacity={fillOp} stroke={stroke} strokeWidth={strokeW} strokeDasharray={strokeDash}/>
                    : null;

                  // Bounding box for handles
                  const bx = shape.x, by = shape.y;
                  const bw = BASE_W * sx, bh = BASE_H * sy;
                  const midX = bx + bw/2, midY = by + bh/2;
                  const handles: { id: string; cx: number; cy: number; cursor: string }[] = [
                    { id: "nw", cx: bx,      cy: by,      cursor: "nwse-resize" },
                    { id: "n",  cx: midX,    cy: by,      cursor: "ns-resize"   },
                    { id: "ne", cx: bx + bw, cy: by,      cursor: "nesw-resize" },
                    { id: "e",  cx: bx + bw, cy: midY,    cursor: "ew-resize"   },
                    { id: "se", cx: bx + bw, cy: by + bh, cursor: "nwse-resize" },
                    { id: "s",  cx: midX,    cy: by + bh, cursor: "ns-resize"   },
                    { id: "sw", cx: bx,      cy: by + bh, cursor: "nesw-resize" },
                    { id: "w",  cx: bx,      cy: midY,    cursor: "ew-resize"   },
                  ];

                  return (
                    <g key={shape.id}>
                      {/* Shape body — draggable */}
                      <g
                        transform={`translate(${shape.x},${shape.y})`}
                        style={{ pointerEvents: "all", cursor: shape.locked ? "not-allowed" : isSel ? "move" : "pointer" }}
                        onPointerDown={e => {
                          e.stopPropagation();
                          setSelectedShapeId(shape.id);
                          if (shape.locked) return;
                          setDraggingShapeId({ id: shape.id, startClientX: e.clientX, startClientY: e.clientY, startX: shape.x, startY: shape.y });
                          (e.currentTarget as SVGGElement).setPointerCapture(e.pointerId);
                        }}
                      >
                        <g transform={`rotate(${shape.rotation},${cx * sx},${cy * sy})`}>
                          <g transform={`scale(${sx},${sy})`}>
                            {shapeEl}
                          </g>
                        </g>
                      </g>
                      {/* Selection highlight + resize handles */}
                      {isSel && (<>
                        <rect x={bx} y={by} width={bw} height={bh}
                          fill="none" stroke={cs.accent} strokeWidth={1.5} strokeDasharray="6 3"
                          style={{ pointerEvents: "none" }}/>
                        {handles.map(hd => (
                          <rect key={hd.id}
                            x={hd.cx - 5} y={hd.cy - 5} width={10} height={10} rx={2}
                            fill={cs.surface} stroke={cs.accent} strokeWidth={1.5}
                            style={{ cursor: hd.cursor, pointerEvents: "all" }}
                            onPointerDown={e => {
                              e.stopPropagation();
                              (e.currentTarget as SVGRectElement).setPointerCapture(e.pointerId);
                              setResizingShapeId({ id: shape.id, handle: hd.id, startClientX: e.clientX, startClientY: e.clientY, startX: shape.x, startY: shape.y, startSX: sx, startSY: sy });
                            }}
                          />
                        ))}
                      </>)}
                    </g>
                  );
                })}
                {/* Fixtures */}
                {activeVenue?.layout?.fixtures.map(f => {
                    const preset = FIXTURE_PRESETS.find(p => p.kind === f.kind);
                    const emoji = f.emoji ?? preset?.emoji ?? "📦";
                    const isSel = selectedFixtureId === f.id;
                    const HANDLE = 9;
                    return (
                      <g key={f.id} transform={`translate(${f.x},${f.y})`} style={{ pointerEvents: "all" }}>
                        {/* Body — draggable */}
                        <g style={{ cursor: "move" }} onPointerDown={e => { e.stopPropagation(); setSelectedFixtureId(f.id); handleFixtureDragStart(e, f.id); }}>
                          <rect x={0} y={0} width={f.w} height={f.h} rx={6}
                            fill={f.color} fillOpacity={0.2} stroke={isSel ? f.color : f.color}
                            strokeWidth={isSel ? 2.5 : 2} strokeOpacity={isSel ? 1 : 0.7} />
                          {isSel && <rect x={-2} y={-2} width={f.w + 4} height={f.h + 4} rx={8}
                            fill="none" stroke={f.color} strokeWidth={1.5} strokeOpacity={0.4} strokeDasharray="4 3" />}
                          <text x={f.w/2} y={f.h/2 - 8} textAnchor="middle" fontSize={18} dominantBaseline="middle">
                            {emoji}
                          </text>
                          <text x={f.w/2} y={f.h/2 + 12} textAnchor="middle" fontSize={11}
                            fill={f.color} fontWeight={600} dominantBaseline="middle">
                            {f.label}
                          </text>
                        </g>
                        {/* Resize handles — only when selected */}
                        {isSel && (([["nw",0,0],["ne",f.w,0],["se",f.w,f.h],["sw",0,f.h]] as [string,number,number][]).map(([corner, hx, hy]) => (
                          <rect key={corner}
                            x={hx - HANDLE/2} y={hy - HANDLE/2}
                            width={HANDLE} height={HANDLE} rx={2}
                            fill={cs.surface} stroke={f.color} strokeWidth={1.5}
                            style={{ cursor: corner === "nw" || corner === "se" ? "nwse-resize" : "nesw-resize" }}
                            onPointerDown={e => {
                              e.stopPropagation();
                              (e.currentTarget as SVGElement).setPointerCapture(e.pointerId);
                              setResizingFixture({ id: f.id, corner, startX: e.clientX, startY: e.clientY, startW: f.w, startH: f.h, startFX: f.x, startFY: f.y });
                            }}
                          />
                        )))}
                      </g>
                    );
                  })}
              </svg>
              {tables.map((table, tableIndex) => {
                const tg = tableGuests(table.id);
                const isFull    = tg.length >= table.capacity;
                const isDrop    = dropTarget === table.id;
                const isSel     = selected === table.id;
                const isHighlit = highlightedTableIds.includes(table.id);
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

          {/* ── RIGHT PANEL — Shape Properties ── */}
          {(() => {
          const shape = selectedShape;
          if (!shape) return null;
          const isWall = isWallKind(shape.kind);
          const updateS = (p: Partial<import("@/lib/types").VenueShape>) => updateShape(shape.id, p);
          return (
            <div
              style={{
                position: "absolute",
                right: 0, top: 0, height: "100%",
                width: 264,
                zIndex: 20,
                background: cs.surface,
                borderLeft: `1px solid ${cs.border}`,
                display: "flex",
                flexDirection: "column",
                transform: "translateX(0)",
                transition: "transform 0.2s ease",
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div style={{ padding: "12px 14px 10px", borderBottom: `1px solid ${cs.border}`, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: cs.text }}>
                    {SHAPE_BUTTONS.find(b => b.kind === shape.kind)?.icon ?? "□"} {shape.label}
                  </span>
                  <button onClick={() => setSelectedShapeId(null)}
                    style={{ fontSize: 18, lineHeight: 1, color: cs.textMuted, background: "none", border: "none", cursor: "pointer" }}>×</button>
                </div>
                <input
                  type="text"
                  defaultValue={shape.label}
                  placeholder="Shape label…"
                  onBlur={e => updateS({ label: e.target.value })}
                  onKeyDown={e => { if (e.key === "Enter") updateS({ label: (e.target as HTMLInputElement).value }); }}
                  style={{
                    marginTop: 8, width: "100%", padding: "5px 8px",
                    borderRadius: 8, border: `1px solid ${cs.border}`,
                    background: cs.surface2, color: cs.text, fontSize: 12,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Position */}
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: cs.accent, marginBottom: 8 }}>Position</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 10, color: cs.textMuted, display: "block", marginBottom: 3 }}>X</label>
                      <input type="number" value={Math.round(shape.x)} step={10}
                        onChange={e => updateS({ x: +e.target.value })}
                        style={{ width: "100%", padding: "4px 6px", borderRadius: 6, border: `1px solid ${cs.border}`, background: cs.surface2, color: cs.text, fontSize: 12, boxSizing: "border-box" }}/>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: cs.textMuted, display: "block", marginBottom: 3 }}>Y</label>
                      <input type="number" value={Math.round(shape.y)} step={10}
                        onChange={e => updateS({ y: +e.target.value })}
                        style={{ width: "100%", padding: "4px 6px", borderRadius: 6, border: `1px solid ${cs.border}`, background: cs.surface2, color: cs.text, fontSize: 12, boxSizing: "border-box" }}/>
                    </div>
                  </div>
                </div>

                {/* Scale */}
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: cs.accent, marginBottom: 8 }}>Size (scale)</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 10, color: cs.textMuted, display: "block", marginBottom: 3 }}>Width ×</label>
                      <input type="number" value={shape.scaleX.toFixed(2)} step={0.05} min={0.05}
                        onChange={e => updateS({ scaleX: Math.max(0.05, +e.target.value) })}
                        style={{ width: "100%", padding: "4px 6px", borderRadius: 6, border: `1px solid ${cs.border}`, background: cs.surface2, color: cs.text, fontSize: 12, boxSizing: "border-box" }}/>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: cs.textMuted, display: "block", marginBottom: 3 }}>Height ×</label>
                      <input type="number" value={shape.scaleY.toFixed(2)} step={0.05} min={0.05}
                        onChange={e => updateS({ scaleY: Math.max(0.05, +e.target.value) })}
                        style={{ width: "100%", padding: "4px 6px", borderRadius: 6, border: `1px solid ${cs.border}`, background: cs.surface2, color: cs.text, fontSize: 12, boxSizing: "border-box" }}/>
                    </div>
                  </div>
                </div>

                {/* Rotation */}
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: cs.accent, marginBottom: 8 }}>Rotation</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="range" min={0} max={360} step={1} value={shape.rotation}
                      onChange={e => updateS({ rotation: +e.target.value })}
                      style={{ flex: 1 }}/>
                    <span style={{ fontSize: 12, color: cs.text, width: 36, textAlign: "right" }}>{shape.rotation}°</span>
                  </div>
                </div>

                {/* Fill (not for walls) */}
                {!isWall && (
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: cs.accent, marginBottom: 8 }}>Fill</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="color" value={shape.fillColor ?? cs.surface}
                        onChange={e => updateS({ fillColor: e.target.value })}
                        style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${cs.border}`, cursor: "pointer", padding: 2 }}/>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 10, color: cs.textMuted, display: "block", marginBottom: 3 }}>Opacity</label>
                        <input type="range" min={0} max={1} step={0.05} value={shape.fillOpacity ?? 0.9}
                          onChange={e => updateS({ fillOpacity: +e.target.value })}
                          style={{ width: "100%" }}/>
                      </div>
                      <span style={{ fontSize: 11, color: cs.text, width: 28, textAlign: "right" }}>{Math.round((shape.fillOpacity ?? 0.9)*100)}%</span>
                    </div>
                  </div>
                )}

                {/* Border */}
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: cs.accent, marginBottom: 8 }}>Border</p>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                    <input type="color" value={shape.borderColor ?? cs.border}
                      onChange={e => updateS({ borderColor: e.target.value })}
                      style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${cs.border}`, cursor: "pointer", padding: 2 }}/>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 10, color: cs.textMuted, display: "block", marginBottom: 3 }}>Width</label>
                      <input type="range" min={1} max={12} step={0.5} value={shape.borderWidth ?? 3}
                        onChange={e => updateS({ borderWidth: +e.target.value })}
                        style={{ width: "100%" }}/>
                    </div>
                    <span style={{ fontSize: 11, color: cs.text, width: 20 }}>{shape.borderWidth ?? 3}px</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                    {(["solid","dashed","dotted"] as const).map(s => (
                      <button key={s} onClick={() => updateS({ borderStyle: s })}
                        style={{
                          padding: "4px 2px", borderRadius: 6, fontSize: 11, cursor: "pointer",
                          border: `1.5px solid ${(shape.borderStyle ?? "dashed") === s ? cs.accent : cs.border}`,
                          background: (shape.borderStyle ?? "dashed") === s ? cs.accentBg : "transparent",
                          color: (shape.borderStyle ?? "dashed") === s ? cs.accent : cs.textMuted,
                        }}>{s}</button>
                    ))}
                  </div>
                </div>

                {/* Corner radius for rectangle */}
                {shape.kind === "rectangle" && (
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: cs.accent, marginBottom: 8 }}>Corner Radius</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="range" min={0} max={100} step={2} value={shape.cornerRadius ?? 0}
                        onChange={e => updateS({ cornerRadius: +e.target.value })}
                        style={{ flex: 1 }}/>
                      <span style={{ fontSize: 11, color: cs.text, width: 28, textAlign: "right" }}>{shape.cornerRadius ?? 0}px</span>
                    </div>
                  </div>
                )}

              </div>

              {/* ── Generate Tables ── */}
              {!isWall && (
                <div style={{ padding: "12px 14px", borderTop: `1px solid ${cs.border}` }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: cs.accent, marginBottom: 8 }}>Generate Tables</p>
                  <label style={{ fontSize: 11, color: cs.textMuted, display: "block", marginBottom: 4 }}>How many tables?</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    placeholder="e.g. 40"
                    value={genCount}
                    onChange={e => { setGenCount(e.target.value); setGenResult(null); }}
                    style={{ width: "100%", padding: "5px 8px", borderRadius: 8, border: `1px solid ${cs.border}`, background: cs.surface2, color: cs.text, fontSize: 12, boxSizing: "border-box" as const, marginBottom: 8 }}
                  />
                  <label style={{ fontSize: 11, color: cs.textMuted, display: "block", marginBottom: 4 }}>Table diameter (cm)</label>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    <input
                      type="number"
                      min={60}
                      max={300}
                      value={genDiamCm}
                      onChange={e => { setGenDiamCm(Math.max(60, Math.min(300, parseInt(e.target.value, 10) || 150))); setGenResult(null); }}
                      style={{ flex: 1, padding: "5px 8px", borderRadius: 8, border: `1px solid ${cs.border}`, background: cs.surface2, color: cs.text, fontSize: 12, boxSizing: "border-box" as const }}
                    />
                    <select
                      onChange={e => { if (e.target.value) { setGenDiamCm(parseInt(e.target.value, 10)); setGenResult(null); } }}
                      value=""
                      style={{ padding: "5px 6px", borderRadius: 8, border: `1px solid ${cs.border}`, background: cs.surface2, color: cs.textSoft, fontSize: 11, cursor: "pointer" }}
                    >
                      <option value="">Preset</option>
                      <option value="90">Small (90cm)</option>
                      <option value="150">Medium (150cm)</option>
                      <option value="180">Large (180cm)</option>
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      const n = parseInt(genCount, 10);
                      if (!n || n < 1 || n > 200) return;
                      // Canvas px-to-ft ratio: base shape = 800×600px = room at scaleX/Y=1
                      // INFO section uses: w_ft = scaleX * 800 / 10  →  10px = 1ft
                      const PX_PER_FT = 10;
                      const CM_PER_FT = 30.48;
                      const tablePx = (genDiamCm / CM_PER_FT) * PX_PER_FT;
                      const gapPx   = (60 / CM_PER_FT) * PX_PER_FT; // 60cm gap
                      const cellPx  = tablePx + gapPx;
                      // Determine shape bounding box in canvas pixels (same ratio as INFO)
                      const BASE_W = 800, BASE_H = 600;
                      const shapeW = BASE_W * (shape.scaleX ?? 1);
                      const shapeH = BASE_H * (shape.scaleY ?? 1);
                      const PADDING = gapPx; // half-gap border padding
                      const areaW = shapeW - PADDING * 2;
                      const areaH = shapeH - PADDING * 2;
                      if (areaW <= 0 || areaH <= 0) return;
                      // Max fit given cell size
                      const maxCols = Math.max(1, Math.floor(areaW / cellPx));
                      const maxRows = Math.max(1, Math.floor(areaH / cellPx));
                      const maxFit  = maxCols * maxRows;
                      const place   = Math.min(n, maxFit);
                      // Grid layout for `place` tables
                      const aspect = areaW / areaH;
                      const cols   = Math.max(1, Math.min(maxCols, Math.round(Math.sqrt(place * aspect))));
                      const rows   = Math.max(1, Math.ceil(place / cols));
                      const startIdx = tables.length;
                      const entries: { name: string; shape: "round"; capacity: number; x: number; y: number }[] = [];
                      for (let i = 0; i < place; i++) {
                        const col = i % cols;
                        const row = Math.floor(i / cols);
                        const cx = shape.x + PADDING + cellPx * col + cellPx / 2;
                        const cy = shape.y + PADDING + cellPx * row + cellPx / 2;
                        entries.push({ name: `Table ${startIdx + i + 1}`, shape: "round", capacity: 8, x: cx, y: cy });
                      }
                      onAddTableAt(entries);
                      setGenResult({ n: place, tight: place < n, maxFit: place < n ? maxFit : undefined });
                      setGenCount("");
                    }}
                    style={{
                      width: "100%", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      border: `1px solid ${cs.accent}`, background: cs.accentBg, color: cs.accent,
                    }}
                  >Generate</button>
                  {genResult && (
                    <p style={{ marginTop: 6, fontSize: 11, color: genResult.tight ? "#f59e0b" : "#4caf7d" }}>
                      {genResult.tight
                        ? `⚠️ Only ${genResult.maxFit} tables fit — resize shape or use smaller tables`
                        : `✓ ${genResult.n} tables added`}
                    </p>
                  )}
                </div>
              )}

              {/* INFO — dimensions + area in both units */}
              {(() => {
                const BASE_W = 800, BASE_H = 600; // SVG base units for a full room shape
                const isWall = shape.kind.startsWith("wall");
                const wallW = shape.kind === "wall-v" ? 20 : 400;
                const wallH = shape.kind === "wall-v" ? 400 : 20;
                const baseW = isWall ? wallW : BASE_W;
                const baseH = isWall ? wallH : BASE_H;
                const w_ft = Math.round((shape.scaleX ?? 1) * baseW / 10);
                const h_ft = Math.round((shape.scaleY ?? 1) * baseH / 10);
                const area_sqft = w_ft * h_ft;
                const w_m = (w_ft * 0.3048).toFixed(1);
                const h_m = (h_ft * 0.3048).toFixed(1);
                const area_m2 = Math.round(area_sqft * 0.0929);
                return (
                  <div style={{ padding: "10px 14px", borderTop: `1px solid ${cs.border}` }}>
                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: cs.accent, marginBottom: 6 }}>INFO</p>
                    <p style={{ fontSize: 11, color: cs.textMuted, lineHeight: 1.7 }}>
                      <span style={{ color: cs.text, fontWeight: 600 }}>{w_ft} ft</span> <span style={{ color: cs.textMuted }}>({w_m} m)</span>
                      {" × "}
                      <span style={{ color: cs.text, fontWeight: 600 }}>{h_ft} ft</span> <span style={{ color: cs.textMuted }}>({h_m} m)</span>
                    </p>
                    {!isWall && (
                      <p style={{ fontSize: 11, color: cs.textMuted }}>
                        Area: <span style={{ color: cs.text, fontWeight: 600 }}>{area_sqft.toLocaleString()} sq ft</span> <span style={{ color: cs.textMuted }}>({area_m2} m²)</span>
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Footer actions */}
              <div style={{ padding: "10px 14px", borderTop: `1px solid ${cs.border}`, display: "flex", gap: 8 }}>
                <button
                  onClick={() => updateS({ locked: !shape.locked })}
                  style={{
                    flex: 1, padding: "7px 4px", borderRadius: 9, fontSize: 12, cursor: "pointer",
                    border: `1px solid ${shape.locked ? cs.accent : cs.border}`,
                    background: shape.locked ? cs.accentBg : "transparent",
                    color: shape.locked ? cs.accent : cs.textMuted,
                    fontWeight: 600,
                  }}>
                  {shape.locked ? "🔒 Locked" : "🔓 Lock"}
                </button>
                <button
                  onClick={() => {
                    if (confirm("Remove this shape?")) {
                      if (!activeVenue?.layout) return;
                      const newShapes = layoutShapes.filter(s => s.id !== shape.id);
                      onUpdateLayout(activeVenue.id, { ...activeVenue.layout, shapes: newShapes });
                      setSelectedShapeId(null);
                    }
                  }}
                  style={{
                    flex: 1, padding: "7px 4px", borderRadius: 9, fontSize: 12, cursor: "pointer",
                    border: "1px solid var(--danger)", background: "transparent", color: "var(--danger)", fontWeight: 600,
                  }}>
                  🗑 Delete
                </button>
              </div>
            </div>
          );
        })()}
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
