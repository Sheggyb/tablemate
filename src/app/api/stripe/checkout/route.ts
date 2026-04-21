import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  // Lazy import to avoid module-level crash when key is missing
  const { stripe, PRICES } = await import("@/lib/stripe") as any;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { plan } = await req.json() as { plan: string };
  if (!PRICES[plan]) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const { data: profile } = await supabase.from("profiles").select("stripe_customer_id, email").eq("id", user.id).single();

  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: profile?.email || user.email!, metadata: { supabase_user_id: user.id } });
    customerId = customer.id;
    await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const isSubscription = plan === "planner";
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{ price: PRICES[plan], quantity: 1 }],
    mode: isSubscription ? "subscription" : "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?upgraded=${plan}`,
    cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/app/upgrade`,
    metadata: { user_id: user.id, plan },
    allow_promotion_codes: true,
    tax_id_collection: { enabled: true },
  });

  return NextResponse.json({ url: session.url });
}
