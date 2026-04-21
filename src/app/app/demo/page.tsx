"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

// ── Demo mock data ─────────────────────────────────────────────────────────────
const DEMO_TABLES = [
  { id: "t1", name: "Table 1 — Bride's Family", x: 120, y: 130, seats: 8, shape: "round" },
  { id: "t2", name: "Table 2 — Groom's Family", x: 340, y: 130, seats: 8, shape: "round" },
  { id: "t3", name: "Table 3 — College Friends", x: 560, y: 130, seats: 6, shape: "round" },
  { id: "t4", name: "Table 4 — Work Colleagues", x: 120, y: 340, seats: 10, shape: "round" },
  { id: "t5", name: "Table 5 — Childhood Friends", x: 340, y: 340, seats: 8, shape: "round" },
  { id: "t6", name: "Head Table", x: 340, y: 540, seats: 12, shape: "banquet" },
];

const DEMO_GUESTS = [
  { id: "g1", name: "Emma Johnson", table: "t1", meal: "chicken", rsvp: "confirmed" },
  { id: "g2", name: "James Johnson", table: "t1", meal: "fish", rsvp: "confirmed" },
  { id: "g3", name: "Sophie Brown", table: "t1", meal: "vegan", rsvp: "confirmed" },
  { id: "g4", name: "Oliver Brown", table: "t1", meal: "chicken", rsvp: "confirmed" },
  { id: "g5", name: "Mia Davis", table: "t2", meal: "chicken", rsvp: "confirmed" },
  { id: "g6", name: "Noah Davis", table: "t2", meal: "fish", rsvp: "confirmed" },
  { id: "g7", name: "Ava Wilson", table: "t2", meal: "chicken", rsvp: "pending" },
  { id: "g8", name: "Liam Wilson", table: "t2", meal: "vegan", rsvp: "confirmed" },
  { id: "g9", name: "Isabella Moore", table: "t3", meal: "fish", rsvp: "confirmed" },
  { id: "g10", name: "Lucas Taylor", table: "t3", meal: "chicken", rsvp: "confirmed" },
  { id: "g11", name: "Charlotte Anderson", table: "t3", meal: "chicken", rsvp: "declined" },
  { id: "g12", name: "Ethan Thomas", table: "t4", meal: "chicken", rsvp: "confirmed" },
  { id: "g13", name: "Amelia Jackson", table: "t4", meal: "vegan", rsvp: "confirmed" },
  { id: "g14", name: "Benjamin White", table: "t4", meal: "fish", rsvp: "pending" },
  { id: "g15", name: "Harper Harris", table: "t5", meal: "chicken", rsvp: "confirmed" },
  { id: "g16", name: "Alexander Martin", table: "t5", meal: "chicken", rsvp: "confirmed" },
  { id: "g17", name: "Evelyn Thompson", table: "t6", meal: "chicken", rsvp: "confirmed" },
  { id: "g18", name: "Daniel Garcia", table: "t6", meal: "fish", rsvp: "confirmed" },
];

const mealColors: Record<string, string> = {
  chicken: "#C9956E",
  fish: "#6E9EC9",
  vegan: "#6EC98A",
};
const rsvpColors: Record<string, string> = {
  confirmed: "#6EC98A",
  pending: "#E8C96E",
  declined: "#C96E6E",
};

