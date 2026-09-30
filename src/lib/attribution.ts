"use client";

import { UTM_KEYS, type Utm } from "./lead";

// Ad attribution captured from the landing URL, kept for the session so it
// survives in-funnel navigation (?step=...) and refreshes.
export interface Attribution {
  utm: Utm;
  fbclid: string | null;
  landingUrl: string | null;
}

const KEY = "qol-attribution";

function read(): Attribution | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Attribution) : null;
  } catch {
    return null;
  }
}

/** Call once on mount. Only a landing URL that carries ad params overwrites what's stored. */
export function captureAttribution(): Attribution {
  const params = new URLSearchParams(window.location.search);
  const utm: Utm = {};
  for (const k of UTM_KEYS) {
    const v = params.get(`utm_${k}`);
    if (v) utm[k] = v;
  }
  const fbclid = params.get("fbclid");
  const stored = read();
  if (stored && !fbclid && !Object.keys(utm).length) return stored;
  const url = new URL(window.location.href);
  url.searchParams.delete("step");
  const fresh: Attribution = { utm, fbclid, landingUrl: url.toString() };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(fresh));
  } catch {}
  return fresh;
}

function cookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

/** Meta click/browser ids. fbc falls back to one built from fbclid, per Meta's format. */
export function metaIds(a: Attribution): { fbc: string | null; fbp: string | null } {
  const fbc = cookie("_fbc") ?? (a.fbclid ? `fb.1.${Date.now()}.${a.fbclid}` : null);
  return { fbc, fbp: cookie("_fbp") };
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function newEventId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function pixel(event: string, custom = false, eventId?: string, data: Record<string, unknown> = {}) {
  if (!window.fbq) return;
  window.fbq(custom ? "trackCustom" : "track", event, data, eventId ? { eventID: eventId } : undefined);
}
