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

  /* ── Kitchen Sheet (HTML) ── */
  const kitchenSheet = () => {
    const confirmed = guests.filter(g => g.rsvp !== "declined");
    const mealGroups = confirmed.reduce<Record<string, Guest[]>>((acc, g) => {
      const m = g.meal || "standard";
      if (!acc[m]) acc[m] = [];
      acc[m].push(g);
      return acc;
    }, {});

    const rows = Object.entries(mealGroups).map(([meal, list]) =>
      `<tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:600">${meal}</td>
       <td style="padding:8px 12px;border:1px solid #ddd;font-size:24px;font-weight:700;color:#c9a96e">${list.length}</td>
       <td style="padding:8px 12px;border:1px solid #ddd;font-size:12px;color:#666">${list.map(g => guestName(g)).join(", ")}</td></tr>`
    ).join("");

    const html = `<!DOCTYPE html><html><head><title>Kitchen Sheet – ${wedding.name}</title>
    <style>body{font-family:Georgia,serif;padding:40px;color:#333}h1{color:#c9a96e}table{border-collapse:collapse;width:100%}th{background:#c9a96e;color:white;padding:10px 12px;text-align:left}</style></head>
    <body><h1>Kitchen Sheet</h1><h2 style="color:#666;font-weight:normal">${wedding.name}</h2>
    <p style="color:#999">Total confirmed: ${confirmed.length} guests</p>
    <table><thead><tr><th>Meal</th><th>Count</th><th>Guests</th></tr></thead><tbody>${rows}</tbody></table>
    <script>window.print()</script></body></html>`;
    download(html, `kitchen-sheet-${wedding.name.replace(/\s+/g, "-")}.html`, "text/html");
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

  /* ── Table Cards HTML ── */
  const tableCards = () => {
    const cards = tables.map(t => {
      const tg = guests.filter(g => g.table_id === t.id);
      const list = tg.map(g => `<li style="padding:2px 0;border-bottom:1px solid #f0e8d8">${guestName(g)} <span style="color:#999;font-size:12px">${MEAL_ICON[g.meal||"standard"]} ${g.meal||"standard"}</span></li>`).join("");
      return `<div style="page-break-inside:avoid;border:2px solid #c9a96e;border-radius:12px;padding:20px;margin:16px;display:inline-block;min-width:220px;vertical-align:top">
        <h2 style="color:#c9a96e;font-family:Georgia,serif;margin:0 0 4px">${t.name}</h2>
        <p style="color:#999;font-size:12px;margin:0 0 12px">${tg.length}/${t.capacity} guests</p>
        <ul style="list-style:none;padding:0;margin:0">${list}</ul></div>`;
    }).join("");
    const html = `<!DOCTYPE html><html><head><title>Table Cards – ${wedding.name}</title>
    <style>body{font-family:Georgia,serif;padding:32px;background:#fff;color:#333}h1{color:#c9a96e}</style></head>
    <body><h1>Table Cards — ${wedding.name}</h1>${cards}
    <script>window.print()</script></body></html>`;
    download(html, `table-cards-${wedding.name.replace(/\s+/g, "-")}.html`, "text/html");
  };

  /* ── Place Cards HTML ── */
  const placeCards = () => {
    const confirmed = guests.filter(g => g.rsvp !== "declined");
    const cards = confirmed.map(g => {
      const t = tableName(g.table_id);
      return `<div style="page-break-inside:avoid;border:1px solid #c9a96e;border-radius:8px;padding:16px 20px;margin:8px;display:inline-block;min-width:180px;text-align:center;vertical-align:top">
        <div style="font-family:Georgia,serif;font-size:18px;color:#333;margin-bottom:4px">${guestName(g)}</div>
        <div style="color:#c9a96e;font-size:13px">${t !== "—" ? t : "Unseated"}</div>
        <div style="color:#999;font-size:11px;margin-top:2px">${MEAL_ICON[g.meal||"standard"]} ${g.meal||"standard"}</div>
      </div>`;
    }).join("");
    const html = `<!DOCTYPE html><html><head><title>Place Cards – ${wedding.name}</title>
    <style>body{font-family:Georgia,serif;padding:32px;background:#fff}</style></head>
    <body><h1 style="color:#c9a96e">Place Cards — ${wedding.name}</h1>${cards}
    <script>window.print()</script></body></html>`;
    download(html, `place-cards-${wedding.name.replace(/\s+/g, "-")}.html`, "text/html");
  };

  /* ── Seating Chart HTML ── */
  const venueChart = () => {
    const tableHtml = tables.map(t => {
      const tg = guests.filter(g => g.table_id === t.id);
      const list = tg.map(g => `<span style="font-size:12px;color:#555;display:block">${guestName(g)}</span>`).join("");
      const isRound = t.shape === "round";
      return `<div style="position:absolute;left:${t.x}px;top:${t.y}px;width:${isRound?100:140}px;border:2px solid #c9a96e;border-radius:${isRound?"50%":"8px"};padding:10px;background:white;text-align:center">
        <strong style="font-size:13px;color:#c9a96e">${t.name}</strong><br>
        <span style="font-size:11px;color:#999">${tg.length}/${t.capacity}</span>
        ${list}</div>`;
    }).join("");
    const maxX = Math.max(...tables.map(t => t.x + 160), 800);
    const maxY = Math.max(...tables.map(t => t.y + 160), 600);
    const html = `<!DOCTYPE html><html><head><title>Venue Chart – ${wedding.name}</title></head>
    <body style="margin:0;padding:32px;font-family:Georgia,serif">
    <h1 style="color:#c9a96e">${wedding.name} — Venue Chart</h1>
    <div style="position:relative;width:${maxX}px;height:${maxY}px;border:1px solid #eee;background:#faf8f5">${tableHtml}</div>
    <script>window.print()</script></body></html>`;
    download(html, `venue-chart-${wedding.name.replace(/\s+/g, "-")}.html`, "text/html");
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
            icon="🪑"
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
