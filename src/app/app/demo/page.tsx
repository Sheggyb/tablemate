"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Table { id: string; name: string; x: number; y: number; seats: number; shape: "round" | "rectangle"; }
interface Guest { id: string; name: string; meal: "chicken" | "fish" | "vegan" | "halal"; rsvp: "confirmed" | "pending"; tableId: string | null; }

const INITIAL_TABLES: Table[] = [
  { id: "t1", name: "Bride's Family",  x: 160, y: 200, seats: 8,  shape: "round" },
  { id: "t2", name: "Groom's Family",  x: 430, y: 200, seats: 8,  shape: "round" },
  { id: "t3", name: "Friends",         x: 160, y: 430, seats: 8,  shape: "round" },
  { id: "t4", name: "Work Colleagues", x: 430, y: 430, seats: 10, shape: "rectangle" },
];

const INITIAL_GUESTS: Guest[] = [
  { id: "g1",  name: "Emma Johnson",   meal: "chicken", rsvp: "confirmed", tableId: null },
  { id: "g2",  name: "James Johnson",  meal: "fish",    rsvp: "confirmed", tableId: null },
  { id: "g3",  name: "Sophie Davis",   meal: "vegan",   rsvp: "confirmed", tableId: null },
  { id: "g4",  name: "Oliver Davis",   meal: "chicken", rsvp: "confirmed", tableId: null },
  { id: "g5",  name: "Mia Taylor",     meal: "halal",   rsvp: "confirmed", tableId: null },
  { id: "g6",  name: "Noah Taylor",    meal: "chicken", rsvp: "pending",   tableId: null },
  { id: "g7",  name: "Ava Wilson",     meal: "fish",    rsvp: "confirmed", tableId: null },
  { id: "g8",  name: "Liam Chen",      meal: "chicken", rsvp: "confirmed", tableId: null },
  { id: "g9",  name: "Isabella Chen",  meal: "vegan",   rsvp: "confirmed", tableId: null },
  { id: "g10", name: "Lucas Martin",   meal: "chicken", rsvp: "confirmed", tableId: null },
];

const MEAL_EMOJI: Record<string, string> = { chicken: "🍗", fish: "🐟", vegan: "🌿", halal: "🥩" };
const MEAL_COLOR: Record<string, string> = { chicken: "#C9956E", fish: "#6E9EC9", vegan: "#6EC98A", halal: "#9E8AC9" };
let nextId = 5;

