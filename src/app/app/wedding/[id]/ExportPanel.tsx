"use client";

import { useRef } from "react";
import type { Wedding, Guest, Table, Group, Venue, Rule } from "@/lib/types";
import { exportSeatingChartPDF } from "@/lib/exportPDF";

interface Props {
  wedding:  Wedding;
  guests:   Guest[];
  tables:   Table[];
  groups:   Group[];
  venues:   Venue[];
  rules:    Rule[];
  darkMode: boolean;
  isDemo?:  boolean;
  onRestore: (data: { venues: Venue[]; guests: Guest[]; tables: Table[]; groups: Group[]; rules: Rule[] }) => void;
  showToast?: (msg: string, type?: "success" | "error" | "info") => void;
}

const MEAL_ICON: Record<string, string> = {
  standard: "🍽", vegetarian: "🌿", vegan: "🌱",
  "gluten-free": "🌾", halal: "☪", kosher: "✡", children: "🧒",
};

export default function ExportPanel({ wedding, guests, tables, groups, venues, rules, darkMode, isDemo, onRestore, showToast }: Props) {
  const restoreRef = useRef<HTMLInputElement>(null);

  const cs = {
    bg:         "var(--bg)",
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
    accentDark: "var(--accent-dark)",
  };

  const guestName = (g: Guest) => `${g.first_name} ${g.last_name}`.trim();
  const tableName = (id?: string | null) => id ? tables.find(t => t.id === id)?.name ?? "—" : "—";
  const groupName = (id?: string | null) => id ? groups.find(g => g.id === id)?.name ?? "—" : "—";

  /* ── Download helper ── */
  const download = (content: string, filename: string, mime = "text/plain") => {
    const blob = new Blob([content], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Kitchen Sheet PDF ── */
  const kitchenSheet = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const ACCENT: [number,number,number] = [201,169,110];
    const DARK:   [number,number,number] = [51,51,51];
    const MUTED:  [number,number,number] = [120,110,100];
    const WHITE:  [number,number,number] = [255,255,255];
    const PAGE_W = 210, PAGE_H = 297, ML = 18, MR = 18, CW = 210 - 18 - 18;

    // Header
    doc.setFillColor(...ACCENT);
    doc.rect(0, 0, PAGE_W, 44, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(...WHITE);
    doc.text(wedding.name, PAGE_W / 2, 18, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(252,244,228);
    doc.text("Kitchen Sheet", PAGE_W / 2, 28, { align: "center" });
    doc.setFontSize(8); doc.setTextColor(240,230,210);
    doc.text(`Generated ${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}`, PAGE_W/2, 38, { align:"center" });

    let y = 54;
    const confirmed = guests.filter(g => g.rsvp !== "declined");
    const mealGroups = confirmed.reduce<Record<string, Guest[]>>((acc, g) => {
      const m = g.meal || "standard";
      if (!acc[m]) acc[m] = [];
      acc[m].push(g);
      return acc;
    }, {});

    // Summary totals
    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...DARK);
    doc.text(`Total confirmed guests: ${confirmed.length}`, ML, y); y += 8;

    // Summary table header
    doc.setFillColor(...ACCENT);
    doc.rect(ML, y, CW, 8, "F");
    doc.setFont("helvetica","bold"); doc.setFontSize(8.5); doc.setTextColor(...WHITE);
    doc.text("Meal Type", ML+3, y+5.5);
    doc.text("Count", ML+60, y+5.5);
    doc.text("Guests", ML+85, y+5.5);
    y += 10;

    Object.entries(mealGroups).sort((a,b)=>b[1].length-a[1].length).forEach(([meal, list], idx) => {
      if (y > PAGE_H - 20) { doc.addPage(); y = 20; }
      if (idx%2===0) { doc.setFillColor(250,247,242); doc.rect(ML,y,CW,7,"F"); }
      doc.setDrawColor(...ACCENT); doc.setLineWidth(0.15);
      doc.rect(ML, y, CW, 7, "D");
      doc.setFont("helvetica","bold"); doc.setFontSize(8.5); doc.setTextColor(...DARK);
      doc.text(meal.charAt(0).toUpperCase()+meal.slice(1), ML+3, y+5);
      doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(...ACCENT);
      doc.text(String(list.length), ML+63, y+5.2, { align:"center" });
      const names = list.map(g=>guestName(g)).join(", ");
      doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
      const wrapped = doc.splitTextToSize(names, CW - 88);
      doc.text(wrapped[0] + (wrapped.length > 1 ? "…" : ""), ML+87, y+5);
      y += 8;
    });

    y += 8;
    // Detailed section per meal
    Object.entries(mealGroups).forEach(([meal, list]) => {
      if (y > PAGE_H - 30) { doc.addPage(); y = 20; }
      doc.setFillColor(245,238,225); doc.setDrawColor(...ACCENT); doc.setLineWidth(0.3);
      doc.roundedRect(ML, y, CW, 8, 1, 1, "FD");
      doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...DARK);
      doc.text(`${meal.charAt(0).toUpperCase()+meal.slice(1)} (${list.length})`, ML+4, y+5.5);
      y += 11;
      list.forEach((g, idx) => {
        if (y > PAGE_H - 16) { doc.addPage(); y = 20; }
        if (idx%2===0) { doc.setFillColor(250,247,242); doc.rect(ML,y,CW,6.5,"F"); }
        doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(...DARK);
        doc.text(guestName(g), ML+6, y+4.5);
        if (g.table_id) {
          doc.setFont("helvetica","italic"); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
          doc.text(tableName(g.table_id), PAGE_W-MR-2, y+4.5, { align:"right" });
        }
        y += 6.5;
      });
      doc.setDrawColor(...ACCENT); doc.setLineWidth(0.2);
      doc.line(ML, y, PAGE_W-MR, y); y += 6;
    });

    // Footer
    const totalPages = (doc as unknown as { internal: { getNumberOfPages: ()=>number } }).internal.getNumberOfPages();
    for (let p=1; p<=totalPages; p++) {
      doc.setPage(p);
      doc.setDrawColor(...ACCENT); doc.setLineWidth(0.3);
      doc.line(ML, PAGE_H-12, PAGE_W-MR, PAGE_H-12);
      doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(...MUTED);
      doc.text("TableMate — Kitchen Sheet", ML, PAGE_H-7);
      doc.text(`Page ${p} of ${totalPages}`, PAGE_W-MR, PAGE_H-7, { align:"right" });
    }
    doc.save(`kitchen-sheet-${wedding.name.replace(/\s+/g,"-")}.pdf`);
  };

  /* ── Guest CSV ── */
  const guestCsv = () => {
    const header = "first_name,last_name,email,phone,rsvp,meal,allergies,party,table,notes\n";
    const rows = guests.map(g =>
      [g.first_name, g.last_name, g.email, g.phone, g.rsvp, g.meal, g.allergies,
       groupName(g.group_id), tableName(g.table_id), g.notes]
        .map(v => `"${(v ?? "").toString().replace(/"/g, '""')}"`)
        .join(",")
    ).join("\n");
    download(header + rows, `guests-${wedding.name.replace(/\s+/g, "-")}.csv`, "text/csv");
  };

  /* ── Backup JSON ── */
  const backupJson = () => {
    const data = JSON.stringify({ wedding, venues, guests, tables, groups, rules }, null, 2);
    download(data, `backup-${wedding.name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0,10)}.json`, "application/json");
  };

  /* ── Restore JSON ── */
  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.guests || !data.tables) { showToast?.("Invalid backup file.", "error"); return; }
      if (!confirm("This will replace all current data. Continue?")) return;
      onRestore({
        venues:  data.venues  ?? [],
        guests:  data.guests  ?? [],
        tables:  data.tables  ?? [],
        groups:  data.groups  ?? [],
        rules:   data.rules   ?? [],
      });
    } catch { showToast?.("Failed to parse backup file.", "error"); }
    e.target.value = "";
  };

  /* ── Table Cards PDF ── */
  const tableCards = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const ACCENT: [number,number,number] = [201,169,110];
    const DARK:   [number,number,number] = [51,51,51];
    const MUTED:  [number,number,number] = [120,110,100];
    const WHITE:  [number,number,number] = [255,255,255];
    const PAGE_W = 210, PAGE_H = 297, ML = 18, MR = 18, CW = 210-18-18;

    // Cover header
    doc.setFillColor(...ACCENT);
    doc.rect(0,0,PAGE_W,44,"F");
    doc.setFont("helvetica","bold"); doc.setFontSize(22); doc.setTextColor(...WHITE);
    doc.text(wedding.name, PAGE_W/2, 18, { align:"center" });
    doc.setFont("helvetica","normal"); doc.setFontSize(11); doc.setTextColor(252,244,228);
    doc.text("Table Cards", PAGE_W/2, 28, { align:"center" });
    doc.setFontSize(8); doc.setTextColor(240,230,210);
    doc.text(`Generated ${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}`, PAGE_W/2, 38, { align:"center" });

    let y = 54;

    for (const t of tables) {
      const tg = guests.filter(g => g.table_id === t.id);
      const cardH = 14 + Math.max(tg.length,1)*6.5 + 6;
      if (y + cardH > PAGE_H - 16) { doc.addPage(); y = 20; }

      // Card border + header
      doc.setDrawColor(...ACCENT); doc.setLineWidth(0.5);
      doc.setFillColor(252,249,245);
      doc.roundedRect(ML, y, CW, cardH, 2, 2, "FD");

      // Gold top strip
      doc.setFillColor(...ACCENT);
      doc.roundedRect(ML, y, CW, 9, 2, 2, "F");
      doc.rect(ML, y+5, CW, 4, "F"); // square bottom corners

      doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(...WHITE);
      doc.text(t.name, ML+5, y+6.2);
      doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(252,244,228);
      doc.text(`${tg.length} / ${t.capacity} guests`, PAGE_W-MR-3, y+6.2, { align:"right" });

      let gy = y + 13;
      if (tg.length === 0) {
        doc.setFont("helvetica","italic"); doc.setFontSize(8); doc.setTextColor(...MUTED);
        doc.text("No guests assigned", ML+5, gy+3);
      } else {
        tg.forEach((g, idx) => {
          if (idx%2===0) { doc.setFillColor(246,241,232); doc.rect(ML+1, gy, CW-2, 6.5, "F"); }
          doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(...DARK);
          doc.text(guestName(g), ML+5, gy+4.5);
          const meal = g.meal || "standard";
          if (meal !== "standard") {
            doc.setFont("helvetica","italic"); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
            doc.text(meal, PAGE_W-MR-4, gy+4.5, { align:"right" });
          }
          gy += 6.5;
        });
      }
      y += cardH + 5;
    }

    // Footer
    const totalPages = (doc as unknown as { internal: { getNumberOfPages: ()=>number } }).internal.getNumberOfPages();
    for (let p=1; p<=totalPages; p++) {
      doc.setPage(p);
      doc.setDrawColor(...ACCENT); doc.setLineWidth(0.3);
      doc.line(ML, PAGE_H-12, PAGE_W-MR, PAGE_H-12);
      doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(...MUTED);
      doc.text("TableMate — Table Cards", ML, PAGE_H-7);
      doc.text(`Page ${p} of ${totalPages}`, PAGE_W-MR, PAGE_H-7, { align:"right" });
    }
    doc.save(`table-cards-${wedding.name.replace(/\s+/g,"-")}.pdf`);
  };

  /* ── Place Cards PDF ── */
  const placeCards = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const ACCENT: [number,number,number] = [201,169,110];
    const DARK:   [number,number,number] = [51,51,51];
    const MUTED:  [number,number,number] = [120,110,100];
    const WHITE:  [number,number,number] = [255,255,255];
    const PAGE_W = 210, PAGE_H = 297, ML = 14, MR = 14;

    // Cover header
    doc.setFillColor(...ACCENT);
    doc.rect(0,0,PAGE_W,44,"F");
    doc.setFont("helvetica","bold"); doc.setFontSize(22); doc.setTextColor(...WHITE);
    doc.text(wedding.name, PAGE_W/2, 18, { align:"center" });
    doc.setFont("helvetica","normal"); doc.setFontSize(11); doc.setTextColor(252,244,228);
    doc.text("Place Cards", PAGE_W/2, 28, { align:"center" });
    doc.setFontSize(8); doc.setTextColor(240,230,210);
    doc.text(`Generated ${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}`, PAGE_W/2, 38, { align:"center" });

    const confirmed = guests.filter(g => g.rsvp !== "declined");
    const CARD_W = (PAGE_W - ML - MR - 6) / 2;
    const CARD_H = 32;
    const GAP = 6;
    let col = 0;
    let y = 54;

    confirmed.forEach((g) => {
      const x = ML + col * (CARD_W + GAP);
      if (y + CARD_H > PAGE_H - 16) { doc.addPage(); y = 20; col = 0; }

      // Card background + border
      doc.setFillColor(252,249,245);
      doc.setDrawColor(...ACCENT);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, y, CARD_W, CARD_H, 2, 2, "FD");

      // Top gold accent line
      doc.setFillColor(...ACCENT);
      doc.rect(x+2, y+2, CARD_W-4, 1.5, "F");

      // Name
      doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(...DARK);
      doc.text(guestName(g), x + CARD_W/2, y + 12, { align:"center" });

      // Table
      const tname = tableName(g.table_id);
      doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(...ACCENT);
      doc.text(tname !== "—" ? tname : "Unseated", x + CARD_W/2, y + 20, { align:"center" });

      // Meal
      const meal = g.meal || "standard";
      doc.setFont("helvetica","italic"); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
      doc.text(meal, x + CARD_W/2, y + 27, { align:"center" });

      col++;
      if (col >= 2) { col = 0; y += CARD_H + GAP; }
    });

    // Footer
    const totalPages = (doc as unknown as { internal: { getNumberOfPages: ()=>number } }).internal.getNumberOfPages();
    for (let p=1; p<=totalPages; p++) {
      doc.setPage(p);
      doc.setDrawColor(...ACCENT); doc.setLineWidth(0.3);
      doc.line(ML, PAGE_H-12, PAGE_W-MR, PAGE_H-12);
      doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(...MUTED);
      doc.text("TableMate — Place Cards", ML, PAGE_H-7);
      doc.text(`Page ${p} of ${totalPages}`, PAGE_W-MR, PAGE_H-7, { align:"right" });
    }
    doc.save(`place-cards-${wedding.name.replace(/\s+/g,"-")}.pdf`);
  };

  /* ── Venue Chart PDF ── */
  const venueChart = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const ACCENT: [number,number,number] = [201,169,110];
    const DARK:   [number,number,number] = [51,51,51];
    const MUTED:  [number,number,number] = [120,110,100];
    const WHITE:  [number,number,number] = [255,255,255];
    const PAGE_W = 297, PAGE_H = 210, ML = 14, MR = 14;

    // Header
    doc.setFillColor(...ACCENT);
    doc.rect(0,0,PAGE_W,36,"F");
    doc.setFont("helvetica","bold"); doc.setFontSize(20); doc.setTextColor(...WHITE);
    doc.text(wedding.name, PAGE_W/2, 14, { align:"center" });
    doc.setFont("helvetica","normal"); doc.setFontSize(10); doc.setTextColor(252,244,228);
    doc.text("Venue Chart", PAGE_W/2, 23, { align:"center" });
    doc.setFontSize(7.5); doc.setTextColor(240,230,210);
    doc.text(`Generated ${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}`, PAGE_W/2, 31, { align:"center" });

    // Grid layout constants
    const COLS = tables.length <= 8 ? Math.min(tables.length, 4) : 4;
    const DRAW_X = ML, DRAW_Y = 42;
    const DRAW_W = PAGE_W - ML - MR;
    const CELL_GAP = 6;
    const CELL_W = (DRAW_W - CELL_GAP * (COLS - 1)) / COLS;
    const CELL_H = 32;

    // Draw background
    doc.setFillColor(250,248,244);
    doc.setDrawColor(220,210,195); doc.setLineWidth(0.3);
    const rows = Math.ceil(tables.length / COLS);
    const gridH = rows * CELL_H + (rows - 1) * CELL_GAP;
    doc.rect(DRAW_X - 4, DRAW_Y - 4, DRAW_W + 8, gridH + 8, "FD");

    tables.forEach((t, idx) => {
      const tg = guests.filter(g => g.table_id === t.id);
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const cx = DRAW_X + col * (CELL_W + CELL_GAP);
      const cy = DRAW_Y + row * (CELL_H + CELL_GAP);
      const isRound = t.shape === "round";

      // Cell background
      doc.setFillColor(255,255,255);
      doc.setDrawColor(...ACCENT); doc.setLineWidth(0.6);

      if (isRound) {
        const r = Math.min(CELL_W, CELL_H) / 2;
        doc.circle(cx + CELL_W/2, cy + CELL_H/2, r, "FD");
      } else {
        doc.roundedRect(cx, cy, CELL_W, CELL_H, 2, 2, "FD");
      }

      // Table name
      const nameLines = doc.splitTextToSize(t.name, CELL_W - 6);
      doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(...DARK);
      doc.text(nameLines[0], cx + CELL_W/2, cy + CELL_H/2 - 2, { align:"center" });

      // Guest count
      doc.setFont("helvetica","normal"); doc.setFontSize(6.5); doc.setTextColor(...MUTED);
      doc.text(`${tg.length}/${t.capacity}`, cx + CELL_W/2, cy + CELL_H/2 + 5, { align:"center" });
    });

    // Footer
    doc.setDrawColor(...ACCENT); doc.setLineWidth(0.3);
    doc.line(ML, PAGE_H-10, PAGE_W-MR, PAGE_H-10);
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text("TableMate — Venue Chart", ML, PAGE_H-5);
    doc.text(`${tables.length} tables · ${guests.filter(g=>!!g.table_id).length} seated guests`, PAGE_W-MR, PAGE_H-5, { align:"right" });

    doc.save(`venue-chart-${wedding.name.replace(/\s+/g,"-")}.pdf`);
  };

  const cardStyle = { background: cs.surface, border: `1px solid ${cs.border}` };
  const btnStyle  = { background: cs.surface2, border: `1px solid ${cs.border}`, color: cs.text };
  const btnPrimary = { background: cs.accent, color: "white" };

  const ExportCard = ({ icon, title, desc, onExport }: { icon: string; title: string; desc: string; onExport: () => void }) => (
    <div className="rounded-2xl p-5 flex flex-col gap-3" style={cardStyle}>
      <div className="text-3xl">{icon}</div>
      <div>
        <h3 className="font-semibold text-sm" style={{ color: cs.text }}>{title}</h3>
        <p className="text-xs mt-1" style={{ color: cs.textMuted }}>{desc}</p>
      </div>
      {isDemo ? (
        <a href="/signup"
          className="mt-auto px-4 py-2 rounded-xl text-xs font-semibold text-center hover:opacity-80"
          style={{ background: cs.surface2, border: `1px solid ${cs.border}`, color: cs.textMuted }}>
          🔒 Sign up to download
        </a>
      ) : (
        <button onClick={onExport}
          className="mt-auto px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-80 text-white"
          style={btnPrimary}>
          Download
        </button>
      )}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto" style={{ background: cs.bg }}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="font-playfair text-2xl font-bold mb-1" style={{ color: cs.text }}>Export</h2>
        <p className="text-sm mb-8" style={{ color: cs.textSoft }}>
          Download your seating data in various formats for kitchen staff, venue coordinators, and guests.
        </p>

        {/* Stats summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Guests", value: guests.length },
            { label: "Confirmed",    value: guests.filter(g => g.rsvp === "confirmed").length },
            { label: "Seated",       value: guests.filter(g => !!g.table_id).length },
            { label: "Tables",       value: tables.length },
          ].map(s => (
            <div key={s.label} className="rounded-xl px-4 py-3 text-center" style={{ background: cs.surface, border: `1px solid ${cs.border}` }}>
              <div className="text-2xl font-bold font-playfair" style={{ color: cs.accent }}>{s.value}</div>
              <div className="text-xs mt-0.5" style={{ color: cs.textMuted }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <ExportCard
            icon="👨‍🍳"
            title="Kitchen Sheet"
            desc="Meal counts by type for catering staff. Opens print-ready HTML."
            onExport={kitchenSheet}
          />
          <ExportCard
            icon="🗺"
            title="Venue Chart"
            desc="Visual seating chart with table positions for venue coordinators."
            onExport={venueChart}
          />
          <ExportCard
            icon="📋"
            title="Table Cards"
            desc="Per-table guest lists for placing on each table at the venue."
            onExport={tableCards}
          />
          <ExportCard
            icon="📛"
            title="Place Cards"
            desc="Individual name cards for each confirmed guest with table & meal."
            onExport={placeCards}
          />
          <ExportCard
            icon="📄"
            title="Seating Chart PDF"
            desc="Beautiful PDF with every table, seated guests, meal choices, and unassigned guests."
            onExport={() => exportSeatingChartPDF(wedding.name, tables, guests)}
          />
          <ExportCard
            icon="📊"
            title="Guest CSV"
            desc="Full guest list with RSVP, meal, table, and party information."
            onExport={guestCsv}
          />
          <div className="rounded-2xl p-5 flex flex-col gap-3" style={cardStyle}>
            <div className="text-3xl">💾</div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: cs.text }}>Backup / Restore</h3>
              <p className="text-xs mt-1" style={{ color: cs.textMuted }}>Save a full JSON backup or restore from a previous backup.</p>
            </div>
            {isDemo ? (
              <a href="/signup"
                className="mt-auto px-4 py-2 rounded-xl text-xs font-semibold text-center hover:opacity-80"
                style={{ background: cs.surface2, border: `1px solid ${cs.border}`, color: cs.textMuted }}>
                🔒 Sign up to backup
              </a>
            ) : (
              <div className="flex gap-2 mt-auto">
                <button onClick={backupJson}
                  className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold hover:opacity-80 text-white"
                  style={btnPrimary}>
                  ⬇ Backup
                </button>
                <label className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold hover:opacity-80 text-center cursor-pointer"
                  style={btnStyle}>
                  ⬆ Restore
                  <input ref={restoreRef} type="file" accept=".json" className="hidden" onChange={handleRestore}/>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Meal breakdown table */}
        <div className="rounded-2xl p-6" style={{ background: cs.surface, border: `1px solid ${cs.border}` }}>
          <h3 className="font-semibold text-sm mb-4" style={{ color: cs.text }}>Meal Breakdown</h3>
          <div className="space-y-2">
            {Object.entries(
              guests.filter(g => g.rsvp !== "declined").reduce<Record<string, number>>((acc, g) => {
                const m = g.meal || "standard";
                acc[m] = (acc[m] || 0) + 1;
                return acc;
              }, {})
            ).sort((a, b) => b[1] - a[1]).map(([meal, count]) => {
              const total = guests.filter(g => g.rsvp !== "declined").length;
              const pct = total ? Math.round(count / total * 100) : 0;
              return (
                <div key={meal} className="flex items-center gap-3">
                  <span className="w-8 text-center">{MEAL_ICON[meal]}</span>
                  <span className="text-sm capitalize w-28" style={{ color: cs.text }}>{meal}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: cs.surface2 }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cs.accent }}/>
                  </div>
                  <span className="text-xs w-10 text-right font-semibold" style={{ color: cs.accent }}>{count}</span>
                  <span className="text-xs w-8 text-right" style={{ color: cs.textMuted }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
