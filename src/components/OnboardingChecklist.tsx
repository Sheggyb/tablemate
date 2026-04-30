"use client";

import { useState, useEffect } from "react";

interface ChecklistItem {
  key: string;
  label: string;
  hint?: string;
}

const ITEMS: ChecklistItem[] = [
  { key: "add_guest",   label: "Add your first guest",  hint: "Use the Guests tab to add a guest." },
  { key: "create_table",label: "Create a table",        hint: "Drag a table onto the floor plan." },
  { key: "run_ai",      label: "Run AI seating",        hint: "Click 'AI Seat' to auto-assign guests." },
  { key: "share_rsvp",  label: "Share RSVP link",       hint: "Find the RSVP link in Settings." },
];

const STORAGE_KEY = "tm-onboarding-checklist";

interface OnboardingChecklistProps {
  /** Pass in keys of items already completed so the widget can pre-check them. */
  completedItems?: string[];
  /** Called when user dismisses or all items are checked. */
  onDismiss?: () => void;
}

export default function OnboardingChecklist({ completedItems = [], onDismiss }: OnboardingChecklistProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState(false);
  const [minimized, setMinimized] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed: Record<string, boolean> = saved ? JSON.parse(saved) : {};
      // Merge in any completedItems passed from parent
      const merged = { ...parsed };
      completedItems.forEach(k => { merged[k] = true; });
      setChecked(merged);

      if (parsed.__dismissed) setDismissed(true);
    } catch {/* ignore */}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = (next: Record<string, boolean>) => {
    setChecked(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {/* ignore */}
  };

  const toggle = (key: string) => {
    const next = { ...checked, [key]: !checked[key] };
    save(next);
    // auto-dismiss when all checked
    if (ITEMS.every(item => next[item.key])) {
      setTimeout(() => dismiss(), 1200);
    }
  };

  const dismiss = () => {
    const next = { ...checked, __dismissed: true };
    save(next);
    setDismissed(true);
    onDismiss?.();
  };

  const completedCount = ITEMS.filter(i => checked[i.key]).length;
  const allDone = completedCount === ITEMS.length;

  if (dismissed) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 9999,
        width: 300,
        background: "#ffffff",
        border: "1px solid #EDE8E0",
        borderRadius: 16,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        overflow: "hidden",
        fontFamily: "inherit",
        transition: "all 0.2s",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg,#C9956E,#D4A882)",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
        onClick={() => setMinimized(m => !m)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🗒️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Getting Started</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 1 }}>
              {allDone ? "All done! 🎉" : `${completedCount} of ${ITEMS.length} complete`}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Mini progress ring */}
          <svg width="28" height="28" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" fill="none" />
            <circle
              cx="14" cy="14" r="10"
              stroke="#fff" strokeWidth="3" fill="none"
              strokeDasharray={`${(completedCount / ITEMS.length) * 62.8} 62.8`}
              strokeLinecap="round"
              transform="rotate(-90 14 14)"
              style={{ transition: "stroke-dasharray 0.4s ease" }}
            />
            <text x="14" y="18" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">{completedCount}/{ITEMS.length}</text>
          </svg>
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, lineHeight: 1 }}>{minimized ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Body */}
      {!minimized && (
        <div style={{ padding: "14px 16px 16px" }}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {ITEMS.map(item => (
              <li
                key={item.key}
                onClick={() => toggle(item.key)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  cursor: "pointer",
                  padding: "8px 10px",
                  borderRadius: 10,
                  background: checked[item.key] ? "#FDF8F5" : "#FDFBF8",
                  border: `1px solid ${checked[item.key] ? "#EDD5BC" : "#EDE8E0"}`,
                  transition: "all 0.15s",
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: 20, height: 20, borderRadius: 6, border: `2px solid ${checked[item.key] ? "#C9956E" : "#DDD7D0"}`,
                  background: checked[item.key] ? "#C9956E" : "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, marginTop: 1, transition: "all 0.15s",
                }}>
                  {checked[item.key] && (
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4.5L4 7.5L10 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: checked[item.key] ? "#9B9098" : "#2A2328", textDecoration: checked[item.key] ? "line-through" : "none", transition: "color 0.15s" }}>
                    {item.label}
                  </div>
                  {item.hint && !checked[item.key] && (
                    <div style={{ fontSize: 11, color: "#9B9098", marginTop: 2 }}>{item.hint}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* Footer */}
          <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={dismiss}
              style={{
                fontSize: 12, color: "#9B9098", background: "transparent", border: "none",
                cursor: "pointer", padding: "4px 8px", borderRadius: 6,
                transition: "color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#6B6068")}
              onMouseLeave={e => (e.currentTarget.style.color = "#9B9098")}
            >
              {allDone ? "✓ Got it" : "Dismiss"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
