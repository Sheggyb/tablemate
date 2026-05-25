"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/client";
import type { MenuItem, Venue } from "@/lib/types";

// MIGRATION NEEDED:
// ALTER TABLE venues ADD COLUMN IF NOT EXISTS menu_template text DEFAULT 'classic';
//
// MIGRATION NEEDED (per-item text overrides):
// ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS name_size text DEFAULT 'md';
// ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS name_weight text DEFAULT 'normal';
// ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS price_size text DEFAULT 'md';
// ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS desc_size text DEFAULT 'sm';

const CATEGORIES = ["Starter", "Main", "Dessert", "Drinks"] as const;
const CAT_ICONS: Record<string, string> = {
  Starter: "🥗",
  Main: "🍖",
  Dessert: "🍰",
  Drinks: "🍷",
};

interface TemplateOption {
  id: string;
  name: string;
  preview: React.CSSProperties;
  textColor: string;
  accentColor: string;
  subColor: string;
}

const TEMPLATES: TemplateOption[] = [
  {
    id: "classic",
    name: "Classic",
    preview: { background: "linear-gradient(135deg, #faf8f4, #f3ede3)", border: "1px solid #c4a97d" },
    textColor: "#2c2416",
    accentColor: "#c4a97d",
    subColor: "#9c8b72",
  },
  {
    id: "modern",
    name: "Modern",
    preview: { background: "#ffffff", border: "1px solid #e0e0e0" },
    textColor: "#111111",
    accentColor: "#111111",
    subColor: "#666666",
  },
  {
    id: "dark_elegant",
    name: "Dark Elegant",
    preview: { background: "linear-gradient(135deg, #1a1a1a, #111)", border: "1px solid #c4a97d" },
    textColor: "#f5e6c8",
    accentColor: "#c4a97d",
    subColor: "#b89b6a",
  },
  {
    id: "rustic",
    name: "Rustic",
    preview: { background: "linear-gradient(135deg, #f5e6d0, #e8d5b7)", border: "1px solid #8b6340" },
    textColor: "#4a2e0d",
    accentColor: "#8b6340",
    subColor: "#7a5230",
  },
  {
    id: "floral",
    name: "Floral",
    preview: { background: "linear-gradient(135deg, #fce4ec, #f8bbd9)", border: "1px solid #e91e8c" },
    textColor: "#4a1942",
    accentColor: "#c2185b",
    subColor: "#880e4f",
  },
  {
    id: "bold",
    name: "Bold",
    preview: { background: "linear-gradient(135deg, #0d1b4b, #1a2f7a)", border: "1px solid #4fc3f7" },
    textColor: "#ffffff",
    accentColor: "#4fc3f7",
    subColor: "#90caf9",
  },
];

interface Props {
  venues: Venue[];
  darkMode: boolean;
  isDemo: boolean;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  onRenameVenue?: (name: string) => void;
}

interface EditForm {
  name: string;
  description: string;
  price: string;
  category: string;
  name_size: string;
  name_weight: string;
  price_size: string;
  desc_size: string;
}

