// Reply.io sync. Endpoint paths and body shapes follow Reply API v3 as described
// in the handoff; docs.reply.io was not reachable when this was written, so
// VERIFY PATHS AND FIELD NAMES against the live docs before launch. They are all
// kept in this file on purpose.
import { areaTipsText, durationText, type Area, type Duration } from "./funnel";

const BASE = "https://api.reply.io/v3";

export interface ReplyLead {
  id: string;
  email: string;
  reason: string | null;
  duration: string | null;
  focusAreas: string[];
  feeling: string | null;
  utmContent: string | null;
}

export type ReplyResult = { contactId: string | null; error: string | null };

export function customFields(l: ReplyLead): Record<string, string> {
  return {
    qol_reason: l.reason ?? "",
    qol_duration: l.duration ?? "",
    qol_duration_text: durationText((l.duration as Duration) ?? null),
    qol_focus_areas: l.focusAreas.length ? l.focusAreas.join(", ") : "All 7 areas",
    qol_feeling: l.feeling ?? "",
    qol_area_tips: areaTipsText(l.focusAreas as Area[]),
    utm_content: l.utmContent ?? "",
    lead_id: l.id,
  };
}

export function sequenceFor(reason: string | null): string | null {
  const raw = process.env.REPLY_SEQUENCE_ID_BY_REASON;
  if (raw && reason) {
    try {
      const map = JSON.parse(raw) as Record<string, string>;
      if (map[reason]) return String(map[reason]);
    } catch {
      console.error("REPLY_SEQUENCE_ID_BY_REASON is not valid JSON");
    }
  }
  return process.env.REPLY_SEQUENCE_ID || null;
}

async function call(path: string, init: RequestInit): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.REPLY_API_KEY}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    signal: AbortSignal.timeout(8000),
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {}
  return { status: res.status, body };
}

const detail = (b: unknown) => (typeof b === "string" ? b : JSON.stringify(b)).slice(0, 500);

/** Create/update the contact, then add it to the sequence. Never throws. */
export async function syncToReply(lead: ReplyLead): Promise<ReplyResult> {
  if (!process.env.REPLY_API_KEY) return { contactId: null, error: "REPLY_API_KEY not set" };
  try {
    const fields = customFields(lead);
    const upsert = await call("/contacts", {
      method: "POST",
      body: JSON.stringify({
        email: lead.email,
        customFields: Object.entries(fields).map(([key, value]) => ({ key, value })),
      }),
    });
    if (upsert.status >= 300) {
      return { contactId: null, error: `contact upsert ${upsert.status}: ${detail(upsert.body)}` };
    }
    const b = upsert.body as { id?: string | number } | null;
    const contactId = b?.id != null ? String(b.id) : null;

    const sequenceId = sequenceFor(lead.reason);
    if (!sequenceId) return { contactId, error: "REPLY_SEQUENCE_ID not set" };

    const add = await call(`/sequences/${encodeURIComponent(sequenceId)}/contacts`, {
      method: "POST",
      body: JSON.stringify(contactId ? { contactId } : { email: lead.email }),
    });
    if (add.status >= 300) {
      // Reply refuses contacts already active in another sequence. That is logged,
      // not treated as a crash; the nightly retry will pick the row up again.
      return { contactId, error: `sequence add ${add.status}: ${detail(add.body)}` };
    }
    return { contactId, error: null };
  } catch (e) {
    return { contactId: null, error: `reply request failed: ${(e as Error).message}` };
  }
}