export default function DemoPage() {
  const [dark, setDark]     = useState(false);
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [guests, setGuests] = useState<Guest[]>(INITIAL_GUESTS);

  // ── Unified drag state (all via window events) ────────────────────────────
  type DragState =
    | { type: "none" }
    | { type: "table"; id: string; offX: number; offY: number }
    | { type: "guest"; id: string };

  const dragRef    = useRef<DragState>({ type: "none" });
  const [ghostPos, setGhostPos]       = useState({ x: 0, y: 0 });
  const [draggingGuest, setDraggingGuest] = useState<string | null>(null);
  const [hoveredTable, setHoveredTable]   = useState<string | null>(null);

  const svgRef    = useRef<SVGSVGElement>(null);
  const tablesRef = useRef(tables);
  tablesRef.current = tables;
  const guestsRef = useRef(guests);
  guestsRef.current = guests;

  // Inherit theme
  useEffect(() => {
    const saved = localStorage.getItem("tm-theme");
    const isDark = saved === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("tm-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  // ── Window-level drag events ───────────────────────────────────────────────
  useEffect(() => {
    const getSvgPoint = (e: MouseEvent) => {
      const svg = svgRef.current;
      if (!svg) return null;
      const r = svg.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const getHitTable = (px: number, py: number) =>
      tablesRef.current.find(t => {
        const dx = px - t.x, dy = py - t.y;
        return t.shape === "round"
          ? dx * dx + dy * dy < 56 * 56
          : Math.abs(dx) < 82 && Math.abs(dy) < 42;
      });

    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (d.type === "none") return;

      if (d.type === "table") {
        const pt = getSvgPoint(e);
        if (!pt) return;
        const nx = Math.max(70, Math.min(650, pt.x - d.offX));
        const ny = Math.max(70, Math.min(560, pt.y - d.offY));
        setTables(prev => prev.map(t => t.id === d.id ? { ...t, x: nx, y: ny } : t));
      }

      if (d.type === "guest") {
        setGhostPos({ x: e.clientX, y: e.clientY });
        const pt = getSvgPoint(e);
        const hit = pt ? getHitTable(pt.x, pt.y) : undefined;
        setHoveredTable(hit?.id ?? null);
      }
    };

    const onUp = (e: MouseEvent) => {
      const d = dragRef.current;
      if (d.type === "guest") {
        const pt = getSvgPoint(e);
        if (pt) {
          const hit = getHitTable(pt.x, pt.y);
          if (hit) {
            const seated = guestsRef.current.filter(g => g.tableId === hit.id).length;
            if (seated < hit.seats) {
              setGuests(gs => gs.map(g => g.id === (d as { type:"guest"; id:string }).id ? { ...g, tableId: hit.id } : g));
            }
          }
        }
        setDraggingGuest(null);
        setHoveredTable(null);
      }
      dragRef.current = { type: "none" };
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const startTableDrag = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const tbl = tablesRef.current.find(t => t.id === id)!;
    dragRef.current = { type: "table", id, offX: e.clientX - r.left - tbl.x, offY: e.clientY - r.top - tbl.y };
  };

  const startGuestDrag = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    dragRef.current = { type: "guest", id };
    setDraggingGuest(id);
    setGhostPos({ x: e.clientX, y: e.clientY });
  };

  const removeTable = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    setTables(prev => prev.filter(t => t.id !== id));
    setGuests(prev => prev.map(g => g.tableId === id ? { ...g, tableId: null } : g));
  };

  const unseatGuest = (id: string) =>
    setGuests(prev => prev.map(g => g.id === id ? { ...g, tableId: null } : g));

  const addTable = () => {
    setTables(prev => [...prev, {
      id: `t${nextId++}`, name: `Table ${nextId - 1}`,
      x: 280, y: 310, seats: 8, shape: "round",
    }]);
  };

  // ── Theme colours ─────────────────────────────────────────────────────────
  const bg       = dark ? "#1A1720" : "#F8F4F0";
  const card     = dark ? "#26222D" : "#FFFFFF";
  const border   = dark ? "#3A3540" : "#EDE8E0";
  const text     = dark ? "#F0EBE8" : "#2A2328";
  const sub      = dark ? "#9B9098" : "#6B6068";
  const canvasBg = dark ? "#1E1A25" : "#FDFBF8";

  const unassigned = guests.filter(g => g.tableId === null);
  const seated     = guests.filter(g => g.tableId !== null);
  const draggingGuestObj = guests.find(g => g.id === draggingGuest);

  return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", flexDirection: "column", fontFamily: "Inter, sans-serif", userSelect: "none" }}>

      {/* Drag ghost */}
      {draggingGuestObj && (
        <div style={{
          position: "fixed", left: ghostPos.x - 52, top: ghostPos.y - 16, zIndex: 9999,
          padding: "4px 12px", borderRadius: 8, pointerEvents: "none",
          background: dark ? "#3A2A1F" : "#FDF4EC", border: "2px solid #C9956E",
          fontSize: 12, fontWeight: 700, color: text, boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          whiteSpace: "nowrap",
        }}>
          {MEAL_EMOJI[draggingGuestObj.meal]} {draggingGuestObj.name.split(" ")[0]}
        </div>
      )}

      {/* Header */}
      <header style={{ background: card, borderBottom: `1px solid ${border}`, padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
            <span style={{ color: "#C9956E", fontSize: 18 }}>♥</span>
            <span style={{ fontFamily: "Georgia, serif", fontWeight: 600, color: text, fontSize: 16 }}>TableMate</span>
          </Link>
          <span style={{ color: border }}>·</span>
          <span style={{ fontSize: 12, color: "#C9956E", fontWeight: 500, background: dark ? "#2A1F18" : "#FDF4EC", border: `1px solid ${dark ? "#5A3525" : "#EDD5BC"}`, padding: "2px 10px", borderRadius: 999 }}>
            ✨ Demo Mode
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={toggleDark} style={{ background: "none", border: `1px solid ${border}`, borderRadius: 8, padding: "5px 12px", cursor: "pointer", color: sub, fontSize: 13 }}>
            {dark ? "☀️ Light" : "🌙 Dark"}
          </button>
          <Link href="/auth/signup" style={{ padding: "7px 16px", background: "#C9956E", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            Sign up free →
          </Link>
        </div>
      </header>

      {/* Hint banner */}
      <div style={{ background: dark ? "#2A1F18" : "#FDF4EC", borderBottom: `1px solid ${dark ? "#5A3525" : "#EDD5BC"}`, padding: "8px 24px", fontSize: 13, color: dark ? "#E8C9A0" : "#9B6040", textAlign: "center" }}>
        👋 <strong>Drag guests</strong> from the sidebar onto tables · <strong>Drag tables</strong> to rearrange · <strong>×</strong> to remove · <strong>+ Add Table</strong>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Canvas */}
        <div style={{ flex: 1, padding: 16, overflow: "auto" }}>
          <div style={{ background: canvasBg, borderRadius: 16, border: `1px solid ${border}`, position: "relative", height: 640, overflow: "hidden" }}>
            {/* Dot grid */}
            <div style={{ position: "absolute", inset: 0, opacity: 0.15, backgroundImage: `radial-gradient(circle, ${dark ? "#888" : "#DDD7D0"} 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />

            <svg ref={svgRef} style={{ width: "100%", height: "100%", display: "block" }}>
              {/* Stage */}
              <rect x="230" y="16" width="240" height="44" rx="8" fill={dark ? "#2A2030" : "#FDF4EC"} stroke={dark ? "#5A3525" : "#EDD5BC"} strokeWidth="1.5" />
              <text x="350" y="44" textAnchor="middle" fontSize="12" fill={sub} fontFamily="Georgia, serif">Stage / Dance Floor</text>

              {/* Tables */}
              {tables.map(tbl => {
                const tSeated  = guests.filter(g => g.tableId === tbl.id);
                const isHov    = hoveredTable === tbl.id;
                const isRound  = tbl.shape === "round";
                const fill     = dark ? (isHov ? "#3A2A1F" : "#26222D") : (isHov ? "#FDF4EC" : "#FFFFFF");
                const stroke   = isHov ? "#C9956E" : (dark ? "#4A4050" : "#DDD7D0");

                return (
                  <g key={tbl.id}
                    transform={`translate(${tbl.x},${tbl.y})`}
                    onMouseDown={e => startTableDrag(e, tbl.id)}
                    style={{ cursor: "grab" }}>

                    {isRound
                      ? <circle cx={0} cy={0} r={54} fill={fill} stroke={stroke} strokeWidth={isHov ? 2.5 : 1.5} />
                      : <rect x={-82} y={-40} width={164} height={80} rx="10" fill={fill} stroke={stroke} strokeWidth={isHov ? 2.5 : 1.5} />}

                    <text textAnchor="middle" y={-10} fontSize="11" fontWeight="600" fill={text} fontFamily="Georgia, serif">{tbl.name}</text>
                    <text textAnchor="middle" y={6}   fontSize="10" fill={sub}>{tSeated.length}/{tbl.seats} guests</text>

                    {/* Meal dots */}
                    <g transform={`translate(${-Math.min(tSeated.length, 6) * 5},22)`}>
                      {tSeated.slice(0, 6).map((g, i) => (
                        <circle key={g.id} cx={i * 10} cy={0} r={4} fill={MEAL_COLOR[g.meal] ?? "#DDD7D0"} />
                      ))}
                    </g>

                    {/* Remove × */}
                    <g
                      transform={isRound ? "translate(42,-42)" : "translate(74,-32)"}
                      onMouseDown={e => removeTable(e, tbl.id)}
                      style={{ cursor: "pointer" }}>
                      <circle cx={0} cy={0} r={11} fill={dark ? "#3A2A2A" : "#FEE2E2"} stroke={dark ? "#C96E6E" : "#FECACA"} strokeWidth="1" />
                      <text textAnchor="middle" dominantBaseline="central" fontSize="13" fill="#C96E6E" fontWeight="bold">×</text>
                    </g>
                  </g>
                );
              })}
            </svg>

            {/* Add Table */}
            <button onClick={addTable} style={{
              position: "absolute", bottom: 16, left: 16,
              background: dark ? "#2A2030" : "#fff", border: `1px solid ${border}`,
              borderRadius: 10, padding: "8px 16px", cursor: "pointer",
              fontSize: 13, color: text, fontWeight: 500,
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            }}>
              + Add Table
            </button>
          </div>
          <p style={{ textAlign: "center", fontSize: 12, color: sub, marginTop: 8 }}>
            Drag guests from the right sidebar → drop onto a table to seat them
          </p>
        </div>

        {/* Sidebar */}
        <div style={{ width: 240, borderLeft: `1px solid ${border}`, background: card, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${border}` }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: text, margin: 0 }}>👥 Guest List</p>
            <p style={{ fontSize: 12, color: sub, margin: "2px 0 0" }}>{unassigned.length} unassigned · {seated.length} seated</p>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
            {/* Unassigned */}
            {unassigned.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: sub }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🎉</div>
                <p style={{ fontSize: 12, margin: 0 }}>All guests seated!</p>
              </div>
            ) : (
              unassigned.map(g => (
                <div key={g.id}
                  onMouseDown={e => startGuestDrag(e, g.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 10px", marginBottom: 4,
                    background: draggingGuest === g.id ? (dark ? "#3A2A1F" : "#FDF4EC") : (dark ? "#1E1A25" : "#FDFBF8"),
                    border: `1px solid ${draggingGuest === g.id ? "#C9956E" : border}`,
                    borderRadius: 8, cursor: "grab",
                    opacity: draggingGuest === g.id ? 0.35 : 1,
                    transition: "opacity 0.1s, border-color 0.1s",
                  }}>
                  <span style={{ fontSize: 15 }}>{MEAL_EMOJI[g.meal]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: g.rsvp === "confirmed" ? "#6EC98A" : "#E8C96E" }}>{g.rsvp}</p>
                  </div>
                  <span style={{ fontSize: 11, color: sub, letterSpacing: 1 }}>⠿</span>
                </div>
              ))
            )}

            {/* Seated */}
            {seated.length > 0 && (
              <>
                <div style={{ borderTop: `1px solid ${border}`, margin: "12px 0 8px", paddingTop: 8 }}>
                  <p style={{ fontSize: 12, color: sub, margin: 0, fontWeight: 600 }}>Seated ✓</p>
                </div>
                {seated.map(g => {
                  const tbl = tables.find(t => t.id === g.tableId);
                  return (
                    <div key={g.id} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "7px 10px", marginBottom: 4,
                      background: dark ? "#1E1A25" : "#FDFBF8",
                      border: `1px solid ${border}`,
                      borderRadius: 8, opacity: 0.85,
                    }}>
                      <span style={{ fontSize: 13 }}>{MEAL_EMOJI[g.meal]}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</p>
                        <p style={{ margin: 0, fontSize: 11, color: sub }}>{tbl?.name ?? "—"}</p>
                      </div>
                      <button onClick={() => unseatGuest(g.id)} title="Move back" style={{ background: "none", border: "none", cursor: "pointer", color: sub, fontSize: 14, padding: "0 2px", lineHeight: 1 }}>↩</button>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Meal legend */}
          <div style={{ padding: "12px 16px", borderTop: `1px solid ${border}` }}>
            <p style={{ fontSize: 11, color: sub, margin: "0 0 6px", fontWeight: 600 }}>MEAL LEGEND</p>
            {Object.entries(MEAL_EMOJI).map(([meal, emoji]) => (
              <div key={meal} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 12 }}>{emoji}</span>
                <span style={{ fontSize: 11, color: sub, textTransform: "capitalize" }}>{meal}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{ background: "#C9956E", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <p style={{ margin: 0, color: "#fff", fontWeight: 600, fontSize: 14 }}>Ready to plan your own wedding?</p>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.8)", fontSize: 12 }}>Sign up free — no credit card required</p>
        </div>
        <Link href="/auth/signup" style={{ padding: "9px 20px", background: "#fff", color: "#C9956E", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
          Get Started Free →
        </Link>
      </div>
    </div>
  );
}
