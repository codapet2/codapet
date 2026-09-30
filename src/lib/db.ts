import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { CONSENT_TEXT } from "./funnel";
import type { CleanLead } from "./lead";

let client: SupabaseClient | null = null;

/** Server-only Supabase client using the service role key (bypasses RLS). */
export function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export interface LeadRow {
  id: string;
  email: string;
  reason: string | null;
  duration: string | null;
  focus_areas: string[];
  feeling: string | null;
  utm_content: string | null;
}

export async function insertLead(lead: CleanLead, userAgent: string | null): Promise<string> {
  const { data, error } = await db()
    .from("qol_leads")
    .insert({
      email: lead.email,
      reason: lead.reason,
      duration: lead.duration,
      noticed: lead.noticed,
      focus_areas: lead.focusAreas,
      feeling: lead.feeling,
      utm_source: lead.utm.source ?? null,
      utm_medium: lead.utm.medium ?? null,
      utm_campaign: lead.utm.campaign ?? null,
      utm_content: lead.utm.content ?? null,
      utm_term: lead.utm.term ?? null,
      fbclid: lead.fbclid,
      fbc: lead.fbc,
      fbp: lead.fbp,
      landing_url: lead.landingUrl,
      user_agent: userAgent?.slice(0, 500) ?? null,
      consent_text: CONSENT_TEXT,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function markReplyResult(
  id: string,
  result: { contactId: string | null; error: string | null },
): Promise<void> {
  const patch = result.error
    ? { reply_error: result.error.slice(0, 1000) }
    : { reply_contact_id: result.contactId, reply_synced_at: new Date().toISOString(), reply_error: null };
  const { error } = await db().from("qol_leads").update(patch).eq("id", id);
  if (error) console.error("markReplyResult failed", id, error);
}

export async function markStarted(id: string): Promise<void> {
  // Only the first click counts.
  const { error } = await db()
    .from("qol_leads")
    .update({ started_qol_at: new Date().toISOString() })
    .eq("id", id)
    .is("started_qol_at", null);
  if (error) throw error;
}

export async function unsyncedLeads(limit = 200): Promise<LeadRow[]> {
  const { data, error } = await db()
    .from("qol_leads")
    .select("id,email,reason,duration,focus_areas,feeling,utm_content")
    .is("reply_synced_at", null)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as LeadRow[];
}
