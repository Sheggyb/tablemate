import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const origin = process.env.NEXT_PUBLIC_APP_URL || "https://tablemate-beta.vercel.app";
  return NextResponse.redirect(new URL("/", origin));
}
