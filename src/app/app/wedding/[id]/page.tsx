import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PlannerClient from "./PlannerClient";

export default async function WeddingPlannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: wedding } = await supabase
    .from("weddings")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!wedding) redirect("/app");

  // Preload all data
  const [venuesRes, guestsRes, tablesRes, groupsRes, rulesRes, profileRes] = await Promise.all([
    supabase.from("venues").select("*").eq("wedding_id", id),
    supabase.from("guests").select("*").eq("wedding_id", id).order("last_name"),
    supabase.from("tables").select("*").in("venue_id",
      (await supabase.from("venues").select("id").eq("wedding_id", id)).data?.map(v => v.id) ?? []
    ),
    supabase.from("groups").select("*").eq("wedding_id", id),
    supabase.from("rules").select("*").eq("wedding_id", id),
    supabase.from("profiles").select("plan").eq("id", user.id).single(),
  ]);

  return (
    <PlannerClient
      wedding={wedding}
      initialVenues={venuesRes.data ?? []}
      initialGuests={guestsRes.data ?? []}
      initialTables={tablesRes.data ?? []}
      initialGroups={groupsRes.data ?? []}
      initialRules={rulesRes.data ?? []}
      plan={profileRes.data?.plan ?? "free"}
    />
  );
}
