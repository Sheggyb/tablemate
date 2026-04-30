import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// TODO: add rate limiting (e.g. 10 req/min per user — AI seating is expensive)
// POST /api/ai/seat — Smart seating optimizer (no external API)
// Premium/Planner only
export async function POST(req: Request) {
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Check plan
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  if (!profile || !["premium","planner"].includes(profile.plan)) {
    return NextResponse.json({ error: "Smart Seating requires Premium or Planner plan", upgrade: true }, { status: 403 });
  }

  // Parse body safely
  let weddingId: string, venueId: string;
  try {
    const body = await req.json();
    weddingId = body.weddingId;
    venueId   = body.venueId;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!weddingId || !venueId) {
    return NextResponse.json({ error: "weddingId and venueId are required" }, { status: 400 });
  }

  // Verify wedding ownership
  const { data: wedding, error: weddingError } = await supabase
    .from("weddings")
    .select("id")
    .eq("id", weddingId)
    .eq("user_id", user.id)
    .single();

  if (weddingError || !wedding) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Load all data with a timeout safety wrapper
  let guestsRes: Awaited<ReturnType<typeof supabase.from>>,
      tablesRes: Awaited<ReturnType<typeof supabase.from>>,
      rulesRes:  Awaited<ReturnType<typeof supabase.from>>,
      groupsRes: Awaited<ReturnType<typeof supabase.from>>;

  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("DB query timeout")), 15000)
    );
    [guestsRes, tablesRes, rulesRes, groupsRes] = await Promise.race([
      Promise.all([
        supabase.from("guests").select("*").eq("wedding_id", weddingId),
        supabase.from("tables").select("*").eq("venue_id", venueId),
        supabase.from("rules").select("*").eq("wedding_id", weddingId),
        supabase.from("groups").select("*").eq("wedding_id", weddingId),
      ]),
      timeout,
    ]) as any;
  } catch (err: any) {
    console.error("[ai/seat] Data load failed:", err?.message);
    return NextResponse.json({ error: "Failed to load seating data. Please try again." }, { status: 500 });
  }

  const guests = (guestsRes as any).data || [];
  const tables = (tablesRes as any).data || [];
  const rules  = (rulesRes  as any).data || [];

  const unseated = guests.filter((g: any) => !g.table_id && g.rsvp !== "declined");
  if (!unseated.length) return NextResponse.json({ message: "Everyone is already seated", assignments: [], guests: [] });

  // Track free seats per table
  const seatMap: Record<string, number> = {};
  for (const t of tables) {
    const taken = guests.filter((g: any) => g.table_id === t.id).length;
    seatMap[t.id] = t.capacity - taken;
  }

  // Build rule lookups
  const mustWith: Record<string, string[]>    = {};
  const mustNotWith: Record<string, string[]> = {};
  for (const r of rules) {
    if (r.type === "must_sit_with") {
      (mustWith[r.guest1_id] = mustWith[r.guest1_id] || []).push(r.guest2_id);
      (mustWith[r.guest2_id] = mustWith[r.guest2_id] || []).push(r.guest1_id);
    } else {
      (mustNotWith[r.guest1_id] = mustNotWith[r.guest1_id] || []).push(r.guest2_id);
      (mustNotWith[r.guest2_id] = mustNotWith[r.guest2_id] || []).push(r.guest1_id);
    }
  }

  // Group guests by group_id (party), then ungrouped last
  const grouped: Record<string, typeof unseated>  = {};
  const ungrouped: typeof unseated = [];
  for (const g of unseated) {
    if (g.group_id) {
      (grouped[g.group_id] = grouped[g.group_id] || []).push(g);
    } else {
      ungrouped.push(g);
    }
  }

  const assignments: Array<{ guestId: string; tableId: string }> = [];
  const assignedTo: Record<string, string> = {}; // guestId → tableId

  function canFit(tableId: string, count: number) {
    return seatMap[tableId] >= count;
  }

  function violatesRules(guestId: string, tableId: string): boolean {
    const mustNotIds = mustNotWith[guestId] || [];
    for (const blocked of mustNotIds) {
      if (assignedTo[blocked] === tableId) return true;
    }
    return false;
  }

  function scoreTable(guestIds: string[], tableId: string): number {
    let score = 0;
    for (const gid of guestIds) {
      for (const mustId of (mustWith[gid] || [])) {
        if (assignedTo[mustId] === tableId) score += 10;
      }
    }
    return score;
  }

  function assignGroup(guestIds: string[]) {
    const candidates = tables
      .filter((t: any) => canFit(t.id, guestIds.length) && !guestIds.some(id => violatesRules(id, t.id)))
      .sort((a: any, b: any) => scoreTable(guestIds, b.id) - scoreTable(guestIds, a.id));

    if (!candidates.length) {
      // Try splitting into individuals if group is too big
      for (const gid of guestIds) assignGroup([gid]);
      return;
    }

    const table = candidates[0];
    for (const gid of guestIds) {
      assignments.push({ guestId: gid, tableId: table.id });
      assignedTo[gid] = table.id;
      seatMap[table.id]--;
    }
  }

  // Assign groups first (keep parties together)
  for (const groupGuests of Object.values(grouped)) {
    assignGroup((groupGuests as any[]).map((g: any) => g.id));
  }

  // Then ungrouped individuals
  for (const g of ungrouped) {
    assignGroup([g.id]);
  }

  // Persist to DB and collect updated guest objects for frontend state
  let applied = 0;
  const updatedGuests: Array<{ id: string; table_id: string; seat_index: number }> = [];
  const persistErrors: string[] = [];

  for (const a of assignments) {
    try {
      const { data: tableGuests } = await supabase
        .from("guests")
        .select("seat_index")
        .eq("table_id", a.tableId);

      const usedSeats = new Set(
        (tableGuests || [])
          .map((g: { seat_index: number }) => g.seat_index)
          .filter((s: number | null) => s !== null)
      );

      let seatIndex = 0;
      const cap = tables.find((t: any) => t.id === a.tableId)?.capacity || 8;
      while (usedSeats.has(seatIndex) && seatIndex < cap) seatIndex++;
      if (seatIndex >= cap) continue;

      const { error: updateErr } = await supabase.from("guests").update({
        table_id:   a.tableId,
        seat_index: seatIndex,
      }).eq("id", a.guestId);

      if (updateErr) {
        console.error(`[ai/seat] Failed to update guest ${a.guestId}:`, updateErr.message);
        persistErrors.push(a.guestId);
        continue;
      }

      applied++;
      updatedGuests.push({ id: a.guestId, table_id: a.tableId, seat_index: seatIndex });
    } catch (err: any) {
      console.error(`[ai/seat] Exception persisting guest ${a.guestId}:`, err?.message);
      persistErrors.push(a.guestId);
    }
  }

  return NextResponse.json({
    message: `Seated ${applied} of ${unseated.length} guests`,
    applied,
    total:   unseated.length,
    assignments,
    // Full updated guest records so the frontend can patch state directly without a refetch
    guests:  updatedGuests,
    ...(persistErrors.length ? { warnings: `${persistErrors.length} guest(s) could not be saved` } : {}),
  });
}
