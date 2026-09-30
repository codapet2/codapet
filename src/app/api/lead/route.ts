import { NextResponse, after } from "next/server";
import { insertLead, markReplyResult } from "@/lib/db";
import { parseLead } from "@/lib/lead";
import { sendCapi } from "@/lib/meta";
import { clientIp, rateLimited } from "@/lib/rate-limit";
import { syncToReply } from "@/lib/reply";

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  if (rateLimited(`lead:${ip ?? "unknown"}`)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot: real people never see or fill this field. Pretend it worked.
  if (body && typeof body === "object" && (body as Record<string, unknown>).company) {
    return NextResponse.json({ id: crypto.randomUUID() });
  }

  const parsed = parseLead(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const lead = parsed.lead;
  const userAgent = req.headers.get("user-agent");

  let id: string;
  try {
    id = await insertLead(lead, userAgent);
  } catch (e) {
    console.error("insertLead failed", e);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }

  // Reply + CAPI run after the response is sent, so the user moves on immediately.
  after(async () => {
    const result = await syncToReply({
      id,
      email: lead.email,
      reason: lead.reason,
      duration: lead.duration,
      focusAreas: lead.focusAreas,
      feeling: lead.feeling,
      utmContent: lead.utm.content ?? null,
    });
    await markReplyResult(id, result);
    await sendCapi({
      name: "Lead",
      eventId: lead.eventId,
      email: lead.email,
      fbc: lead.fbc,
      fbp: lead.fbp,
      ip,
      userAgent,
      url: lead.landingUrl,
    });
  });

  return NextResponse.json({ id });
}
