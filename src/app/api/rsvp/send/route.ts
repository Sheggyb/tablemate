import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// TODO: add rate limiting (e.g. 20 req/min per user — email sends are costly and abuse-prone)
// POST /api/rsvp/send — sends RSVP email to one or more guests
export async function POST(req: Request) {
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Parse body safely
  let guestIds: string[], weddingId: string;
  try {
    const body = await req.json();
    guestIds  = body.guestIds;
    weddingId = body.weddingId;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate required fields
  if (!weddingId || typeof weddingId !== "string") {
    return NextResponse.json({ error: "weddingId is required" }, { status: 400 });
  }
  if (!Array.isArray(guestIds) || guestIds.length === 0) {
    return NextResponse.json({ error: "guestIds must be a non-empty array" }, { status: 400 });
  }

  // Guard: cap batch size to prevent abuse
  if (guestIds.length > 200) {
    return NextResponse.json({ error: "Cannot send more than 200 emails at once" }, { status: 400 });
  }

  // Guard: env vars must be set
  if (!process.env.RESEND_API_KEY) {
    console.error("[rsvp/send] RESEND_API_KEY is not set");
    return NextResponse.json({ error: "Email service is not configured" }, { status: 503 });
  }
  if (!process.env.RESEND_FROM_EMAIL) {
    console.error("[rsvp/send] RESEND_FROM_EMAIL is not set");
    return NextResponse.json({ error: "Email service is not configured" }, { status: 503 });
  }
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.error("[rsvp/send] NEXT_PUBLIC_APP_URL is not set");
    return NextResponse.json({ error: "App URL is not configured" }, { status: 503 });
  }

  // Verify wedding ownership
  const { data: wedding } = await supabase
    .from("weddings")
    .select("*")
    .eq("id", weddingId)
    .eq("user_id", user.id)
    .single();
  if (!wedding) return NextResponse.json({ error: "Wedding not found" }, { status: 404 });

  // Fetch guests (only those belonging to this wedding — prevents cross-wedding leakage)
  const { data: guests, error: guestsError } = await supabase
    .from("guests")
    .select("*")
    .in("id", guestIds)
    .eq("wedding_id", weddingId);

  if (guestsError) {
    console.error("[rsvp/send] Failed to fetch guests:", guestsError.message);
    return NextResponse.json({ error: "Failed to fetch guests" }, { status: 500 });
  }
  if (!guests?.length) return NextResponse.json({ error: "No guests found" }, { status: 404 });

  // Filter guests with email and a valid rsvp_token
  const withEmail = guests.filter(g => g.email);
  if (!withEmail.length) return NextResponse.json({ error: "No guests have email addresses" }, { status: 400 });

  // Warn about guests missing rsvp_token (they'll be skipped)
  const withToken    = withEmail.filter(g => g.rsvp_token);
  const missingToken = withEmail.filter(g => !g.rsvp_token);
  if (missingToken.length) {
    console.warn(`[rsvp/send] ${missingToken.length} guest(s) have no rsvp_token and will be skipped:`,
      missingToken.map(g => g.id));
  }
  if (!withToken.length) {
    return NextResponse.json({ error: "No guests have RSVP tokens — ensure tokens are generated before sending" }, { status: 400 });
  }

  // Send via Resend
  const results = await Promise.allSettled(
    withToken.map(guest => sendRsvpEmail(guest, wedding))
  );

  const sent   = results.filter(r => r.status === "fulfilled").length;
  const failed = results.filter(r => r.status === "rejected").length;

  // Log failures for debugging
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[rsvp/send] Failed for guest ${withToken[i]?.id}:`, (r as PromiseRejectedResult).reason);
    }
  });

  // 207 Multi-Status when some succeeded and some failed; 200 on full success; 500 on total failure
  const status = failed === 0 ? 200 : sent === 0 ? 500 : 207;
  return NextResponse.json(
    { sent, failed, skipped: missingToken.length },
    { status }
  );
}

async function sendRsvpEmail(guest: any, wedding: any) {
  const rsvpUrl    = `${process.env.NEXT_PUBLIC_APP_URL}/rsvp/${guest.rsvp_token}`;
  const weddingDate = wedding.date
    ? new Date(wedding.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FDFBF8;font-family:Inter,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;border:1px solid #EDE8E0;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#C9956E,#D4A882);padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:24px">♥</p>
            <h1 style="margin:8px 0 0;color:white;font-size:28px;font-weight:700;">${wedding.name}</h1>
            ${weddingDate ? `<p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">${weddingDate}</p>` : ""}
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 16px;font-size:16px;color:#2A2328;">Dear <strong>${guest.first_name}</strong>,</p>
            <p style="margin:0 0 24px;font-size:15px;color:#4A4348;line-height:1.6;">
              You're invited to celebrate with us! Please let us know if you'll be joining by clicking the button below.
            </p>
            ${wedding.couple_names ? `<p style="margin:0 0 24px;font-size:14px;color:#6B6068;text-align:center;">— ${wedding.couple_names} 💍</p>` : ""}
            <div style="text-align:center;margin:32px 0;">
              <a href="${rsvpUrl}" style="display:inline-block;padding:14px 32px;background:#C9956E;color:white;font-size:16px;font-weight:600;text-decoration:none;border-radius:12px;">
                RSVP Now →
              </a>
            </div>
            <p style="margin:0;font-size:12px;color:#9B9098;text-align:center;">
              Or copy this link: ${rsvpUrl}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px;border-top:1px solid #EDE8E0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9B9098;">Powered by <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color:#C9956E;text-decoration:none;">TableMate</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // 10-second timeout per individual email send
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  let res: Response;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method:  "POST",
      signal:  controller.signal,
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        from:    process.env.RESEND_FROM_EMAIL,
        to:      guest.email,
        subject: `You're invited! RSVP to ${wedding.name}`,
        html,
      }),
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res!.ok) {
    const body = await res!.text().catch(() => "");
    throw new Error(`Resend error ${res!.status}: ${body}`);
  }
  return res!.json();
}
