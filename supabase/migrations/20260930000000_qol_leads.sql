-- One row per submission: the same email coming back later is a new re-check.
create table if not exists public.qol_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  reason text,
  duration text,
  noticed text[] default '{}',
  focus_areas text[] default '{}',
  feeling text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  fbclid text,
  fbc text,
  fbp text,
  landing_url text,
  user_agent text,
  consent_text text not null,          -- exact footnote shown at capture time
  started_qol_at timestamptz,          -- set when "Take the check now" is clicked
  reply_contact_id text,
  reply_synced_at timestamptz,
  reply_error text,
  unique (email, created_at)
);

create index if not exists qol_leads_email_idx on public.qol_leads (email);
create index if not exists qol_leads_unsynced_idx on public.qol_leads (reply_synced_at)
  where reply_synced_at is null;

-- RLS on with no policies: anon/authenticated roles get nothing. Only the
-- server (service role key) can read or write.
alter table public.qol_leads enable row level security;
