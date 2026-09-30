import { NextResponse, after } from "next/server";
import { markStarted } from "@/lib/db";
import { sendCapi } from "@/lib/meta";
import { clientIp } from "@/lib/rate-limit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) ?? {};
  } catch {}

  try {
    await markStarted(id);
  } catch (e) {
    console.error("markStarted failed", e);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }

  const str = (v: unknown) => (typeof v === "string" ? v.slice(0, 500) : null);
  after(() =>
    sendCapi({
      name: "StartQOLCheck",
      eventId: str(body.eventId),
      fbc: str(body.fbc),
      fbp: str(body.fbp),
      ip: clientIp(req.headers),
      userAgent: req.headers.get("user-agent"),
      url: str(body.landingUrl),
    }),
  );
  return NextResponse.json({ ok: true });
}
