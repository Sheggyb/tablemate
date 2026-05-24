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
    <div className="min-h-screen bg-stone-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🍽️</div>
          <h1 className="text-3xl font-bold text-stone-800">
            {venue?.name ?? "Menu"}
          </h1>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-stone-400 text-sm">No menu available yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((cat) => (
              <div key={cat}>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3 border-b border-stone-200 pb-2">
                  {cat}
                </h2>
                <div className="space-y-3">
                  {grouped[cat].map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl p-4 shadow-sm border border-stone-100 flex justify-between items-start gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-stone-800 text-sm">{item.name}</p>
                        {item.description && (
                          <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">{item.description}</p>
                        )}
                      </div>
                      {item.price && (
                        <span className="text-stone-700 font-semibold text-sm whitespace-nowrap">{item.price}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
