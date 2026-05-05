"use client";

import type { Guest, Table, Group, Rule, Wedding, Venue } from "@/lib/types";

interface Props {
  wedding:   Wedding;
  guests:    Guest[];
  tables:    Table[];
  groups:    Group[];
  rules:     Rule[];
  venues:    Venue[];
  darkMode:  boolean;
  isDemo?:   boolean;
  onTabChange: (tab: string) => void;
}

const MEAL_ICON: Record<string, string> = {
  standard: "🍽", vegetarian: "🌿", vegan: "🌱",
  "gluten-free": "🌾", halal: "☪", kosher: "✡", children: "🧒",
};

export default function OverviewPanel({
  wedding, guests, tables, groups, rules, venues, darkMode, isDemo, onTabChange
}: Props) {
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
    accentDark: "var(--accent-dark)",
  };

  // ── Stats ──
  const total      = guests.length;
  const confirmed  = guests.filter(g => g.rsvp === "confirmed").length;
  const pending    = guests.filter(g => g.rsvp === "pending").length;
  const declined   = guests.filter(g => g.rsvp === "declined").length;
  const seated     = guests.filter(g => !!g.table_id).length;
  const unseated   = guests.filter(g => !g.table_id && g.rsvp !== "declined").length;
  const totalSeats = tables.reduce((s, t) => s + (t.capacity || 8), 0);
  const rsvpRate   = total > 0 ? Math.round((confirmed + declined) / total * 100) : 0;
  const seatRate   = confirmed > 0 ? Math.round(seated / Math.max(confirmed, 1) * 100) : 0;

  // ── Days until wedding ──
  const daysUntil = (() => {
    if (!wedding.date) return null;
    const now  = new Date();
    const day  = new Date(wedding.date);
    const diff = Math.ceil((day.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  })();

  // ── Meal breakdown ──
  const mealCounts = guests
    .filter(g => g.rsvp !== "declined")
    .reduce<Record<string, number>>((acc, g) => {
      const m = g.meal || "standard";
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    }, {});

  // ── Table occupancy ──
  const tableStats = tables.map(t => {
    const guestsAtTable = guests.filter(g => g.table_id === t.id);
    return { ...t, count: guestsAtTable.length };
  }).sort((a, b) => b.count - a.count);

  // ── Checklist items ──
  const checklist = [
    { done: total > 0,     label: "Add guests",              action: "guests",  cta: "Add guests →" },
    { done: rsvpRate > 0,  label: "Collect RSVPs",           action: "guests",  cta: "Manage RSVPs →" },
    { done: tables.length > 0, label: "Create tables",       action: "chart",   cta: "Open floor plan →" },
    { done: seated > 0,    label: "Start seating guests",    action: "chart",   cta: "Seat guests →" },
    { done: unseated === 0 && confirmed > 0, label: "Seat all confirmed guests", action: "guests", cta: "See unseated →" },
    { done: rules.length > 0 || confirmed > 20, label: "Set seating rules (optional)", action: "rules", cta: "Add rules →" },
  ];
  const checkDone = checklist.filter(c => c.done).length;

  return (
    <div className="h-full overflow-y-auto" style={{ background: cs.bg }}>
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* ── Hero: wedding title + countdown ── */}
        <div className="rounded-2xl px-8 py-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ background: `linear-gradient(135deg, var(--accent-bg) 0%, var(--surface) 100%)`, border: `1px solid var(--border)` }}>
          <div>
            <h1 className="font-playfair text-3xl font-bold mb-1" style={{ color: cs.text }}>{wedding.name}</h1>
            {wedding.date && (
              <p className="text-sm" style={{ color: cs.textMuted }}>
                📅 {new Date(wedding.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            )}
            {venues.length > 0 && (
              <p className="text-sm mt-0.5" style={{ color: cs.textMuted }}>
                📍 {venues.map(v => v.name).join(" · ")}
              </p>
            )}
          </div>
          {daysUntil !== null && (
            <div className="text-center rounded-2xl px-6 py-4 flex-shrink-0"
              style={{ background: cs.surface, border: `2px solid var(--accent)` }}>
              {daysUntil > 0 ? (
                <>
                  <div className="font-playfair text-4xl font-bold" style={{ color: cs.accent }}>{daysUntil}</div>
                  <div className="text-xs mt-0.5 font-medium" style={{ color: cs.textMuted }}>days to go 💍</div>
                </>
              ) : daysUntil === 0 ? (
                <>
                  <div className="font-playfair text-3xl" style={{ color: cs.accent }}>🎉</div>
                  <div className="text-xs mt-0.5 font-medium" style={{ color: cs.accent }}>Today's the day!</div>
                </>
              ) : (
                <>
                  <div className="font-playfair text-4xl font-bold" style={{ color: cs.textMuted }}>{Math.abs(daysUntil)}</div>
                  <div className="text-xs mt-0.5" style={{ color: cs.textMuted }}>days ago</div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Key stats grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Guests",   value: total,       color: cs.accent,         icon: "👥" },
            { label: "Confirmed",      value: confirmed,   color: "var(--success)",  icon: "✓" },
            { label: "Awaiting RSVP",  value: pending,     color: "var(--warning)",  icon: "⏳" },
            { label: "Declined",       value: declined,    color: "var(--danger)",   icon: "✗" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl px-5 py-4 flex flex-col gap-1"
              style={{ background: cs.surface, border: `1px solid var(--border)` }}>
              <div className="flex items-center gap-2">
                <span>{s.icon}</span>
                <span className="text-xs" style={{ color: cs.textMuted }}>{s.label}</span>
              </div>
              <div className="font-playfair text-3xl font-bold mt-1" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── Progress bars ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* RSVP progress */}
          <div className="rounded-2xl p-5" style={{ background: cs.surface, border: `1px solid var(--border)` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold" style={{ color: cs.text }}>RSVP Progress</span>
              <span className="text-sm font-bold" style={{ color: cs.accent }}>{rsvpRate}%</span>
            </div>
            <div className="w-full rounded-full overflow-hidden flex" style={{ height: 10, background: "var(--border)" }}>
              <div style={{ width: `${total > 0 ? confirmed / total * 100 : 0}%`, background: "var(--success)", transition: "width 0.5s" }}/>
              <div style={{ width: `${total > 0 ? declined / total * 100 : 0}%`, background: "var(--danger)", transition: "width 0.5s" }}/>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: cs.textMuted }}>
              <span style={{ color: "var(--success)" }}>✓ {confirmed} confirmed</span>
              <span style={{ color: "var(--danger)" }}>✗ {declined} declined</span>
              <span>⏳ {pending} pending</span>
            </div>
          </div>

          {/* Seating progress */}
          <div className="rounded-2xl p-5" style={{ background: cs.surface, border: `1px solid var(--border)` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold" style={{ color: cs.text }}>Seating Progress</span>
              <span className="text-sm font-bold" style={{ color: cs.accent }}>{seatRate}%</span>
            </div>
            <div className="w-full rounded-full overflow-hidden" style={{ height: 10, background: "var(--border)" }}>
              <div style={{ width: `${seatRate}%`, background: cs.accent, transition: "width 0.5s" }}/>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: cs.textMuted }}>
              <span style={{ color: cs.accent }}>🪑 {seated} seated</span>
              {unseated > 0 && <span style={{ color: "var(--warning)" }}>⚠ {unseated} need a seat</span>}
              <span>{totalSeats} total seats ({tables.length} tables)</span>
            </div>
          </div>
        </div>

        {/* ── Checklist + Meal breakdown ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Checklist */}
          <div className="rounded-2xl p-5" style={{ background: cs.surface, border: `1px solid var(--border)` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm" style={{ color: cs.text }}>
                Planning Checklist
              </h3>
              <span className="text-xs rounded-full px-2 py-0.5 font-medium"
                style={{ background: cs.accentBg, color: cs.accent }}>
                {checkDone}/{checklist.length}
              </span>
            </div>
            {/* Overall progress */}
            <div className="w-full rounded-full mb-4" style={{ height: 6, background: "var(--border)" }}>
              <div style={{ width: `${checklist.length > 0 ? checkDone / checklist.length * 100 : 0}%`, background: cs.accent, borderRadius: 999, height: 6, transition: "width 0.5s" }}/>
            </div>
            <ul className="space-y-2.5">
              {checklist.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                    style={{
                      background: item.done ? "var(--success)" : "var(--border)",
                      color: item.done ? "white" : cs.textMuted,
                    }}>
                    {item.done ? "✓" : ""}
                  </div>
                  <span className="text-sm flex-1" style={{
                    color: item.done ? cs.textMuted : cs.text,
                    textDecoration: item.done ? "line-through" : "none",
                  }}>
                    {item.label}
                  </span>
                  {!item.done && !isDemo && (
                    <button
                      onClick={() => onTabChange(item.action)}
                      className="text-xs hover:underline flex-shrink-0"
                      style={{ color: cs.accent }}>
                      {item.cta}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Meal breakdown */}
          <div className="rounded-2xl p-5" style={{ background: cs.surface, border: `1px solid var(--border)` }}>
            <h3 className="font-semibold text-sm mb-4" style={{ color: cs.text }}>Meal Summary</h3>
            {Object.keys(mealCounts).length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: cs.textMuted }}>No guests added yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(mealCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([meal, count]) => {
                    const pct = confirmed > 0 ? Math.round(count / (confirmed || total) * 100) : 0;
                    return (
                      <div key={meal}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs capitalize flex items-center gap-1" style={{ color: cs.text }}>
                            {MEAL_ICON[meal] ?? "🍽"} {meal}
                          </span>
                          <span className="text-xs font-semibold" style={{ color: cs.accent }}>{count}</span>
                        </div>
                        <div className="w-full rounded-full" style={{ height: 6, background: "var(--border)" }}>
                          <div style={{ width: `${pct}%`, background: cs.accent, borderRadius: 999, height: 6, opacity: 0.7, transition: "width 0.5s" }}/>
                        </div>
                      </div>
                    );
                  })}
                <p className="text-xs mt-2" style={{ color: cs.textMuted }}>
                  Excludes declined guests · {Object.values(mealCounts).reduce((a, b) => a + b, 0)} total meals
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Table occupancy overview ── */}
        {tableStats.length > 0 && (
          <div className="rounded-2xl p-5" style={{ background: cs.surface, border: `1px solid var(--border)` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm" style={{ color: cs.text }}>Table Occupancy</h3>
              <button onClick={() => onTabChange("chart")} className="text-xs hover:underline" style={{ color: cs.accent }}>
                Open floor plan →
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {tableStats.map(t => {
                const cap  = t.capacity || 8;
                const pct  = Math.min(100, Math.round(t.count / cap * 100));
                const over = t.count > cap;
                const color = over ? "var(--danger)" : pct >= 80 ? "var(--success)" : pct >= 40 ? cs.accent : cs.textMuted;
                return (
                  <div key={t.id} className="rounded-xl p-3 text-center"
                    style={{ background: cs.surface2, border: `1px solid var(--border)` }}>
                    <div className="text-xs font-semibold truncate mb-2" style={{ color: cs.text }}>{t.name}</div>
                    {/* Circle fill indicator */}
                    <div className="relative w-12 h-12 mx-auto mb-2">
                      <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="var(--border)" strokeWidth="3"/>
                        <circle cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth="3"
                          strokeDasharray={`${pct * 0.879} 100`} strokeLinecap="round"/>
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>{pct}%</span>
                    </div>
                    <div className="text-xs" style={{ color: over ? "var(--danger)" : cs.textMuted }}>
                      {t.count}/{cap}
                      {over && <span className="ml-1" style={{ color: "var(--danger)" }}>⚠</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Groups/Parties overview ── */}
        {groups.length > 0 && (
          <div className="rounded-2xl p-5" style={{ background: cs.surface, border: `1px solid var(--border)` }}>
            <h3 className="font-semibold text-sm mb-4" style={{ color: cs.text }}>Guest Parties</h3>
            <div className="flex flex-wrap gap-2">
              {groups.map(g => {
                const count = guests.filter(gu => gu.group_id === g.id).length;
                return (
                  <div key={g.id} className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
                    style={{ background: cs.surface2, border: `1px solid var(--border)` }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: g.color }}/>
                    <span style={{ color: cs.text }}>{g.name}</span>
                    <span className="rounded-full px-1.5" style={{ background: cs.accentBg, color: cs.accent }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Quick actions ── */}
        {!isDemo && (
          <div className="rounded-2xl p-5" style={{ background: cs.surface, border: `1px solid var(--border)` }}>
            <h3 className="font-semibold text-sm mb-4" style={{ color: cs.text }}>Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              {[
                { icon: "👥", label: "Add Guest",     tab: "guests" },
                { icon: "📐", label: "Floor Plan",    tab: "chart"  },
                { icon: "📋", label: "Seating Rules", tab: "rules"  },
                { icon: "📤", label: "Export PDFs",   tab: "export" },
              ].map(a => (
                <button key={a.tab} onClick={() => onTabChange(a.tab)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
                  style={{ background: cs.surface2, border: `1px solid var(--border)`, color: cs.text }}>
                  {a.icon} {a.label}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
