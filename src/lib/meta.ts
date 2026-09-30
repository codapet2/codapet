import { createHash } from "node:crypto";

const GRAPH = "https://graph.facebook.com/v21.0";

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

export interface CapiEvent {
  name: "Lead" | "StartQOLCheck" | "ViewContent";
  eventId: string | null;
  email?: string;
  fbc?: string | null;
  fbp?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  url?: string | null;
}

/**
 * Server-side twin of the browser pixel event. Uses the same event_id so Meta
 * de-duplicates the pair. Fire-and-forget; never throws.
 */
export async function sendCapi(e: CapiEvent): Promise<void> {
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixel || !token) return;
  const user_data: Record<string, unknown> = {};
  if (e.email) user_data.em = [sha256(e.email)];
  if (e.fbc) user_data.fbc = e.fbc;
  if (e.fbp) user_data.fbp = e.fbp;
  if (e.ip) user_data.client_ip_address = e.ip;
  if (e.userAgent) user_data.client_user_agent = e.userAgent;
  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: e.name,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        event_source_url: e.url ?? undefined,
        event_id: e.eventId ?? undefined,
        user_data,
      },
    ],
  };
  if (process.env.META_TEST_EVENT_CODE) payload.test_event_code = process.env.META_TEST_EVENT_CODE;
  try {
    const res = await fetch(`${GRAPH}/${pixel}/events?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error("CAPI error", res.status, await res.text());
  } catch (err) {
    console.error("CAPI request failed", err);
  }
}
