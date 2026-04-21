import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const PLAN_BY_PRICE: Record<string, string> = {
  [process.env.STRIPE_PRICE_COUPLE  ?? ""]: "couple",
  [process.env.STRIPE_PRICE_PREMIUM ?? ""]: "premium",
  [process.env.STRIPE_PRICE_PLANNER ?? ""]: "planner",
};

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-03-25.dahlia",
  });

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await req.text();
  const sig  = req.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const userId  = session.metadata?.user_id;
    const plan    = PLAN_BY_PRICE[session.metadata?.price_id] ?? session.metadata?.plan;
    if (userId && plan) {
      await supabaseAdmin.from("profiles").update({ plan }).eq("id", userId);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as any;
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", sub.customer)
      .single();
    if (profile) {
      await supabaseAdmin.from("profiles").update({ plan: "free" }).eq("id", profile.id);
    }
  }

  return NextResponse.json({ received: true });
}
