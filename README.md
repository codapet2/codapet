# CodaPet quality of life quiz funnel

A mobile-first quiz funnel for Facebook/Instagram traffic: **quiz → personal summary → email → CodaPet's
existing [quality of life check](https://www.codapet.com/quality-of-life-scale)**. It's styled after
health-app onboarding flows (Noom-style weight-loss and e-health signup funnels): one question per screen,
a short lesson after each answer, a personalized summary, then the email ask and a strong hand-off to the
full QOL check.

The design handoff (spec, clickable prototype) is in [`docs/design-handoff/`](docs/design-handoff/README.md).
The follow-up email copy is in [`docs/email-sequence.md`](docs/email-sequence.md).

## The flow

| # | Step | Purpose |
|---|---|---|
| 1 | `intro` | One promise, one button. Fires Pixel `ViewContent`. |
| 2 | `reason` | Easy first tap; picks lesson 1. |
| 3 | `info1` | Lesson matched to their reason. |
| 4 | `duration` | Shapes tips on the loading screen + emails. |
| 5 | `noticed` | Multi-select everyday signs → mapped to the 7 QOL areas. |
| 6 | `areas` | Their picks light up the matching areas ("You noticed"). |
| 7 | `feeling` | Sets tone of lesson 2 and emails. |
| 8 | `info2` | Reassurance from our vets. |
| 9 | `loading` | "Building your summary"; auto-advances. |
| 10 | `email` | Email capture in exchange for the summary. Fires Pixel `Lead`. |
| 11 | `done` | Sells the check, then links to it. Fires `StartQOLCheck`. |

All copy and branching lives in [`src/lib/funnel.ts`](src/lib/funnel.ts), so it's one file to review.

## Stack

- Next.js (App Router) + Tailwind CSS v4, deploy on Vercel on its **own domain**
- Supabase (Postgres) for leads: [`supabase/migrations/`](supabase/migrations)
- Reply.io for the email sequence: [`src/lib/reply.ts`](src/lib/reply.ts)
- Meta Pixel + Conversions API with shared `event_id` for de-duplication: [`src/lib/meta.ts`](src/lib/meta.ts)

```
src/
  app/
    page.tsx                         funnel
    api/lead/route.ts                POST: validate → insert → (after response) Reply + CAPI
    api/lead/[id]/started/route.ts   POST: set started_qol_at (+ CAPI StartQOLCheck)
    api/cron/reply-retry/route.ts    nightly retry for rows where reply_synced_at is null
    privacy/, terms/                 placeholder legal pages
  components/Funnel.tsx              the 11-step UI
  lib/                               funnel copy/logic, validation, db, reply, meta, attribution
```

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in what you have; the UI runs with none of it
npm run dev                  # http://localhost:3000
npm test                     # unit tests (vitest)
npm run lint                 # typecheck
```

Without Supabase env vars, `/api/lead` returns 500 but the UI still moves on to the last screen, so
you can click through the whole funnel.

## Environment

See [`.env.example`](.env.example). Server-only: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`REPLY_API_KEY`, `REPLY_SEQUENCE_ID`, `REPLY_SEQUENCE_ID_BY_REASON` (optional JSON),
`META_CAPI_TOKEN`, `CRON_SECRET`. Public: `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_ALLOW_SKIP`,
`NEXT_PUBLIC_QOL_URL`.

## Data

`qol_leads` keeps **one row per submission** (a returning email is a new re-check). RLS is on with no
policies, so only the server's service-role key can read or write. The browser never talks to the
database. Each row stores the answers, derived `focus_areas`, UTM/fbclid/fbc/fbp, landing URL, the exact
consent text shown, `started_qol_at`, and the Reply sync status.

## Reply.io

On each lead, the server upserts the contact with these custom fields, then adds it to the sequence:
`qol_reason`, `qol_duration`, `qol_duration_text`, `qol_focus_areas`, `qol_feeling`, `qol_area_tips`,
`utm_content`, `lead_id`. **Create these custom fields in Reply first.** If Reply refuses (for example,
the contact is already active in another sequence), the reason is saved to `reply_error` and the
nightly cron retries it.

> ⚠️ `docs.reply.io` wasn't reachable when this was built. The v3 endpoint paths and body shapes in
> `src/lib/reply.ts` (`POST /v3/contacts`, `POST /v3/sequences/{id}/contacts`, Bearer auth) must be
> checked against the live docs before launch. Everything Reply-specific is in that one file.

**Pausing email 2:** to skip the 1-hour nudge for people who already started the check, extend
`/api/lead/[id]/started` to remove the contact from the sequence (or mark it finished) via the Reply API.

## Assets

The images are served from codapet.com for now. To self-host on the funnel domain, run
`npm run fetch-assets` (downloads into `public/images/`), then point `ASSETS` in `src/lib/funnel.ts` at
`/images/...`.

## Before launch

- [ ] CodaPet vets sign off on the lesson copy, the noticed → area mapping, and `AREA_TIPS`
- [ ] Verify the Reply v3 endpoints; create the custom fields; build the sequence from `docs/email-sequence.md`
- [ ] The instant summary email is live in Reply
- [ ] Replace the placeholder `/privacy` and `/terms` pages with approved copy
- [ ] Apply the Supabase migration; set env vars in Vercel; set `CRON_SECRET`
- [ ] Self-host the images (`npm run fetch-assets`)
- [ ] Test Pixel + CAPI de-duplication with `META_TEST_EVENT_CODE` in Events Manager
