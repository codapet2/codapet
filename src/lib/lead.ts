import {
  DURATION_OPTIONS,
  FEELING_OPTIONS,
  NOTICED_OPTIONS,
  REASON_OPTIONS,
  focusAreas,
  type Area,
  type Duration,
  type Feeling,
  type Noticed,
  type Reason,
} from "./funnel";

export const UTM_KEYS = ["source", "medium", "campaign", "content", "term"] as const;
export type Utm = Partial<Record<(typeof UTM_KEYS)[number], string>>;

export interface LeadInput {
  email: string;
  reason: Reason | null;
  duration: Duration | null;
  noticed: Noticed[];
  feeling: Feeling | null;
  utm: Utm;
  fbclid: string | null;
  fbc: string | null;
  fbp: string | null;
  landingUrl: string | null;
  eventId: string | null;
}

export interface CleanLead extends LeadInput {
  focusAreas: Area[];
}

// Basic RFC-style check: local@domain.tld, no spaces, one @.
const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(raw: string): boolean {
  const e = normalizeEmail(raw);
  return e.length <= 254 && EMAIL_RE.test(e) && !e.includes("..");
}

const str = (v: unknown, max = 500): string | null =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

function oneOf<T extends string>(v: unknown, opts: { value: T }[]): T | null {
  return opts.some((o) => o.value === v) ? (v as T) : null;
}

export type ParseResult = { ok: true; lead: CleanLead } | { ok: false; error: string };

/** Validates and normalizes the untrusted POST /api/lead body. */
export function parseLead(body: unknown): ParseResult {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid body" };
  const b = body as Record<string, unknown>;
  if (typeof b.email !== "string" || !isValidEmail(b.email)) {
    return { ok: false, error: "Please enter a valid email" };
  }
  const noticed = Array.isArray(b.noticed)
    ? [...new Set(b.noticed.filter((v): v is Noticed => NOTICED_OPTIONS.some((o) => o.value === v)))]
    : [];
  const rawUtm = (b.utm && typeof b.utm === "object" ? b.utm : {}) as Record<string, unknown>;
  const utm: Utm = {};
  for (const k of UTM_KEYS) {
    const v = str(rawUtm[k], 200);
    if (v) utm[k] = v;
  }
  const lead: CleanLead = {
    email: normalizeEmail(b.email),
    reason: oneOf(b.reason, REASON_OPTIONS),
    duration: oneOf(b.duration, DURATION_OPTIONS),
    noticed,
    feeling: oneOf(b.feeling, FEELING_OPTIONS),
    utm,
    fbclid: str(b.fbclid),
    fbc: str(b.fbc),
    fbp: str(b.fbp),
    landingUrl: str(b.landingUrl, 2000),
    eventId: str(b.eventId, 100),
    focusAreas: focusAreas(noticed),
  };
  return { ok: true, lead };
}
