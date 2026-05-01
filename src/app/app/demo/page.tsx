"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

interface Table { id: string; name: string; x: number; y: number; seats: number; shape: "round" | "rectangle"; }
interface Guest { id: string; name: string; meal: "chicken" | "fish" | "vegan" | "halal"; rsvp: "confirmed" | "pending"; tableId: string | null; }

const INITIAL_TABLES: Table[] = [
  { id: "t1", name: "Bride's Family",  x: 160, y: 180, seats: 8,  shape: "round" },
  { id: "t2", name: "Groom's Family",  x: 420, y: 180, seats: 8,  shape: "round" },
  { id: "t3", name: "Friends",         x: 160, y: 420, seats: 8,  shape: "round" },
  { id: "t4", name: "Work Colleagues", x: 420, y: 420, seats: 10, shape: "rectangle" },
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

const mealEmoji: Record<string, string> = { chicken: "🍗", fish: "🐟", vegan: "🌿", halal: "🥩" };
const mealColor: Record<string, string> = { chicken: "#C9956E", fish: "#6E9EC9", vegan: "#6EC98A", halal: "#9E8AC9" };
let nextTableId = 5;

export default function DemoPage() {
  const [dark, setDark] = useState(false);
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [guests, setGuests] = useState<Guest[]>(INITIAL_GUESTS);

  // drag state stored in refs to avoid stale closures in window listeners
  const draggingTableRef = useRef<string | null>(null);
  const tableOffsetRef = useRef({ x: 0, y: 0 });
  const draggingGuestRef = useRef<string | null>(null);

  const [draggingGuestId, setDraggingGuestId] = useState<string | null>(null);
  const [guestScreenPos, setGuestScreenPos] = useState({ x: 0, y: 0 });
  const [hoveredTable, setHoveredTable] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const tablesRef = useRef(tables);
  useEffect(() => { tablesRef.current = tables; }, [tables]);
  const guestsRef = useRef(guests);
  useEffect(() => { guestsRef.current = guests; }, [guests]);

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

  // Window-level mouse move & up
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      // Table drag
      if (draggingTableRef.current) {
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const nx = Math.max(60, Math.min(700, mx - tableOffsetRef.current.x));
        const ny = Math.max(60, Math.min(560, my - tableOffsetRef.current.y));
        setTables(prev => prev.map(t => t.id === draggingTableRef.current ? { ...t, x: nx, y: ny } : t));
      }
      // Guest drag
      if (draggingGuestRef.current) {
        setGuestScreenPos({ x: e.clientX, y: e.clientY });
        const svg = svgRef.current;
        if (svg) {
          const rect = svg.getBoundingClientRect();
          const mx = e.clientX - rect.left;
          const my = e.clientY - rect.top;
          const hit = tablesRef.current.find(t => {
            const dx = mx - t.x, dy = my - t.y;
            return t.shape === "round"
              ? dx * dx + dy * dy < 58 * 58
              : Math.abs(dx) < 80 && Math.abs(dy) < 40;
          });
          setHoveredTable(hit?.id ?? null);
        }
      }
    };
    const onUp = () => {
      draggingTableRef.current = null;
      if (draggingGuestRef.current) {
        const gid = draggingGuestRef.current;
        const hovered = hoveredTable; // captured from closure -- use ref below
        setHoveredTable(prev => {
          if (prev && gid) {
            const tbl = tablesRef.current.find(t => t.id === prev);
            if (tbl) {
              const seated = guestsRef.current.filter(g => g.tableId === prev).length;
              if (seated < tbl.seats) {
                setGuests(gs => gs.map(g => g.id === gid ? { ...g, tableId: prev } : g));
              }
            }
          }
          return null;
        });
        draggingGuestRef.current = null;
        setDraggingGuestId(null);
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [hoveredTable]);

  const onTableMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    if (draggingGuestRef.current) return;
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const tbl = tablesRef.current.find(t => t.id === id)!;
    draggingTableRef.current = id;
    tableOffsetRef.current = { x: e.clientX - rect.left - tbl.x, y: e.clientY - rect.top - tbl.y };
  }, []);

  const onGuestMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    draggingGuestRef.current = id;
    setDraggingGuestId(id);
    setGuestScreenPos({ x: e.clientX, y: e.clientY });
  }, []);

  const unseatGuest = (id: string) => setGuests(prev => prev.map(g => g.id === id ? { ...g, tableId: null } : g));

  const addTable = () => {
    setTables(prev => [...prev, { id: `t${nextTableId++}`, name: `Table ${nextTableId - 1}`, x: 280, y: 300, seats: 8, shape: "round" }]);
  };
  const removeTable = (id: string) => {
    setTables(prev => prev.filter(t => t.id !== id));
    setGuests(prev => prev.map(g => g.tableId === id ? { ...g, tableId: null } : g));
  };

  const unassigned = guests.filter(g => g.tableId === null);
  const bg = dark ? "#1A1720" : "#F8F4F0";
  const card = dark ? "#26222D" : "#FFFFFF";
  const border = dark ? "#3A3540" : "#EDE8E0";
  const text = dark ? "#F0EBE8" : "#2A2328";
  const sub = dark ? "#9B9098" : "#6B6068";
  const canvasBg = dark ? "#1E1A25" : "#FDFBF8";

  return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", flexDirection: "column", fontFamily: "Inter, sans-serif", userSelect: "none" }}>

      {/* Header */}
      <header style={{ background: card, borderBottom: `1px solid ${border}`, padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
            <span style={{ color: "#C9956E", fontSize: 18 }}>♥</span>
            <span style={{ fontFamily: "Georgia, serif", fontWeight: 600, color: text, fontSize: 16 }}>TableMate</span>
          </Link>
          <span style={{ color: border }}>·</span>
          <span style={{ fontSize: 12, color: "#C9956E", fontWeight: 500, background: dark ? "#2A1F18" : "#FDF4EC", border: `1px solid ${dark ? "#5A3525" : "#EDD5BC"}`, padding: "2px 10px", borderRadius: 999 }}>Demo Mode</span>
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
        👋 <strong>Try it out:</strong> Drag guests from the sidebar onto tables · Drag tables to rearrange · Add or remove tables · No account needed
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Canvas */}
        <div style={{ flex: 1, padding: 16, overflow: "auto", position: "relative" }}>
          <div style={{ background: canvasBg, borderRadius: 16, border: `1px solid ${border}`, position: "relative", height: 640, overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, opacity: 0.15, backgroundImage: `radial-gradient(circle, ${dark ? "#888" : "#DDD7D0"} 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
            <svg ref={svgRef} style={{ width: "100%", height: "100%", cursor: "default" }}>
              {/* Stage */}
              <rect x="240" y="16" width="220" height="44" rx="8" fill={dark ? "#2A2030" : "#FDF4EC"} stroke={dark ? "#5A3525" : "#EDD5BC"} strokeWidth="1.5" />
              <text x="350" y="44" textAnchor="middle" fontSize="12" fill={sub} fontFamily="Georgia, serif">Stage / Dance Floor</text>

              {tables.map(tbl => {
                const seated = guests.filter(g => g.tableId === tbl.id);
                const isHovered = hoveredTable === tbl.id;
                const isRound = tbl.shape === "round";
                const fill = dark ? (isHovered ? "#3A2A1F" : "#26222D") : (isHovered ? "#FDF4EC" : "#FFFFFF");
                const stroke = isHovered ? "#C9956E" : (dark ? "#4A4050" : "#DDD7D0");
                return (
                  <g key={tbl.id} transform={`translate(${tbl.x},${tbl.y})`}
                    onMouseDown={e => onTableMouseDown(e, tbl.id)}
                    style={{ cursor: "grab" }}>
                    {isRound
                      ? <circle cx={0} cy={0} r={54} fill={fill} stroke={stroke} strokeWidth={isHovered ? 2.5 : 1.5} />
                      : <rect x={-80} y={-38} width={160} height={76} rx="10" fill={fill} stroke={stroke} strokeWidth={isHovered ? 2.5 : 1.5} />}
                    <text textAnchor="middle" y={-10} fontSize="11" fontWeight="600" fill={text} fontFamily="Georgia, serif">{tbl.name}</text>
                    <text textAnchor="middle" y={6} fontSize="10" fill={sub}>{seated.length}/{tbl.seats} guests</text>
                    <g transform={`translate(${-Math.min(seated.length, 6) * 5},20)`}>
                      {seated.slice(0, 6).map((g, i) => (
                        <circle key={g.id} cx={i * 10} cy={0} r={4} fill={mealColor[g.meal] ?? "#DDD7D0"} />
                      ))}
                    </g>
                    {/* Remove button */}
                    <g transform={isRound ? "translate(40,-40)" : "translate(72,-30)"} style={{ cursor: "pointer" }}
                      onMouseDown={e => { e.stopPropagation(); removeTable(tbl.id); }}>
                      <circle cx={0} cy={0} r={10} fill={dark ? "#3A2A2A" : "#FEE2E2"} stroke={dark ? "#C96E6E" : "#FECACA"} strokeWidth="1" />
                      <text textAnchor="middle" y={4} fontSize="11" fill="#C96E6E">×</text>
                    </g>
                  </g>
                );
              })}

              {/* Guest ghost inside SVG (positioned relative to SVG) */}
              {draggingGuestId && (() => {
                const g = guests.find(x => x.id === draggingGuestId);
                const svg = svgRef.current;
                if (!g || !svg) return null;
                const rect = svg.getBoundingClientRect();
                const lx = guestScreenPos.x - rect.left;
                const ly = guestScreenPos.y - rect.top;
                return (
                  <g transform={`translate(${lx},${ly})`} style={{ pointerEvents: "none" }}>
                    <rect x={-50} y={-14} width={100} height={28} rx="6" fill={dark ? "#3A2A1F" : "#FDF4EC"} stroke="#C9956E" strokeWidth="2" />
                    <text textAnchor="middle" y={4} fontSize="11" fontWeight="600" fill={text}>{g.name.split(" ")[0]}</text>
                  </g>
                );
              })()}
            </svg>

            <button onClick={addTable} style={{
              position: "absolute", bottom: 16, left: 16,
              background: dark ? "#2A2030" : "#fff", border: `1px solid ${border}`,
              borderRadius: 10, padding: "8px 16px", cursor: "pointer",
              fontSize: 13, color: text, fontWeight: 500,
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
            }}>
              + Add Table
            </button>
          </div>
          <p style={{ textAlign: "center", fontSize: 12, color: sub, marginTop: 8 }}>
            Drag tables to rearrange · Drag guests from sidebar to seat them · Click × to remove a table
          </p>
        </div>

        {/* Sidebar */}
        <div style={{ width: 240, borderLeft: `1px solid ${border}`, background: card, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${border}` }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: text, margin: 0 }}>👥 Guest List</p>
            <p style={{ fontSize: 12, color: sub, margin: "2px 0 0" }}>{unassigned.length} unassigned · {guests.length - unassigned.length} seated</p>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
            {unassigned.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: sub }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🎉</div>
                <p style={{ fontSize: 12 }}>All guests seated!</p>
              </div>
            ) : (
              unassigned.map(g => (
                <div key={g.id} onMouseDown={e => onGuestMouseDown(e, g.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 10px", marginBottom: 4,
                    background: draggingGuestId === g.id ? (dark ? "#3A2A1F" : "#FDF4EC") : (dark ? "#1E1A25" : "#FDFBF8"),
                    border: `1px solid ${draggingGuestId === g.id ? "#C9956E" : border}`,
                    borderRadius: 8, cursor: "grab"
                  }}>
                  <span style={{ fontSize: 14 }}>{mealEmoji[g.meal]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: g.rsvp === "confirmed" ? "#6EC98A" : "#E8C96E" }}>{g.rsvp}</p>
                  </div>
                  <span style={{ fontSize: 10, color: sub }}>⠿</span>
                </div>
              ))
            )}

            {guests.filter(g => g.tableId !== null).length > 0 && (
              <>
                <div style={{ borderTop: `1px solid ${border}`, margin: "12px 0 8px", paddingTop: 8 }}>
                  <p style={{ fontSize: 12, color: sub, margin: 0, fontWeight: 600 }}>✓ Seated</p>
                </div>
                {guests.filter(g => g.tableId !== null).map(g => {
                  const tbl = tables.find(t => t.id === g.tableId);
                  return (
                    <div key={g.id} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "7px 10px", marginBottom: 4,
                      background: dark ? "#1E1A25" : "#FDFBF8",
                      border: `1px solid ${border}`, borderRadius: 8, opacity: 0.8
                    }}>
                      <span style={{ fontSize: 13 }}>{mealEmoji[g.meal]}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.name}</p>
                        <p style={{ margin: 0, fontSize: 11, color: sub }}>{tbl?.name ?? "—"}</p>
                      </div>
                      <button onClick={() => unseatGuest(g.id)} style={{ background: "none", border: "none", cursor: "pointer", color: sub, fontSize: 14, padding: "0 2px", lineHeight: 1 }} title="Unseat">↩</button>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <div style={{ padding: "12px 16px", borderTop: `1px solid ${border}` }}>
            <p style={{ fontSize: 11, color: sub, margin: "0 0 6px", fontWeight: 600 }}>MEAL LEGEND</p>
            {Object.entries(mealEmoji).map(([meal, emoji]) => (
              <div key={meal} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 12 }}>{emoji}</span>
                <span style={{ fontSize: 11, color: sub, textTransform: "capitalize" }}>{meal}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: "#C9956E", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <p style={{ margin: 0, color: "#fff", fontWeight: 600, fontSize: 14 }}>Ready to plan your own wedding?</p>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.8)", fontSize: 12 }}>Sign up free — no credit card required</p>
        </div>
        <Link href="/auth/signup" style={{ padding: "9px 20px", background: "#fff", color: "#C9956E", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
          Get Started Free →
        </Link>
      </div>

      {/* Global drag ghost (outside SVG, fixed to screen) */}
      {draggingGuestId && (() => {
        const g = guests.find(x => x.id === draggingGuestId);
        if (!g) return null;
        return (
          <div style={{
            position: "fixed", left: guestScreenPos.x - 50, top: guestScreenPos.y - 14,
            width: 100, height: 28, background: dark ? "#3A2A1F" : "#FDF4EC",
            border: "2px solid #C9956E", borderRadius: 6, display: "flex",
            alignItems: "center", justifyContent: "center", pointerEvents: "none",
            zIndex: 9999, fontSize: 12, fontWeight: 600, color: dark ? "#F0EBE8" : "#2A2328"
          }}>
            {mealEmoji[g.meal]} {g.name.split(" ")[0]}
          </div>
        );
      })()}
    </div>
  );
}
