"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/client";
import type { MenuItem, Venue } from "@/lib/types";

const CATEGORIES = ["Starter", "Main", "Dessert", "Drinks"] as const;
const CAT_ICONS: Record<string, string> = {
  Starter: "🥗",
  Main: "🍖",
  Dessert: "🍰",
  Drinks: "🍷",
};

interface Props {
  venues: Venue[];
  darkMode: boolean;
  isDemo: boolean;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function MenuPanel({ venues, isDemo, showToast }: Props) {
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

  // Load items from DB
  useEffect(() => {
    if (!venueId || isDemo) return;
    setLoading(true);
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
    // Generate QR code
    const menuUrl = `https://tablemate-beta.vercel.app/menu/${venueId}`;
    QRCode.toDataURL(menuUrl, { width: 200, margin: 2 }).then(setQrDataUrl);
  }, [venueId]); // eslint-disable-line react-hooks/exhaustive-deps

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
      // Reload to restore correct state
      supabase.from("menu_items").select("*").eq("venue_id", venueId!).then(({ data }) => {
        if (data) setMenuItems(data as MenuItem[]);
      });
    }
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
              {/* Phone frame */}
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

            {/* Add Item Form */}
            <div className="rounded-xl p-4 border" style={{ background: cs.surface2, borderColor: cs.borderSoft }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: cs.text }}>Add Menu Item</h3>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Item name *"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    onKeyDown={e => { if (e.key === "Enter" && form.name.trim()) handleAdd(); }}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    style={{ background: cs.surface, borderColor: cs.borderSoft, color: cs.text }}
                  />
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="px-3 py-2 border rounded-lg text-sm"
                    style={{ background: cs.surface, borderColor: cs.borderSoft, color: cs.text }}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    style={{ background: cs.surface, borderColor: cs.borderSoft, color: cs.text }}
                  />
                  <input
                    type="text"
                    placeholder="Price (e.g. £12)"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="w-28 px-3 py-2 border rounded-lg text-sm"
                    style={{ background: cs.surface, borderColor: cs.borderSoft, color: cs.text }}
                  />
                </div>
                <button
                  disabled={!form.name.trim() || saving || isDemo}
                  onClick={handleAdd}
                  className="w-full py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition-opacity"
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
                          {catItems.map(item => (
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
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-xs p-1 rounded hover:opacity-70 flex-shrink-0 mt-0.5"
                                style={{ color: cs.textMuted }}
                                title="Remove item"
                              >✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* QR Code Section */}
            {menuItems.length > 0 && qrDataUrl && menuUrl && (
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