export default function MenuPanel({ venues, isDemo, showToast, onRenameVenue }: Props) {
  const cs = {
    bg: "var(--bg)",
    surface: "var(--surface)",
    surface2: "var(--surface2)",
    border: "var(--border)",
    borderSoft: "var(--border-soft)",
    text: "var(--text)",
    textMid: "var(--text-mid)",
    textSoft: "var(--text-soft)",
    textMuted: "var(--text-muted)",
    accent: "var(--accent)",
    accentDark: "var(--accent-dark)",
    accentBg: "var(--accent-bg)",
  };
  const supabase = createClient();
  const venue = venues[0];
  const venueId = venue?.id;

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "", category: "Main" });
  const [venueNameEdit, setVenueNameEdit] = useState(venue?.name ?? "");
  const [selectedTemplate, setSelectedTemplate] = useState("classic");
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: "", description: "", price: "", category: "Main", name_size: "20", name_weight: "normal", price_size: "18", desc_size: "14" });
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => { setVenueNameEdit(venue?.name ?? ""); }, [venue?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load items and template from DB
  useEffect(() => {
    if (!venueId || isDemo) return;
    setLoading(true);

    // Load menu items
    supabase
      .from("menu_items")
      .select("*")
      .eq("venue_id", venueId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        setLoading(false);
        if (error) { showToast("Failed to load menu items", "error"); return; }
        if (data) setMenuItems(data as MenuItem[]);
      });

    // Load template — gracefully handle if column doesn't exist
    supabase
      .from("venues")
      .select("menu_template")
      .eq("id", venueId)
      .single()
      .then(({ data }) => {
        if (data && (data as Record<string, unknown>).menu_template) {
          setSelectedTemplate((data as Record<string, unknown>).menu_template as string);
        }
      });

    // Generate QR code
    const menuUrl = `https://tablemate-beta.vercel.app/menu/${venueId}`;
    QRCode.toDataURL(menuUrl, { width: 200, margin: 2 }).then(setQrDataUrl);
  }, [venueId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectTemplate = async (templateId: string) => {
    setSelectedTemplate(templateId);
    if (!venueId || isDemo) return;
    setSavingTemplate(true);
    const { error } = await supabase
      .from("venues")
      .update({ menu_template: templateId })
      .eq("id", venueId);
    setSavingTemplate(false);
    if (error) {
      showToast("Could not save template — " + error.message, "error");
    } else {
      showToast(`Template set to ${TEMPLATES.find(t => t.id === templateId)?.name ?? templateId} ✓`, "success");
    }
  };

  const handleAdd = async () => {
    if (!venueId || !form.name.trim() || isDemo) return;
    setSaving(true);
    const newItem = {
      venue_id: venueId,
      category: form.category,
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: form.price.trim() || null,
      sort_order: menuItems.length,
    };
    const { data, error } = await supabase.from("menu_items").insert(newItem).select().single();
    setSaving(false);
    if (error || !data) {
      showToast("Failed to add item — " + (error?.message ?? "unknown error"), "error");
      return;
    }
    setMenuItems(prev => [...prev, data as MenuItem]);
    setForm(f => ({ ...f, name: "", description: "", price: "" }));
    showToast(`${form.name.trim()} added ✓`, "success");
  };

  const handleDelete = async (id: string) => {
    setMenuItems(prev => prev.filter(i => i.id !== id));
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) {
      showToast("Failed to delete item", "error");
      supabase.from("menu_items").select("*").eq("venue_id", venueId!).then(({ data }) => {
        if (data) setMenuItems(data as MenuItem[]);
      });
    }
  };

  const startEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      description: item.description ?? "",
      price: item.price ?? "",
      category: item.category,
      name_size: item.name_size || "20",
      name_weight: item.name_weight || "normal",
      price_size: item.price_size || "18",
      desc_size: item.desc_size || "14",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    if (!editForm.name.trim()) return;
    setEditSaving(true);
    const { error } = await supabase
      .from("menu_items")
      .update({
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        price: editForm.price.trim() || null,
        category: editForm.category,
        name_size: editForm.name_size,
        name_weight: editForm.name_weight,
        price_size: editForm.price_size,
        desc_size: editForm.desc_size,
      })
      .eq("id", id);
    setEditSaving(false);
    if (error) {
      showToast("Failed to save changes — " + error.message, "error");
      return;
    }
    setMenuItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, name: editForm.name.trim(), description: editForm.description.trim() || null, price: editForm.price.trim() || null, category: editForm.category, name_size: editForm.name_size, name_weight: editForm.name_weight, price_size: editForm.price_size, desc_size: editForm.desc_size }
          : item
      )
    );
    setEditingId(null);
    showToast("Item updated ✓", "success");
  };

  // Group items by category
  const grouped = CATEGORIES.reduce<Record<string, MenuItem[]>>((acc, cat) => {
    acc[cat] = menuItems.filter(i => i.category === cat);
    return acc;
  }, {} as Record<string, MenuItem[]>);
  const extraCats = [...new Set(menuItems.map(i => i.category))].filter(c => !CATEGORIES.includes(c as typeof CATEGORIES[number]));
  extraCats.forEach(cat => { grouped[cat] = menuItems.filter(i => i.category === cat); });
  const allCats = [...CATEGORIES, ...extraCats];

  const menuUrl = venueId ? `https://tablemate-beta.vercel.app/menu/${venueId}` : null;

  const inputStyle = {
    background: cs.surface,
    borderColor: cs.borderSoft,
    color: cs.text,
  };

  if (!venueId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-4xl mb-3">🍽️</div>
        <p className="text-sm" style={{ color: cs.textMuted }}>No venue found. Add a floor in the Seating Chart tab first.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b" style={{ borderColor: cs.border }}>
        <div>
          <h2 className="font-playfair text-xl font-bold" style={{ color: cs.text }}>🍽️ Menu Builder</h2>
          <p className="text-xs mt-0.5" style={{ color: cs.textMuted }}>Build your menu — guests scan the QR code to view it on their phones</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode(p => !p)}
            className="px-3 py-1.5 text-xs rounded-lg border font-medium transition-all"
            style={{
              background: previewMode ? cs.accent : "transparent",
              color: previewMode ? "white" : cs.textSoft,
              borderColor: previewMode ? cs.accent : cs.borderSoft,
            }}
          >
            {previewMode ? "✏️ Edit" : "👁 Preview"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {previewMode ? (
          /* ── Live Preview ── */
          <div className="p-6">
            <div className="max-w-sm mx-auto">
              <div className="rounded-2xl overflow-hidden shadow-xl border-2" style={{ borderColor: cs.border }}>
                <div className="bg-stone-50 py-8 px-5">
                  <div className="text-center mb-6">
                    <div className="text-3xl mb-2">🍽️</div>
                    <h1 className="text-2xl font-bold text-stone-800">{venue.name}</h1>
                    <p className="text-xs text-stone-400 mt-1">Menu</p>
                  </div>
                  {menuItems.length === 0 ? (
                    <p className="text-center text-stone-400 text-sm py-8">No items yet — add some below</p>
                  ) : (
                    <div className="space-y-6">
                      {allCats.map(cat => {
                        const catItems = grouped[cat] ?? [];
                        if (catItems.length === 0) return null;
                        return (
                          <div key={cat}>
                            <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2 border-b border-stone-200 pb-1.5">
                              {CAT_ICONS[cat] ?? "🍽️"} {cat}
                            </h2>
                            <div className="space-y-2">
                              {catItems.map(item => (
                                <div key={item.id} className="bg-white rounded-xl p-3 shadow-sm border border-stone-100 flex justify-between items-start gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-stone-800 text-xs">{item.name}</p>
                                    {item.description && <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">{item.description}</p>}
                                  </div>
                                  {item.price && <span className="text-stone-700 font-semibold text-xs whitespace-nowrap">{item.price}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-center text-xs mt-3" style={{ color: cs.textMuted }}>Live preview of <code className="px-1 py-0.5 rounded text-xs" style={{ background: cs.surface2 }}>/menu/{venueId?.slice(0,8)}…</code></p>
            </div>
          </div>
        ) : (
          /* ── Edit Mode ── */
          <div className="p-6 space-y-6 max-w-2xl">

            {/* Venue / Menu title */}
            <div className="rounded-xl p-4 border" style={{ background: cs.surface2, borderColor: cs.borderSoft }}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: cs.textSoft }}>Menu page title</label>
              <input
                type="text"
                value={venueNameEdit}
                onChange={e => setVenueNameEdit(e.target.value)}
                onBlur={() => { if (venueNameEdit.trim() && venueNameEdit.trim() !== venue.name) onRenameVenue?.(venueNameEdit.trim()); }}
                onKeyDown={e => { if (e.key === "Enter") { (e.target as HTMLInputElement).blur(); } }}
                placeholder="e.g. The Grand Ballroom"
                className="w-full px-3 py-2 border rounded-lg text-sm font-medium"
                style={{ background: cs.surface, borderColor: cs.borderSoft, color: cs.text }}
                disabled={isDemo}
              />
              <p className="text-xs mt-1.5" style={{ color: cs.textMuted }}>Shown as the title on your guest menu page</p>
            </div>

            {/* ── Style Templates ── */}
            <div className="rounded-xl p-4 border" style={{ background: cs.surface2, borderColor: cs.borderSoft }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold" style={{ color: cs.text }}>🎨 Menu Style</h3>
                {savingTemplate && <span className="text-xs" style={{ color: cs.textMuted }}>Saving…</span>}
              </div>
              <div
                className="flex gap-3 overflow-x-auto pb-2"
                style={{ scrollbarWidth: "thin" }}
              >
                {TEMPLATES.map(tpl => {
                  const isActive = selectedTemplate === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => handleSelectTemplate(tpl.id)}
                      disabled={isDemo}
                      title={tpl.name}
                      style={{
                        flexShrink: 0,
                        width: 90,
                        borderRadius: 10,
                        border: isActive ? `2px solid ${cs.accent}` : "2px solid transparent",
                        padding: 3,
                        background: "transparent",
                        cursor: isDemo ? "not-allowed" : "pointer",
                        opacity: isDemo ? 0.5 : 1,
                        outline: "none",
                      }}
                    >
                      {/* Mini preview card */}
                      <div
                        style={{
                          ...tpl.preview,
                          borderRadius: 7,
                          height: 60,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                          padding: "6px 4px",
                        }}
                      >
                        <div style={{ width: 40, height: 3, borderRadius: 2, background: tpl.accentColor, opacity: 0.9 }} />
                        <div style={{ width: 52, height: 2, borderRadius: 2, background: tpl.textColor, opacity: 0.6 }} />
                        <div style={{ width: 36, height: 2, borderRadius: 2, background: tpl.subColor, opacity: 0.5 }} />
                      </div>
                      <p
                        className="text-center mt-1.5"
                        style={{
                          fontSize: 11,
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? cs.accent : cs.textSoft,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isActive ? "✓ " : ""}{tpl.name}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add Item Form */}
            <div className="rounded-xl p-4 border" style={{ background: cs.surface2, borderColor: cs.borderSoft }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: cs.text }}>Add Menu Item</h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1" style={{ color: cs.textSoft }}>Item name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Grilled Salmon"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      onKeyDown={e => { if (e.key === "Enter" && form.name.trim()) handleAdd(); }}
                      className="w-full px-3 py-2.5 border rounded-lg text-sm"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: cs.textSoft }}>Category</label>
                    <select
                      value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="px-3 py-2.5 border rounded-lg text-sm"
                      style={{ background: cs.surface, borderColor: cs.borderSoft, color: cs.text, appearance: "auto" as const }}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1" style={{ color: cs.textSoft }}>Description</label>
                    <input
                      type="text"
                      placeholder="Optional description…"
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full px-3 py-2.5 border rounded-lg text-sm"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ width: 130 }}>
                    <label className="block text-xs font-medium mb-1" style={{ color: cs.textSoft }}>Price</label>
                    <input
                      type="text"
                      placeholder="e.g. £12.00"
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                      className="w-full px-3 py-2.5 border rounded-lg text-sm font-semibold"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <button
                  disabled={!form.name.trim() || saving || isDemo}
                  onClick={handleAdd}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition-opacity"
                  style={{ background: cs.accent }}
                >
                  {saving ? "Adding…" : isDemo ? "Sign up to add items" : "+ Add Item"}
                </button>
              </div>
            </div>

            {/* Items List */}
            {loading ? (
              <p className="text-sm text-center py-4" style={{ color: cs.textMuted }}>Loading…</p>
            ) : menuItems.length === 0 ? (
              <div className="text-center py-8 rounded-xl border border-dashed" style={{ borderColor: cs.borderSoft }}>
                <p className="text-3xl mb-2">🍽️</p>
                <p className="text-sm font-medium" style={{ color: cs.textSoft }}>No menu items yet</p>
                <p className="text-xs mt-1" style={{ color: cs.textMuted }}>Add your first item above</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold" style={{ color: cs.text }}>
                    Menu Items <span className="font-normal" style={{ color: cs.textMuted }}>({menuItems.length})</span>
                  </h3>
                </div>
                <div className="space-y-4">
                  {allCats.map(cat => {
                    const catItems = grouped[cat] ?? [];
                    if (catItems.length === 0) return null;
                    return (
                      <div key={cat}>
                        <p className="text-xs font-semibold uppercase tracking-widest mb-2 pb-1 border-b" style={{ color: cs.textMuted, borderColor: cs.borderSoft }}>
                          {CAT_ICONS[cat] ?? "🍽️"} {cat}
                        </p>
                        <div className="space-y-1.5">
                          {catItems.map(item => {
                            if (editingId === item.id) {
                              /* ── Inline Edit Form ── */
                              return (
                                <div
                                  key={item.id}
                                  className="rounded-lg border p-3 space-y-2"
                                  style={{ background: cs.surface2, borderColor: cs.accent }}
                                >
                                  <div className="flex gap-2">
                                    <div className="flex-1">
                                      <label className="block text-xs font-medium mb-0.5" style={{ color: cs.textSoft }}>Name *</label>
                                      <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                        className="w-full px-2.5 py-2 border rounded-lg text-sm"
                                        style={inputStyle}
                                        autoFocus
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium mb-0.5" style={{ color: cs.textSoft }}>Category</label>
                                      <select
                                        value={editForm.category}
                                        onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                                        className="px-2.5 py-2 border rounded-lg text-sm"
                                        style={{ background: cs.surface, borderColor: cs.borderSoft, color: cs.text, appearance: "auto" as const }}
                                      >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                                      </select>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <div className="flex-1">
                                      <label className="block text-xs font-medium mb-0.5" style={{ color: cs.textSoft }}>Description</label>
                                      <input
                                        type="text"
                                        value={editForm.description}
                                        onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                                        placeholder="Optional…"
                                        className="w-full px-2.5 py-2 border rounded-lg text-sm"
                                        style={inputStyle}
                                      />
                                    </div>
                                    <div style={{ width: 120 }}>
                                      <label className="block text-xs font-medium mb-0.5" style={{ color: cs.textSoft }}>Price</label>
                                      <input
                                        type="text"
                                        value={editForm.price}
                                        onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                                        placeholder="e.g. £12"
                                        className="w-full px-2.5 py-2 border rounded-lg text-sm font-semibold"
                                        style={inputStyle}
                                      />
                                    </div>
                                  </div>
                                  {/* ── Per-item text style overrides ── */}
                                  <div className="rounded-lg p-2.5 border space-y-3" style={{ background: cs.surface, borderColor: cs.borderSoft }}>
                                    <p className="text-xs font-semibold" style={{ color: cs.textSoft }}>🎨 Text style overrides</p>
                                    <style>{`
                                      .tm-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; border-radius: 2px; outline: none; cursor: pointer; }
                                      .tm-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--accent); cursor: pointer; transition: transform 0.15s; }
                                      .tm-slider::-webkit-slider-thumb:hover { transform: scale(1.25); }
                                      .tm-slider::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: var(--accent); cursor: pointer; border: none; }
                                    `}</style>
                                    {/* Name size */}
                                    <div>
                                      <div className="flex items-center justify-between mb-1">
                                        <label className="text-xs" style={{ color: cs.textMuted }}>Name size</label>
                                        <span className="text-xs font-bold" style={{ color: cs.accent }}>{editForm.name_size}px</span>
                                      </div>
                                      <input
                                        type="range"
                                        min={14} max={48} step={2}
                                        value={editForm.name_size}
                                        onChange={e => setEditForm(f => ({ ...f, name_size: e.target.value }))}
                                        className="tm-slider"
                                        style={{ background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${((parseInt(editForm.name_size) - 14) / (48 - 14)) * 100}%, var(--border-soft) ${((parseInt(editForm.name_size) - 14) / (48 - 14)) * 100}%, var(--border-soft) 100%)` }}
                                      />
                                    </div>
                                    {/* Name weight */}
                                    <div>
                                      <label className="block text-xs mb-1" style={{ color: cs.textMuted }}>Name weight</label>
                                      <div className="flex gap-1">
                                        {(["normal", "medium", "bold"] as const).map(w => (
                                          <button
                                            key={w}
                                            type="button"
                                            onClick={() => setEditForm(f => ({ ...f, name_weight: w }))}
                                            className="flex-1 py-1 rounded-full text-xs font-medium transition-all"
                                            style={{
                                              background: editForm.name_weight === w ? cs.accent : cs.surface2,
                                              color: editForm.name_weight === w ? "white" : cs.textSoft,
                                              border: `1px solid ${editForm.name_weight === w ? cs.accent : cs.borderSoft}`,
                                            }}
                                          >
                                            {w.charAt(0).toUpperCase() + w.slice(1)}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    {/* Price size */}
                                    <div>
                                      <div className="flex items-center justify-between mb-1">
                                        <label className="text-xs" style={{ color: cs.textMuted }}>Price size</label>
                                        <span className="text-xs font-bold" style={{ color: cs.accent }}>{editForm.price_size}px</span>
                                      </div>
                                      <input
                                        type="range"
                                        min={14} max={42} step={2}
                                        value={editForm.price_size}
                                        onChange={e => setEditForm(f => ({ ...f, price_size: e.target.value }))}
                                        className="tm-slider"
                                        style={{ background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${((parseInt(editForm.price_size) - 14) / (42 - 14)) * 100}%, var(--border-soft) ${((parseInt(editForm.price_size) - 14) / (42 - 14)) * 100}%, var(--border-soft) 100%)` }}
                                      />
                                    </div>
                                    {/* Description size */}
                                    <div>
                                      <div className="flex items-center justify-between mb-1">
                                        <label className="text-xs" style={{ color: cs.textMuted }}>Description size</label>
                                        <span className="text-xs font-bold" style={{ color: cs.accent }}>{editForm.desc_size}px</span>
                                      </div>
                                      <input
                                        type="range"
                                        min={12} max={24} step={1}
                                        value={editForm.desc_size}
                                        onChange={e => setEditForm(f => ({ ...f, desc_size: e.target.value }))}
                                        className="tm-slider"
                                        style={{ background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${((parseInt(editForm.desc_size) - 12) / (24 - 12)) * 100}%, var(--border-soft) ${((parseInt(editForm.desc_size) - 12) / (24 - 12)) * 100}%, var(--border-soft) 100%)` }}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2 pt-1">
                                    <button
                                      disabled={!editForm.name.trim() || editSaving}
                                      onClick={() => saveEdit(item.id)}
                                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40"
                                      style={{ background: cs.accent }}
                                    >
                                      {editSaving ? "Saving…" : "✓ Save"}
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      className="px-4 py-1.5 rounded-lg text-xs font-medium border"
                                      style={{ borderColor: cs.borderSoft, color: cs.textSoft }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            /* ── Normal Item Row ── */
                            return (
                              <div
                                key={item.id}
                                className="flex items-start gap-3 px-3 py-2.5 rounded-lg border"
                                style={{ background: cs.surface2, borderColor: cs.borderSoft }}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium" style={{ color: cs.text }}>{item.name}</span>
                                    {item.price && (
                                      <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ background: cs.surface, color: cs.textSoft }}>
                                        {item.price}
                                      </span>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: cs.textMuted }}>{item.description}</p>
                                  )}
                                </div>
                                {/* Edit button */}
                                <button
                                  onClick={() => startEdit(item)}
                                  className="text-xs p-1 rounded hover:opacity-70 flex-shrink-0 mt-0.5"
                                  style={{ color: cs.textSoft }}
                                  title="Edit item"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="text-xs p-1 rounded hover:opacity-70 flex-shrink-0 mt-0.5"
                                  style={{ color: cs.textMuted }}
                                  title="Remove item"
                                >✕</button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* QR Code Section */}
            {qrDataUrl && menuUrl && (
              <div className="rounded-xl p-4 border text-center" style={{ background: cs.surface2, borderColor: cs.borderSoft }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: cs.text }}>📱 Guest QR Code</h3>
                <img src={qrDataUrl} alt="Menu QR Code" className="w-36 h-36 rounded-lg mx-auto mb-3 border" style={{ borderColor: cs.border }} />
                <p className="text-xs mb-3" style={{ color: cs.textMuted }}>
                  Guests scan this to view the menu on their phones
                </p>
                <div className="flex gap-2 justify-center">
                  <a
                    href={qrDataUrl}
                    download="menu-qr.png"
                    className="px-3 py-1.5 text-xs rounded-lg border font-medium hover:opacity-80"
                    style={{ borderColor: cs.borderSoft, color: cs.textSoft }}
                  >
                    ⬇ Download QR
                  </a>
                  <a
                    href={menuUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs rounded-lg border font-medium hover:opacity-80"
                    style={{ borderColor: cs.borderSoft, color: cs.textSoft }}
                  >
                    🔗 Open Menu Page
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
