"use client";

import { useState } from "react";
import type { Guest, Rule } from "@/lib/types";

interface Props {
  rules:       Rule[];
  guests:      Guest[];
  onAddRule:   (g1: string, g2: string, type: "must_sit_with" | "must_not_sit_with") => void;
  onDeleteRule: (id: string) => void;
}

export default function RulesPanel({ rules, guests, onAddRule, onDeleteRule }: Props) {
  const [g1, setG1]     = useState("");
  const [g2, setG2]     = useState("");
  const [type, setType] = useState<"must_sit_with" | "must_not_sit_with">("must_sit_with");

  const guestName = (id: string) => {
    const g = guests.find(g => g.id === id);
    return g ? `${g.first_name} ${g.last_name}` : "Unknown";
  };

  const handleAdd = () => {
    if (!g1 || !g2 || g1 === g2) return;
    onAddRule(g1, g2, type);
    setG1(""); setG2("");
  };

  const must    = rules.filter(r => r.type === "must_sit_with");
  const mustNot = rules.filter(r => r.type === "must_not_sit_with");

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h2 className="font-playfair text-2xl font-bold text-[#2A2328] mb-2">Seating Rules</h2>
      <p className="text-sm text-[#6B6068] mb-8">
        Rules are respected by the AI seating optimizer and help you manually place guests correctly.
      </p>

      {/* Add rule */}
      <div className="bg-white border border-[#EDE8E0] rounded-2xl p-6 mb-8">
        <h3 className="font-semibold text-[#2A2328] text-sm mb-4">Add a rule</h3>
        <div className="flex flex-wrap gap-3 items-center">
          <GuestSelect value={g1} onChange={setG1} guests={guests} placeholder="Guest 1" exclude={g2}/>
          <select value={type} onChange={e => setType(e.target.value as any)}
            className="px-3 py-2 border border-[#DDD7D0] rounded-lg text-sm focus:outline-none focus:border-[#C9956E] text-[#4A4348]">
            <option value="must_sit_with">must sit with</option>
            <option value="must_not_sit_with">must NOT sit with</option>
          </select>
          <GuestSelect value={g2} onChange={setG2} guests={guests} placeholder="Guest 2" exclude={g1}/>
          <button onClick={handleAdd} disabled={!g1 || !g2 || g1 === g2}
            className="px-4 py-2 bg-[#C9956E] hover:bg-[#B8845D] disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors">
            Add Rule
          </button>
        </div>
      </div>

      {/* Rules list */}
      {rules.length === 0 ? (
        <div className="text-center py-12 text-[#9B9098]">
          <div className="text-3xl mb-3">📋</div>
          <p className="text-sm">No rules yet. Add rules to keep families together or exes apart!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {must.length > 0 && (
            <RuleGroup title="✓ Must sit together" color="green" rules={must} guestName={guestName} onDelete={onDeleteRule}/>
          )}
          {mustNot.length > 0 && (
            <RuleGroup title="✗ Must NOT sit together" color="red" rules={mustNot} guestName={guestName} onDelete={onDeleteRule}/>
          )}
        </div>
      )}
    </div>
  );
}

function GuestSelect({ value, onChange, guests, placeholder, exclude }: {
  value: string; onChange: (v: string) => void; guests: Guest[]; placeholder: string; exclude: string;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="px-3 py-2 border border-[#DDD7D0] rounded-lg text-sm focus:outline-none focus:border-[#C9956E] text-[#4A4348] min-w-[160px]">
      <option value="">{placeholder}</option>
      {guests.filter(g => g.id !== exclude).map(g => (
        <option key={g.id} value={g.id}>{g.first_name} {g.last_name}</option>
      ))}
    </select>
  );
}

function RuleGroup({ title, color, rules, guestName, onDelete }: {
  title: string; color: "green"|"red"; rules: Rule[]; guestName: (id: string) => string; onDelete: (id: string) => void;
}) {
  const cls = color === "green"
    ? "bg-green-50 border-green-200"
    : "bg-red-50 border-red-200";
  const txtCls = color === "green" ? "text-green-800" : "text-red-800";
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <h4 className={`text-sm font-semibold mb-3 ${txtCls}`}>{title}</h4>
      <div className="space-y-2">
        {rules.map(r => (
          <div key={r.id} className="flex items-center gap-3 group">
            <span className={`text-sm ${txtCls} flex-1`}>
              <strong>{guestName(r.guest1_id)}</strong>
              <span className="mx-2 opacity-60">{r.type === "must_sit_with" ? "↔" : "↮"}</span>
              <strong>{guestName(r.guest2_id)}</strong>
            </span>
            <button onClick={() => onDelete(r.id)}
              className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-600 transition-opacity">
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
