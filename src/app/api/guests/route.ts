import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/guests
 * Server-side enforcement of the 50-guest limit for free plan users.
 * Called by PlannerClient before adding a guest.
 *
 * Returns:
 *   200 { allowed: true }                          – OK to proceed
 *   403 { allowed: false, error: string }          – limit reached
 *   401 { error: string }                          – not authenticated
 */
export async function POST(req: Request) {
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { weddingId } = await req.json();
  if (!weddingId) {
    return NextResponse.json({ error: "weddingId is required" }, { status: 400 });
  }

  // Verify the wedding belongs to this user
  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, user_id")
    .eq("id", weddingId)
    .eq("user_id", user.id)
    .single();

  if (!wedding) {
    return NextResponse.json({ error: "Wedding not found" }, { status: 403 });
  }

  // Fetch user plan
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  const plan = profile?.plan ?? "free";

  // Only enforce limit on free plan
  if (plan !== "free") {
    return NextResponse.json({ allowed: true });
  }

  // Count current guests
  const { count } = await supabase
    .from("guests")
    .select("*", { count: "exact", head: true })
    .eq("wedding_id", weddingId);

  if (count !== null && count >= 50) {
    return NextResponse.json(
      { allowed: false, error: "Free plan limit reached: 50 guests maximum. Upgrade to add more." },
      { status: 403 }
    );
  }

  return NextResponse.json({ allowed: true });
}
