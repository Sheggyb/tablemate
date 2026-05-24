import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function MenuPage({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params;
  const { data: venue } = await supabase
    .from("venues")
    .select("id, name, menu_url")
    .eq("id", venueId)
    .single();

  if (venue?.menu_url) {
    redirect(venue.menu_url);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-stone-50">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">🍽️</div>
        <h1 className="text-2xl font-bold text-stone-800 mb-2">
          {venue?.name ?? "Menu"}
        </h1>
        <p className="text-stone-500 text-sm">
          No menu is available for this venue yet.
        </p>
      </div>
    </div>
  );
}
