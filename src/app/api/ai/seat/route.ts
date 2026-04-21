import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Guest, Rule } from "@/lib/types";

// POST /api/ai/seat — AI seating optimizer
// Premium/Planner only
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Check plan
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  if (!profile || !["premium","planner"].includes(profile.plan)) {
    return NextResponse.json({ error: "AI seating requires Premium or Planner plan", upgrade: true }, { status: 403 });
  }

  const { weddingId, venueId } = await req.json();

  // Load all data
  const [guestsRes, tablesRes, rulesRes, groupsRes] = await Promise.all([
    supabase.from("guests").select("*").eq("wedding_id", weddingId),
    supabase.from("tables").select("*").eq("venue_id", venueId),
    supabase.from("rules").select("*").eq("wedding_id", weddingId),
    supabase.from("groups").select("*").eq("wedding_id", weddingId),
  ]);

  const guests  = guestsRes.data  || [];
  const tables  = tablesRes.data  || [];
  const rules   = rulesRes.data   || [];
  const groups  = groupsRes.data  || [];

  const unseated = guests.filter(g => !g.table_id && g.rsvp !== "declined");
  if (!unseated.length) return NextResponse.json({ message: "Everyone is already seated", assignments: [] });

  // Build a compact prompt for GPT-4o-mini
  const tableList = tables.map(t => ({
    id: t.id, name: t.name, capacity: t.capacity,
    free: t.capacity - guests.filter(g => g.table_id === t.id).length,
  })).filter(t => t.free > 0);

  const guestList = unseated.map(g => ({
    id: g.id,
    name: `${g.first_name} ${g.last_name}`,
    group: groups.find(gr => gr.id === g.group_id)?.name || null,
    meal: g.meal,
  }));

  const ruleList = rules.map(r => {
    const g1 = guests.find(g => g.id === r.guest1_id);
    const g2 = guests.find(g => g.id === r.guest2_id);
    return `${g1?.first_name} ${r.type} ${g2?.first_name}`;
  });

  const prompt = `You are a wedding seating optimizer. Assign guests to tables optimally.

TABLES (name: free seats):
${tableList.map(t => `- ${t.name} (id:${t.id}): ${t.free} free seats`).join("\n")}

GUESTS TO SEAT:
${guestList.map(g => `- ${g.name} (id:${g.id})${g.group ? ` [party: ${g.group}]` : ""}${g.meal !== "standard" ? ` [meal: ${g.meal}]` : ""}`).join("\n")}

RULES (MUST follow):
${ruleList.length ? ruleList.join("\n") : "No rules."}

INSTRUCTIONS:
1. Keep members of the same party (group) together at the same table
2. Respect must-sit-with rules (same table) and must-not-sit-with rules (different tables)
3. Don't exceed table capacity
4. Return ONLY valid JSON, no explanation:

{"assignments": [{"guestId": "...", "tableId": "..."}]}`;

  // Call OpenAI
  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!openaiRes.ok) {
    return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
  }

  const aiData = await openaiRes.json();
  let parsed;
  try {
    parsed = JSON.parse(aiData.choices[0].message.content);
  } catch {
    return NextResponse.json({ error: "AI returned invalid response" }, { status: 500 });
  }

  // Apply assignments to DB
  const assignments: Array<{guestId: string; tableId: string}> = parsed.assignments || [];
  let applied = 0;

  for (const a of assignments) {
    const table = tableList.find(t => t.id === a.tableId);
    if (!table) continue;

    // Find next free seat index
    const { data: tableGuests } = await supabase
      .from("guests")
      .select("seat_index")
      .eq("table_id", a.tableId);

    const usedSeats = new Set((tableGuests || []).map(g => g.seat_index).filter(s => s !== null));
    let seatIndex = 0;
    while (usedSeats.has(seatIndex)) seatIndex++;
    if (seatIndex >= (tables.find(t => t.id === a.tableId)?.capacity || 8)) continue;

    await supabase.from("guests").update({
      table_id: a.tableId,
      seat_index: seatIndex,
    }).eq("id", a.guestId);

    applied++;
  }

  return NextResponse.json({
    message: `AI seated ${applied} of ${unseated.length} guests`,
    applied,
    total: unseated.length,
    assignments,
  });
}
