"use client";

import { useState, useRef } from "react";
import type { Wedding, Guest, Table, Group, Venue, Rule } from "@/lib/types";
import { EXPORT_THEMES, DEFAULT_THEME, type ThemeKey } from "@/lib/exportThemes";
import {
  exportSeatingChartPDF,
  exportPlaceCardsPDF,
  exportEscortCardsPDF,
  exportTableCardsPDF,
  exportKitchenSheetPDF,
} from "@/lib/exportPDF";

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

export default function ExportPanel({ wedding, guests, tables, groups, venues, rules, isDemo, onRestore, showToast }: Props) {
  const restoreRef = useRef<HTMLInputElement>(null);
  const [themeKey, setThemeKey] = useState<ThemeKey>(DEFAULT_THEME);
  const [downloading, setDownloading] = useState<string | null>(null);

  const cs = {
    bg:         "var(--bg)",
    surface:    "var(--surface)",
    surface2:   "var(--surface2)",
    border:     "var(--border)",
    text:       "var(--text)",
    textMid:    "var(--text-mid)",
    textSoft:   "var(--text-soft)",
    textMuted:  "var(--text-muted)",
    accent:     "var(--accent)",
    accentBg:   "var(--accent-bg)",
  };

  const theme = EXPORT_THEMES[themeKey];

  const groupName = (id?: string | null) => id ? groups.find(g => g.id === id)?.name ?? "—" : "—";
  const tableName = (id?: string | null) => id ? tables.find(t => t.id === id)?.name ?? "—" : "—";
  const guestName = (g: Guest) => `${g.first_name} ${g.last_name}`.trim();

  /* ── Download helper ── */
  const download = (content: string, filename: string, mime = "text/plain") => {
    const blob = new Blob([content], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Wrapper for PDF exports ── */
  const run = async (id: string, fn: () => Promise<void>) => {
    if (isDemo) { showToast?.("Sign up to download exports 🔒", "info"); return; }
    setDownloading(id);
    try { await fn(); showToast?.("Downloaded!", "success"); }
    catch (e) { console.error(e); showToast?.("Export failed", "error"); }
    finally { setDownloading(null); }
  };

  /* ── Guest CSV ── */
  const guestCsv = () => {
    if (isDemo) { showToast?.("Sign up to download exports 🔒", "info"); return; }
    const header = "first_name,last_name,email,phone,rsvp,meal,allergies,party,table,notes\n";
    const rows = guests.map(g =>
      [g.first_name, g.last_name, g.email, g.phone, g.rsvp, g.meal, g.allergies,
       groupName(g.group_id), tableName(g.table_id), g.notes]
        .map(v => `"${(v ?? "").toString().replace(/"/g, '""')}"`)
        .join(",")
    ).join("\n");
    download(header + rows, `guests-${wedding.name.replace(/\s+/g, "-")}.csv`, "text/csv");
    showToast?.("CSV downloaded!", "success");
  };

  /* ── Backup JSON ── */
  const backupJson = () => {
    if (isDemo) { showToast?.("Sign up to download exports 🔒", "info"); return; }
    const data = JSON.stringify({ wedding, venues, guests, tables, groups, rules }, null, 2);
    download(data, `backup-${wedding.name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0,10)}.json`, "application/json");
    showToast?.("Backup saved!", "success");
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

  // ── Export card definitions ──
  const exports = [
    {
      id: "seating-chart",
      icon: "📜",
      title: "Seating Chart",
      desc: "Two-column A–Z guest list with table assignments. Classic wedding display format.",
      badge: "Most Popular",
      fn: () => exportSeatingChartPDF(wedding.name, tables, guests, theme),
    },
    {
      id: "escort-cards",
      icon: "🪪",
      title: "Escort Cards",
      desc: "Alphabetical guest list by last name with table. Displayed at venue entrance.",
      badge: "New",
      fn: () => exportEscortCardsPDF(wedding.name, tables, guests, theme),
    },
    {
      id: "place-cards",
      icon: "📛",
      title: "Place Cards",
      desc: "4 per A4 page. Cut & fold tent cards with guest name, table, and meal.",
      fn: () => exportPlaceCardsPDF(wedding.name, tables, guests, theme),
    },
    {
      id: "table-cards",
      icon: "📋",
      title: "Table Cards",
      desc: "One card per table with full guest list. Place on each table at the venue.",
      fn: () => exportTableCardsPDF(wedding.name, tables, guests, theme),
    },
    {
      id: "kitchen-sheet",
      icon: "👨‍🍳",
      title: "Kitchen Sheet",
      desc: "Meal counts by type for catering staff with full guest breakdown.",
      fn: () => exportKitchenSheetPDF(wedding.name, tables, guests, theme),
    },
  ];

  return (
    <div className="h-full overflow-y-auto" style={{ background: cs.bg }}>
      <div className="max-w-4xl mx-auto px-6 py-8">

        <h2 className="font-playfair text-2xl font-bold mb-1" style={{ color: cs.text }}>Export & Download</h2>
        <p className="text-sm mb-8" style={{ color: cs.textSoft }}>
          Choose a theme, then download beautifully designed PDFs for every part of your wedding.
        </p>

        {/* ── Stats ── */}
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

        {/* ── Theme Picker ── */}
        <div className="rounded-2xl p-5 mb-8" style={{ background: cs.surface, border: `1px solid ${cs.border}` }}>
          <p className="text-sm font-semibold mb-3" style={{ color: cs.text }}>Choose a PDF Theme</p>
          <p className="text-xs mb-4" style={{ color: cs.textMuted }}>
            This theme applies to all downloaded PDFs — serene typography, elegant borders, and your color palette throughout.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {Object.values(EXPORT_THEMES).map(th => (
              <button
                key={th.key}
                onClick={() => setThemeKey(th.key)}
                className="flex flex-col items-center gap-1.5 rounded-xl py-3 px-2 text-xs font-medium transition-all hover:scale-105"
                style={{
                  border: `2px solid ${themeKey === th.key ? cs.accent : cs.border}`,
                  background: themeKey === th.key ? cs.accentBg : cs.bg,
                  color: themeKey === th.key ? cs.accent : cs.textMuted,
                }}
              >
                {/* Color swatch */}
                <span
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-base"
                  style={{
                    background: `rgb(${th.accent[0]},${th.accent[1]},${th.accent[2]})`,
                    borderColor: `rgb(${th.border[0]},${th.border[1]},${th.border[2]})`,
                  }}
                >
                  {th.emoji}
                </span>
                <span>{th.name}</span>
                {themeKey === th.key && (
                  <span className="text-xs font-bold" style={{ color: cs.accent }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── PDF Export Cards ── */}
        <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: cs.textMuted }}>
          Wedding Printables
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {exports.map(ex => (
            <div
              key={ex.id}
              className="rounded-2xl p-5 flex flex-col gap-3 relative"
              style={{ background: cs.surface, border: `1px solid ${cs.border}` }}
            >
              {ex.badge && (
                <span
                  className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: cs.accentBg, color: cs.accent }}
                >
                  {ex.badge}
                </span>
              )}
              {/* Theme color swatch strip */}
              <div
                className="w-full h-1.5 rounded-full"
                style={{ background: `rgb(${theme.accent[0]},${theme.accent[1]},${theme.accent[2]})`, opacity: 0.6 }}
              />
              <div className="text-3xl">{ex.icon}</div>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: cs.text }}>{ex.title}</h3>
                <p className="text-xs mt-1" style={{ color: cs.textMuted }}>{ex.desc}</p>
              </div>
              {isDemo ? (
                <a href="/signup"
                  className="mt-auto px-4 py-2 rounded-xl text-xs font-semibold text-center hover:opacity-80"
                  style={{ background: cs.surface2, border: `1px solid ${cs.border}`, color: cs.textMuted }}>
                  🔒 Sign up to download
                </a>
              ) : (
                <button
                  onClick={() => run(ex.id, ex.fn)}
                  disabled={downloading === ex.id}
                  className="mt-auto px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-80 text-white disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: `rgb(${theme.accent[0]},${theme.accent[1]},${theme.accent[2]})` }}
                >
                  {downloading === ex.id ? (
                    <>
                      <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating…
                    </>
                  ) : (
                    `Download ${th(themeKey)}`
                  )}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* ── Data Exports ── */}
        <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: cs.textMuted }}>
          Data & Backup
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: cs.surface, border: `1px solid ${cs.border}` }}>
            <div className="text-3xl">📊</div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: cs.text }}>Guest CSV</h3>
              <p className="text-xs mt-1" style={{ color: cs.textMuted }}>Full guest list with RSVP, meal, table, and party info. Open in Excel or Google Sheets.</p>
            </div>
            <button onClick={guestCsv} className="mt-auto px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-80" style={{ background: cs.surface2, border: `1px solid ${cs.border}`, color: cs.text }}>
              Download CSV
            </button>
          </div>

          <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: cs.surface, border: `1px solid ${cs.border}` }}>
            <div className="text-3xl">💾</div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: cs.text }}>Backup / Restore</h3>
              <p className="text-xs mt-1" style={{ color: cs.textMuted }}>Save everything as JSON and restore it later. Full backup of guests, tables, groups, and rules.</p>
            </div>
            <div className="mt-auto flex flex-col gap-2">
              <button onClick={backupJson} className="px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-80" style={{ background: cs.surface2, border: `1px solid ${cs.border}`, color: cs.text }}>
                Download Backup
              </button>
              <button onClick={() => restoreRef.current?.click()} className="px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-80" style={{ background: cs.surface2, border: `1px solid ${cs.border}`, color: cs.text }}>
                Restore from Backup
              </button>
              <input ref={restoreRef} type="file" accept=".json" onChange={handleRestore} className="hidden" />
            </div>
          </div>
        </div>

        {/* ── Print Tips ── */}
        <div className="rounded-2xl p-5" style={{ background: cs.surface, border: `1px solid ${cs.border}` }}>
          <p className="text-sm font-semibold mb-2" style={{ color: cs.text }}>🖨️ Print Tips</p>
          <ul className="text-xs space-y-1.5" style={{ color: cs.textMuted }}>
            <li>• <strong style={{ color: cs.textMid }}>Seating Chart & Escort Cards</strong> — Print on A4/Letter, frame or mount on foam board at venue entrance</li>
            <li>• <strong style={{ color: cs.textMid }}>Place Cards</strong> — Print on 200–300gsm card stock, cut on dotted lines, fold at center line</li>
            <li>• <strong style={{ color: cs.textMid }}>Table Cards</strong> — Print and place on each table before guests arrive</li>
            <li>• <strong style={{ color: cs.textMid }}>Kitchen Sheet</strong> — Print for catering manager — A4, one sided</li>
          </ul>
        </div>

      </div>
    </div>
  );
}

// Helper: theme label for button text
function th(key: ThemeKey): string {
  const labels: Record<ThemeKey, string> = {
    gold: "PDF", rose: "PDF", sage: "PDF", navy: "PDF", ivory: "PDF", dark: "PDF",
  };
  return labels[key];
}