export default function DemoPage() {
  const [tables, setTables] = useState(DEMO_TABLES);
  const [guests] = useState(DEMO_GUESTS);
  const [activeTab, setActiveTab] = useState<"chart" | "guests">("chart");
  const [dragging, setDragging] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const tbl = tables.find(t => t.id === id)!;
    setDragging(id);
    setOffset({ x: e.clientX - rect.left - tbl.x, y: e.clientY - rect.top - tbl.y });
    setSelectedTable(id);
  }, [tables]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const nx = Math.max(40, Math.min(720, e.clientX - rect.left - offset.x));
    const ny = Math.max(40, Math.min(620, e.clientY - rect.top - offset.y));
    setTables(prev => prev.map(t => t.id === dragging ? { ...t, x: nx, y: ny } : t));
  }, [dragging, offset]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  const confirmed = guests.filter(g => g.rsvp === "confirmed").length;
  const pending = guests.filter(g => g.rsvp === "pending").length;
  const declined = guests.filter(g => g.rsvp === "declined").length;

  const selectedGuests = selectedTable ? guests.filter(g => g.table === selectedTable) : [];
  const selectedTbl = tables.find(t => t.id === selectedTable);

  return (
    <div className="min-h-screen bg-[#FDFBF8] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[#EDE8E0] px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-[#C9956E]">♥</span>
            <span className="font-playfair font-semibold text-[#2A2328]">TableMate</span>
          </Link>
          <span className="text-[#DDD7D0]">·</span>
          <span className="text-sm text-[#C9956E] font-medium bg-[#FDF4EC] border border-[#EDD5BC] px-2 py-0.5 rounded-full">Demo Mode</span>
          <span className="text-sm text-[#6B6068] hidden md:block">— Sarah & Tom's Wedding</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#9B9098] hidden md:block">Changes don't save in demo</span>
          <Link href="/signup" className="px-4 py-2 bg-[#C9956E] hover:bg-[#B8845D] text-white text-sm font-medium rounded-lg transition-colors">
            Create My Wedding →
          </Link>
        </div>
      </header>

      {/* Stats bar */}
      <div className="bg-white border-b border-[#EDE8E0] px-6 py-3 flex gap-6 overflow-x-auto">
        {[
          { label: "Guests", value: guests.length, color: "#2A2328" },
          { label: "Confirmed", value: confirmed, color: "#6EC98A" },
          { label: "Pending", value: pending, color: "#E8C96E" },
          { label: "Declined", value: declined, color: "#C96E6E" },
          { label: "Tables", value: tables.length, color: "#C9956E" },
          { label: "Seated", value: guests.filter(g => g.table).length, color: "#6E9EC9" },
        ].map(s => (
          <div key={s.label} className="flex flex-col items-center min-w-[60px]">
            <span className="text-xl font-bold" style={{ color: s.color }}>{s.value}</span>
            <span className="text-xs text-[#9B9098]">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-[#EDE8E0] px-6 flex gap-1">
        {(["chart", "guests"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? "border-[#C9956E] text-[#C9956E]"
                : "border-transparent text-[#6B6068] hover:text-[#2A2328]"
            }`}
          >
            {tab === "chart" ? "🪑 Seating Chart" : "👥 Guest List"}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === "chart" ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Canvas */}
            <div className="flex-1 overflow-auto p-4 bg-[#F8F4F0]">
              <div className="relative bg-white rounded-2xl border border-[#EDE8E0] shadow-sm overflow-hidden" style={{ height: 680 }}>
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle, #DDD7D0 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
                <svg
                  ref={svgRef}
                  className="w-full h-full cursor-default select-none"
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {/* Stage */}
                  <rect x="290" y="20" width="200" height="50" rx="8" fill="#FDF4EC" stroke="#EDD5BC" strokeWidth="1.5" />
                  <text x="390" y="51" textAnchor="middle" fontSize="12" fill="#9B9098" fontFamily="Georgia, serif">Stage / Dance Floor</text>

                  {tables.map(tbl => {
                    const tGuests = guests.filter(g => g.table === tbl.id);
                    const isSelected = selectedTable === tbl.id;
                    const isBanquet = tbl.shape === "banquet";
                    const r = isBanquet ? undefined : 52;
                    return (
                      <g
                        key={tbl.id}
                        transform={`translate(${tbl.x},${tbl.y})`}
                        onMouseDown={e => handleMouseDown(e, tbl.id)}
                        style={{ cursor: dragging === tbl.id ? "grabbing" : "grab" }}
                      >
                        {isBanquet ? (
                          <rect x={-90} y={-30} width={180} height={60} rx="8"
                            fill={isSelected ? "#FDF4EC" : "white"}
                            stroke={isSelected ? "#C9956E" : "#DDD7D0"}
                            strokeWidth={isSelected ? 2 : 1.5}
                          />
                        ) : (
                          <circle cx={0} cy={0} r={r}
                            fill={isSelected ? "#FDF4EC" : "white"}
                            stroke={isSelected ? "#C9956E" : "#DDD7D0"}
                            strokeWidth={isSelected ? 2 : 1.5}
                          />
                        )}
                        <text textAnchor="middle" y={-8} fontSize="11" fontWeight="600" fill="#2A2328" fontFamily="Georgia, serif">
                          {tbl.name.split("—")[0].trim()}
                        </text>
                        <text textAnchor="middle" y={8} fontSize="10" fill="#9B9098">
                          {tGuests.length}/{tbl.seats} guests
                        </text>
                        {/* Meal dots */}
                        <g transform="translate(-20, 20)">
                          {tGuests.slice(0, 5).map((g, i) => (
                            <circle key={g.id} cx={i * 10} cy={0} r={4} fill={mealColors[g.meal] ?? "#DDD7D0"} />
                          ))}
                        </g>
                      </g>
                    );
                  })}
                </svg>
              </div>
              <p className="text-xs text-[#9B9098] text-center mt-2">Drag tables to rearrange · Dots = meal type 🍗 🐟 🌿</p>
            </div>

            {/* Sidebar */}
            <div className="w-64 border-l border-[#EDE8E0] bg-white overflow-y-auto p-4 flex flex-col gap-4">
              {selectedTbl ? (
                <>
                  <div>
                    <h3 className="font-semibold text-[#2A2328] text-sm mb-1">{selectedTbl.name}</h3>
                    <p className="text-xs text-[#9B9098]">{selectedGuests.length} of {selectedTbl.seats} seats filled</p>
                  </div>
                  <div className="space-y-1">
                    {selectedGuests.map(g => (
                      <div key={g.id} className="flex items-center justify-between p-2 rounded-lg bg-[#FDFBF8] border border-[#EDE8E0]">
                        <span className="text-xs font-medium text-[#2A2328]">{g.name}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: rsvpColors[g.rsvp] }}>
                          {g.rsvp}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-[#9B9098]">
                  <div className="text-3xl mb-2">🪑</div>
                  <p className="text-xs">Click a table to see its guests</p>
                </div>
              )}

              <div className="mt-auto pt-4 border-t border-[#EDE8E0]">
                <p className="text-xs text-[#9B9098] mb-3 font-medium">Meal Legend</p>
                {Object.entries(mealColors).map(([meal, color]) => (
                  <div key={meal} className="flex items-center gap-2 text-xs text-[#4A4348] mb-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="capitalize">{meal}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Guest list */
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl border border-[#EDE8E0] overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[#FDFBF8] border-b border-[#EDE8E0]">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6068]">Guest</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6068]">Table</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6068]">Meal</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6068]">RSVP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guests.map((g, i) => {
                      const tbl = tables.find(t => t.id === g.table);
                      return (
                        <tr key={g.id} className={`border-b border-[#EDE8E0] last:border-0 ${i % 2 === 0 ? "" : "bg-[#FDFBF8]"}`}>
                          <td className="px-4 py-3 font-medium text-[#2A2328]">{g.name}</td>
                          <td className="px-4 py-3 text-[#6B6068]">{tbl?.name.split("—")[0].trim() ?? "—"}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-white text-xs capitalize" style={{ backgroundColor: mealColors[g.meal] }}>
                              {g.meal}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-white text-xs capitalize" style={{ backgroundColor: rsvpColors[g.rsvp] }}>
                              {g.rsvp}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CTA banner */}
      <div className="bg-[#C9956E] px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-white font-semibold">Ready to plan your own wedding?</p>
          <p className="text-white/80 text-sm">Sign up free — no credit card required</p>
        </div>
        <Link href="/signup" className="px-6 py-2.5 bg-white text-[#C9956E] font-semibold rounded-lg text-sm hover:bg-[#FDF4EC] transition-colors">
          Get Started Free →
        </Link>
      </div>
    </div>
  );
}
