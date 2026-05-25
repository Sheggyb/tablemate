import { createClient } from "@supabase/supabase-js";
import type { MenuItem } from "@/lib/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function MenuPage({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params;

  const [{ data: venue }, { data: items }] = await Promise.all([
    supabase.from("venues").select("id, name").eq("id", venueId).single(),
    supabase
      .from("menu_items")
      .select("*")
      .eq("venue_id", venueId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const menuItems: MenuItem[] = items ?? [];

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
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Lato:wght@300;400&display=swap');

        .menu-root {
          font-family: 'Lato', sans-serif;
        }
        .menu-venue-name {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: 2.8rem;
          letter-spacing: 0.08em;
          line-height: 1.2;
          color: #2c2416;
        }
        .menu-subtitle {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-weight: 300;
          color: #9c8b72;
          font-size: 1rem;
          letter-spacing: 0.15em;
        }
        .menu-category-title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400;
          font-size: 1.4rem;
          letter-spacing: 0.12em;
          color: #5c4a2a;
        }
        .menu-item-name {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 500;
          font-size: 1.15rem;
          color: #2c2416;
          letter-spacing: 0.02em;
        }
        .menu-item-description {
          font-family: 'Lato', sans-serif;
          font-weight: 300;
          font-size: 0.82rem;
          color: #8a7560;
          line-height: 1.6;
          letter-spacing: 0.01em;
        }
        .menu-price {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400;
          font-size: 1.05rem;
          color: #7a6240;
          letter-spacing: 0.04em;
        }
        .ornament {
          font-family: 'Cormorant Garamond', serif;
          color: #c4a97d;
          font-size: 1.2rem;
          letter-spacing: 0.3em;
        }
        .divider-line {
          border: none;
          border-top: 1px solid #d9cfc2;
          width: 60px;
          margin: 0 auto;
        }
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
          border-top: 1px solid #d9cfc2;
        }
      `}</style>

      <div
        className="menu-root min-h-screen py-14 px-5"
        style={{ background: "linear-gradient(160deg, #faf8f4 0%, #f3ede3 100%)" }}
      >
        <div className="max-w-md mx-auto">

          {/* Header */}
          <div className="text-center mb-12">
            <div className="ornament mb-4">✦ ✦ ✦</div>
            <h1 className="menu-venue-name mb-3">
              {venue?.name ?? "Menu"}
            </h1>
            <hr className="divider-line mb-3" />
            <p className="menu-subtitle">— Our Menu —</p>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-20">
              <p className="menu-subtitle">No menu available yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
              {categories.map((cat) => (
                <div key={cat}>
                  {/* Category header */}
                  <div className="category-divider">
                    <h2 className="menu-category-title">{cat}</h2>
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
                          borderBottom: "1px solid #ece5d8",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p className="menu-item-name">{item.name}</p>
                          {item.description && (
                            <p className="menu-item-description" style={{ marginTop: "0.25rem" }}>
                              {item.description}
                            </p>
                          )}
                        </div>
                        {item.price && (
                          <span className="menu-price" style={{ whiteSpace: "nowrap", paddingTop: "2px" }}>
                            {item.price}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Footer ornament */}
              <div className="text-center" style={{ marginTop: "1rem", paddingTop: "2rem" }}>
                <div className="ornament">✦</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
