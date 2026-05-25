import { createClient } from "@supabase/supabase-js";
import type { MenuItem } from "@/lib/types";

// MIGRATION NEEDED:
// ALTER TABLE venues ADD COLUMN IF NOT EXISTS menu_template text DEFAULT 'classic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Template definitions ───────────────────────────────────────────────────
type TemplateId = "classic" | "modern" | "dark_elegant" | "rustic" | "floral" | "bold";

interface TemplateStyle {
  pageStyle: React.CSSProperties;
  fontImport: string;
  headerStyle: React.CSSProperties;
  titleStyle: React.CSSProperties;
  subtitleStyle: React.CSSProperties;
  categoryStyle: React.CSSProperties;
  itemNameStyle: React.CSSProperties;
  itemDescStyle: React.CSSProperties;
  priceStyle: React.CSSProperties;
  dividerColor: string;
  ornamentColor: string;
  itemBorderColor: string;
}

const TEMPLATE_STYLES: Record<TemplateId, TemplateStyle> = {
  classic: {
    fontImport: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Lato:wght@300;400&display=swap",
    pageStyle: { background: "linear-gradient(160deg, #faf8f4 0%, #f3ede3 100%)", minHeight: "100vh", padding: "3.5rem 1.25rem" },
    headerStyle: { textAlign: "center", marginBottom: "3rem" },
    titleStyle: { fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: "2.8rem", letterSpacing: "0.08em", color: "#2c2416", lineHeight: 1.2 },
    subtitleStyle: { fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 300, color: "#9c8b72", fontSize: "1rem", letterSpacing: "0.15em" },
    categoryStyle: { fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: "1.4rem", letterSpacing: "0.12em", color: "#5c4a2a" },
    itemNameStyle: { fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontSize: "1.15rem", color: "#2c2416", letterSpacing: "0.02em" },
    itemDescStyle: { fontFamily: "'Lato', sans-serif", fontWeight: 300, fontSize: "0.82rem", color: "#8a7560", lineHeight: 1.6, letterSpacing: "0.01em" },
    priceStyle: { fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: "1.05rem", color: "#7a6240", letterSpacing: "0.04em" },
    dividerColor: "#d9cfc2",
    ornamentColor: "#c4a97d",
    itemBorderColor: "#ece5d8",
  },
  modern: {
    fontImport: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
    pageStyle: { background: "#ffffff", minHeight: "100vh", padding: "3rem 1.25rem" },
    headerStyle: { textAlign: "center", marginBottom: "2.5rem" },
    titleStyle: { fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "2.2rem", letterSpacing: "-0.02em", color: "#111111" },
    subtitleStyle: { fontFamily: "'Inter', sans-serif", fontWeight: 400, color: "#666666", fontSize: "0.875rem", letterSpacing: "0.05em" },
    categoryStyle: { fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "#999999" },
    itemNameStyle: { fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "1rem", color: "#111111" },
    itemDescStyle: { fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "0.85rem", color: "#666666", lineHeight: 1.6 },
    priceStyle: { fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "0.95rem", color: "#111111" },
    dividerColor: "#e0e0e0",
    ornamentColor: "#cccccc",
    itemBorderColor: "#f0f0f0",
  },
  dark_elegant: {
    fontImport: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Lato:wght@300;400&display=swap",
    pageStyle: { background: "linear-gradient(160deg, #1a1a1a 0%, #111111 100%)", minHeight: "100vh", padding: "3.5rem 1.25rem" },
    headerStyle: { textAlign: "center", marginBottom: "3rem" },
    titleStyle: { fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: "2.8rem", letterSpacing: "0.08em", color: "#f5e6c8", lineHeight: 1.2 },
    subtitleStyle: { fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 300, color: "#b89b6a", fontSize: "1rem", letterSpacing: "0.15em" },
    categoryStyle: { fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: "1.4rem", letterSpacing: "0.12em", color: "#c4a97d" },
    itemNameStyle: { fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontSize: "1.15rem", color: "#f5e6c8", letterSpacing: "0.02em" },
    itemDescStyle: { fontFamily: "'Lato', sans-serif", fontWeight: 300, fontSize: "0.82rem", color: "#9a876a", lineHeight: 1.6 },
    priceStyle: { fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: "1.05rem", color: "#c4a97d", letterSpacing: "0.04em" },
    dividerColor: "#3a3020",
    ornamentColor: "#c4a97d",
    itemBorderColor: "#2a2418",
  },
  rustic: {
    fontImport: "https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Lato:wght@300;400&display=swap",
    pageStyle: { background: "linear-gradient(160deg, #f5e6d0 0%, #e8d5b7 100%)", minHeight: "100vh", padding: "3.5rem 1.25rem" },
    headerStyle: { textAlign: "center", marginBottom: "3rem" },
    titleStyle: { fontFamily: "'Caveat', cursive", fontWeight: 700, fontSize: "3.2rem", letterSpacing: "0.03em", color: "#4a2e0d", lineHeight: 1.1 },
    subtitleStyle: { fontFamily: "'Caveat', cursive", fontWeight: 400, color: "#7a5230", fontSize: "1.1rem", letterSpacing: "0.05em" },
    categoryStyle: { fontFamily: "'Caveat', cursive", fontWeight: 600, fontSize: "1.5rem", letterSpacing: "0.05em", color: "#8b6340" },
    itemNameStyle: { fontFamily: "'Caveat', cursive", fontWeight: 600, fontSize: "1.25rem", color: "#4a2e0d", letterSpacing: "0.02em" },
    itemDescStyle: { fontFamily: "'Lato', sans-serif", fontWeight: 300, fontSize: "0.82rem", color: "#6b4c2a", lineHeight: 1.6 },
    priceStyle: { fontFamily: "'Caveat', cursive", fontWeight: 600, fontSize: "1.1rem", color: "#8b6340", letterSpacing: "0.03em" },
    dividerColor: "#c4a070",
    ornamentColor: "#8b6340",
    itemBorderColor: "#d4b88a",
  },
  floral: {
    fontImport: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Lato:wght@300;400&display=swap",
    pageStyle: { background: "linear-gradient(160deg, #fce4ec 0%, #f8bbd9 50%, #fce4ec 100%)", minHeight: "100vh", padding: "3.5rem 1.25rem" },
    headerStyle: { textAlign: "center", marginBottom: "3rem" },
    titleStyle: { fontFamily: "'Playfair Display', serif", fontWeight: 500, fontSize: "2.6rem", letterSpacing: "0.04em", color: "#4a1942", lineHeight: 1.2 },
    subtitleStyle: { fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 400, color: "#880e4f", fontSize: "1rem", letterSpacing: "0.1em" },
    categoryStyle: { fontFamily: "'Playfair Display', serif", fontWeight: 500, fontSize: "1.3rem", letterSpacing: "0.08em", color: "#c2185b" },
    itemNameStyle: { fontFamily: "'Playfair Display', serif", fontWeight: 500, fontSize: "1.1rem", color: "#4a1942", letterSpacing: "0.02em" },
    itemDescStyle: { fontFamily: "'Lato', sans-serif", fontWeight: 300, fontSize: "0.82rem", color: "#880e4f", lineHeight: 1.6, opacity: 0.8 },
    priceStyle: { fontFamily: "'Playfair Display', serif", fontWeight: 400, fontSize: "1rem", color: "#c2185b", letterSpacing: "0.04em" },
    dividerColor: "#f48fb1",
    ornamentColor: "#e91e8c",
    itemBorderColor: "#fce4ec",
  },
  bold: {
    fontImport: "https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap",
    pageStyle: { background: "linear-gradient(160deg, #0d1b4b 0%, #1a2f7a 100%)", minHeight: "100vh", padding: "3.5rem 1.25rem" },
    headerStyle: { textAlign: "center", marginBottom: "3rem" },
    titleStyle: { fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "2.8rem", letterSpacing: "-0.03em", color: "#ffffff", lineHeight: 1.1, textTransform: "uppercase" as const },
    subtitleStyle: { fontFamily: "'Inter', sans-serif", fontWeight: 400, color: "#90caf9", fontSize: "0.875rem", letterSpacing: "0.2em", textTransform: "uppercase" as const },
    categoryStyle: { fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: "0.7rem", letterSpacing: "0.25em", textTransform: "uppercase" as const, color: "#4fc3f7" },
    itemNameStyle: { fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "1.05rem", color: "#ffffff", letterSpacing: "0.01em" },
    itemDescStyle: { fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: "0.82rem", color: "#90caf9", lineHeight: 1.6 },
    priceStyle: { fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#4fc3f7", letterSpacing: "0.02em" },
    dividerColor: "#1e3a8a",
    ornamentColor: "#4fc3f7",
    itemBorderColor: "#1a2f7a",
  },
};

export default async function MenuPage({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params;

  const [{ data: venue }, { data: items }] = await Promise.all([
    supabase.from("venues").select("id, name, menu_template").eq("id", venueId).single(),
    supabase
      .from("menu_items")
      .select("*")
      .eq("venue_id", venueId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const menuItems: MenuItem[] = items ?? [];

  // Get template — default to classic if column doesn't exist or is null
  const rawTemplate = (venue as Record<string, unknown> | null)?.menu_template as string | undefined;
  const templateId: TemplateId = (rawTemplate && rawTemplate in TEMPLATE_STYLES) ? (rawTemplate as TemplateId) : "classic";
  const t = TEMPLATE_STYLES[templateId];

  // Group by category
  const grouped = menuItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const categories = Object.keys(grouped);

  return (
    <>
      <style>{`
        @import url('${t.fontImport}');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
        .category-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 1.5rem;
        }
        .category-divider::before,
        .category-divider::after {
          content: '';
          flex: 1;
          border-top: 1px solid ${t.dividerColor};
        }
      `}</style>

      <div style={t.pageStyle}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>

          {/* Header */}
          <div style={t.headerStyle}>
            <div style={{ ...t.priceStyle, fontSize: "1.2rem", letterSpacing: "0.3em", marginBottom: "1rem", color: t.ornamentColor }}>✦ ✦ ✦</div>
            <h1 style={t.titleStyle}>
              {venue?.name ?? "Menu"}
            </h1>
            <hr style={{ border: "none", borderTop: `1px solid ${t.dividerColor}`, width: 60, margin: "0.75rem auto" }} />
            <p style={t.subtitleStyle}>— Our Menu —</p>
          </div>

          {categories.length === 0 ? (
            <div style={{ textAlign: "center", padding: "5rem 0" }}>
              <p style={t.subtitleStyle}>No menu available yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
              {categories.map((cat) => (
                <div key={cat}>
                  {/* Category header */}
                  <div className="category-divider">
                    <h2 style={t.categoryStyle}>{cat}</h2>
                  </div>

                  {/* Items */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    {grouped[cat].map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "1rem",
                          paddingBottom: "1.25rem",
                          borderBottom: `1px solid ${t.itemBorderColor}`,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={t.itemNameStyle}>{item.name}</p>
                          {item.description && (
                            <p style={{ ...t.itemDescStyle, marginTop: "0.25rem" }}>
                              {item.description}
                            </p>
                          )}
                        </div>
                        {item.price && (
                          <span style={{ ...t.priceStyle, whiteSpace: "nowrap", paddingTop: "2px" }}>
                            {item.price}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Footer ornament */}
              <div style={{ textAlign: "center", marginTop: "1rem", paddingTop: "2rem" }}>
                <div style={{ ...t.priceStyle, color: t.ornamentColor, fontSize: "1.2rem", letterSpacing: "0.3em" }}>✦</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
