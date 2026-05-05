"use client";

import { useState, useRef, useEffect } from "react";
import type { Guest, Rule, Table } from "@/lib/types";

interface Props {
  rules:        Rule[];
  guests:       Guest[];
  tables:       Table[];
  violations:   Rule[];
  darkMode:     boolean;
  isDemo?:      boolean;
  onAddRule:    (g1: string, g2: string, type: "must_sit_with" | "must_not_sit_with") => void;
  onDeleteRule: (id: string) => void;
}

export default function RulesPanel({ rules, guests, tables, violations, darkMode, isDemo = false, onAddRule, onDeleteRule }: Props) {
  const [g1, setG1]     = useState("");
  const [g2, setG2]     = useState("");
  const [type, setType] = useState<"must_sit_with" | "must_not_sit_with">("must_sit_with");

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
  };

  const inputStyle = { background: cs.surface, borderColor: cs.borderSoft, color: cs.text };

  const guestName = (id: string) => {
    const g = guests.find(g => g.id === id);
    return g ? `${g.first_name} ${g.last_name}` : "Unknown";
  };

  const tableName = (guestId: string) => {
    const g = guests.find(g => g.id === guestId);
    if (!g?.table_id) return null;
    return tables.find(t => t.id === g.table_id)?.name ?? null;
  };

  const handleAdd = () => {
    if (!g1 || !g2 || g1 === g2) return;
    const exists = rules.some(r =>
      r.type === type &&
      ((r.guest1_id === g1 && r.guest2_id === g2) || (r.guest1_id === g2 && r.guest2_id === g1))
    );
    if (exists) return;
    onAddRule(g1, g2, type);
    setG1(""); setG2("");
  };

  const must    = rules.filter(r => r.type === "must_sit_with");
  const mustNot = rules.filter(r => r.type === "must_not_sit_with");

  return (
    <div className="h-full overflow-y-auto" style={{ background: cs.bg }}>
      <div className="max-w-2xl mx-auto px-6 py-8">

        <h2 className="font-playfair text-2xl font-bold mb-1" style={{ color: cs.text }}>Seating Rules</h2>
        <p className="text-sm mb-8" style={{ color: cs.textSoft }}>
          Rules help you manually place guests correctly and are respected by the Smart Seating engine.
        </p>

        {/* Add rule */}
        <div className="rounded-2xl p-6 mb-6" style={{ background: cs.surface, border: `1px solid ${cs.border}` }}>
          <h3 className="font-semibold text-sm mb-4" style={{ color: cs.text }}>Add a rule</h3>
          {isDemo ? (
            <a href="/signup" className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
              style={{ background: cs.surface2, border: `1px solid ${cs.border}`, color: cs.textMuted }}>
              🔒 Sign up to add seating rules
            </a>
          ) : (
            <div className="flex flex-wrap gap-3 items-center">
              <GuestCombobox value={g1} onChange={setG1} guests={guests} placeholder="Search guest 1…" exclude={g2} cs={cs} />
              <select value={type} onChange={e => setType(e.target.value as any)}
                className="px-3 py-2 border rounded-lg text-sm" style={inputStyle}>
                <option value="must_sit_with">must sit with</option>
                <option value="must_not_sit_with">must NOT sit with</option>
              </select>
              <GuestCombobox value={g2} onChange={setG2} guests={guests} placeholder="Search guest 2…" exclude={g1} cs={cs} />
              <button onClick={handleAdd} disabled={!g1 || !g2 || g1 === g2}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40 hover:opacity-90"
                style={{ background: cs.accent }}>
                Add Rule
              </button>
            </div>
          )}
        </div>

        {/* Violations */}
        {violations.length > 0 && (
          <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(224,92,106,0.08)", border: "1px solid rgba(224,92,106,0.25)" }}>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: "var(--danger)" }}>
              <span>⚠</span> {violations.length} Rule Violation{violations.length !== 1 ? "s" : ""}
            </h3>
            <div className="space-y-2">
              {violations.map(r => {
                const tn1 = tableName(r.guest1_id);
                const tn2 = tableName(r.guest2_id);
                return (
                  <div key={r.id} className="text-sm" style={{ color: "var(--danger)" }}>
                    <strong>{guestName(r.guest1_id)}</strong>
                    {tn1 && <span className="text-xs opacity-70"> ({tn1})</span>}
                    <span className="mx-2 opacity-60">{r.type === "must_sit_with" ? "should be with" : "should not be with"}</span>
                    <strong>{guestName(r.guest2_id)}</strong>
                    {tn2 && <span className="text-xs opacity-70"> ({tn2})</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rules list */}
        {rules.length === 0 ? (
          <div className="text-center py-12" style={{ color: cs.textMuted }}>
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm">No rules yet. Add rules to keep families together or exes apart!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {must.length > 0 && (
              <RuleGroup
                title="✓ Must sit together"
                colorScheme="green"
                rules={must}
                guestName={guestName}
                tableName={tableName}
                violations={violations}
                onDelete={onDeleteRule}
                isDemo={isDemo}
                cs={cs}
              />
            )}
            {mustNot.length > 0 && (
              <RuleGroup
                title="✗ Must NOT sit together"
                colorScheme="red"
                rules={mustNot}
                guestName={guestName}
                tableName={tableName}
                violations={violations}
                onDelete={onDeleteRule}
                isDemo={isDemo}
                cs={cs}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Typeahead guest combobox ── */
function GuestCombobox({ value, onChange, guests, placeholder, exclude, cs }: {
  value: string;
  onChange: (v: string) => void;
  guests: Guest[];
  placeholder: string;
  exclude: string;
  cs: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen]   = useState(false);
  const ref               = useRef<HTMLDivElement>(null);

  const selected = guests.find(g => g.id === value);
  const displayVal = selected ? `${selected.first_name} ${selected.last_name}` : "";

  const filtered = guests
    .filter(g => g.id !== exclude)
    .filter(g => {
      if (!query) return true;
      return `${g.first_name} ${g.last_name}`.toLowerCase().includes(query.toLowerCase());
    })
    .slice(0, 30); // cap dropdown at 30 results

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (id: string) => {
    onChange(id);
    setQuery("");
    setOpen(false);
  };

  const clear = () => {
    onChange("");
    setQuery("");
  };

  return (
    <div ref={ref} className="relative" style={{ minWidth: 200 }}>
      <div
        className="flex items-center gap-1 px-3 py-2 border rounded-lg text-sm cursor-text"
        style={{ background: cs.surface, borderColor: open ? cs.accent : cs.borderSoft, color: cs.text }}
        onClick={() => { setOpen(true); }}
      >
        {selected && !open ? (
          <>
            <span className="flex-1 truncate">{displayVal}</span>
            <button onMouseDown={e => { e.preventDefault(); clear(); }}
              className="text-xs opacity-50 hover:opacity-100 flex-shrink-0" style={{ color: cs.textMuted }}>×</button>
          </>
        ) : (
          <input
            autoFocus={open}
            type="text"
            value={open ? query : displayVal}
            placeholder={placeholder}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            className="flex-1 bg-transparent outline-none text-sm min-w-0"
            style={{ color: cs.text }}
          />
        )}
      </div>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 rounded-xl shadow-xl overflow-hidden z-50"
          style={{
            background: cs.surface,
            border: `1px solid ${cs.border}`,
            minWidth: "100%",
            maxHeight: 260,
            overflowY: "auto",
          }}
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-xs" style={{ color: cs.textMuted }}>No guests found</div>
          ) : (
            filtered.map(g => (
              <button
                key={g.id}
                onMouseDown={e => { e.preventDefault(); select(g.id); }}
                className="w-full text-left px-4 py-2.5 text-sm hover:opacity-80 flex items-center gap-2"
                style={{
                  background: g.id === value ? cs.accentBg : "transparent",
                  color: g.id === value ? cs.accent : cs.text,
                  borderBottom: `1px solid ${cs.border}`,
                }}
              >
                <span className="flex-1">{g.first_name} {g.last_name}</span>
                {g.table_id && (
                  <span className="text-xs flex-shrink-0" style={{ color: cs.textMuted }}>
                    {/* table name shown in tooltip */}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function RuleGroup({ title, colorScheme, rules, guestName, tableName, violations, onDelete, isDemo = false, cs }: {
  title: string;
  colorScheme: "green" | "red";
  rules: Rule[];
  guestName: (id: string) => string;
  tableName: (id: string) => string | null;
  violations: Rule[];
  onDelete: (id: string) => void;
  isDemo?: boolean;
  cs: Record<string, string>;
}) {
  const isGreen = colorScheme === "green";
  const bg = isGreen ? "rgba(76,175,125,0.08)" : "rgba(224,92,106,0.08)";
  const border = isGreen ? "rgba(76,175,125,0.25)" : "rgba(224,92,106,0.25)";
  const titleColor = isGreen ? "var(--success)" : "var(--danger)";
  const textColor  = isGreen ? "var(--success)" : "var(--danger)";

  return (
    <div className="rounded-xl p-4" style={{ background: bg, border: `1px solid ${border}` }}>
      <h4 className="text-sm font-semibold mb-3" style={{ color: titleColor }}>{title}</h4>
      <div className="space-y-2">
        {rules.map(r => {
          const isViolated = violations.some(v => v.id === r.id);
          const tn1 = tableName(r.guest1_id);
          const tn2 = tableName(r.guest2_id);
          return (
            <div key={r.id} className="flex items-center gap-3 group">
              {isViolated && <span className="text-xs flex-shrink-0" style={{ color: "var(--danger)" }}>⚠</span>}
              <span className="text-sm flex-1" style={{ color: isViolated ? "var(--danger)" : textColor }}>
                <strong>{guestName(r.guest1_id)}</strong>
                {tn1 && <span className="text-xs opacity-60 ml-1">({tn1})</span>}
                <span className="mx-2 opacity-50">{r.type === "must_sit_with" ? "↔" : "↮"}</span>
                <strong>{guestName(r.guest2_id)}</strong>
                {tn2 && <span className="text-xs opacity-60 ml-1">({tn2})</span>}
              </span>
              <button onClick={() => onDelete(r.id)}
                className="text-xs px-2 py-1 rounded-lg font-semibold transition-opacity hover:opacity-70 flex-shrink-0"
                style={{ color: "var(--danger)", background: "rgba(224,92,106,0.12)", display: isDemo ? "none" : undefined }}>✕ Remove</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
