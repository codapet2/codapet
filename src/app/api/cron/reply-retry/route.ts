import { NextResponse } from "next/server";
import { markReplyResult, unsyncedLeads } from "@/lib/db";
import { syncToReply } from "@/lib/reply";

// Nightly (see vercel.json): retry every lead that never reached Reply.
export const maxDuration = 300;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await unsyncedLeads();
  let synced = 0;
  for (const r of rows) {
    const result = await syncToReply({
      id: r.id,
      email: r.email,
      reason: r.reason,
      duration: r.duration,
      focusAreas: r.focus_areas ?? [],
      feeling: r.feeling,
      utmContent: r.utm_content,
    });
    await markReplyResult(r.id, result);
    if (!result.error) synced++;
    // Stay under Reply's 100 requests/minute (2 calls per lead).
    await new Promise((res) => setTimeout(res, 1300));
  }
  return NextResponse.json({ attempted: rows.length, synced });
}
