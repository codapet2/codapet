# Handoff: CodaPet Quality of Life Quiz Funnel

## Overview
A mobile-first quiz funnel (Facebook traffic → quiz → email → CodaPet's existing Quality of Life check). It is styled after health-app onboarding flows: one question per screen, a lesson after each answer, a personalized summary, then an email ask, then a strong push to take the existing check at `https://www.codapet.com/quality-of-life-scale`.

Scope for this build:
1. Build the funnel as a standalone site on its **own domain** (not codapet.com).
2. Save every lead, with its quiz answers and ad source, to a **database**.
3. Sync each lead to **Reply.io** so email sequences can run from there.

Out of scope: the existing QOL check, which stays unchanged, and ad creative.

## About the Design Files
`QOL Facebook Funnel v3.dc.html` is a **design reference built in HTML**. It is a clickable prototype that shows the intended look, copy and behavior. It is not production code to copy. Rebuild it in a suitable stack; with no existing codebase, we recommend **Next.js (App Router) + Tailwind, deployed on Vercel**. To view it, open the file in a browser with `support.js` next to it. The phone on the left is clickable, and the list on the right jumps to any screen.

## Fidelity
**High-fidelity.** Colors, type, spacing, copy and flow are final. Match them closely. The prototype sits in a 390×844 phone frame. In production the funnel is full-viewport on mobile and a centered column (max-width 440px) on desktop.

---

## Screens (11 steps, in order)

Every screen except Welcome and Building shares a **top bar**: a back chevron `‹` (20px wide, #6b7684, 24px), a progress track (flex:1, 6px tall, radius 3, track #e3ddd4, fill #527cac, `width` animates over .35s ease) and the CodaPet icon (20px tall). Padding is 18px 20px 14px. Progress = `stepIndex / 10`.

Screen body padding is `14px 20px 24px`, stacked with a 18–22px gap. The primary button is pinned to the bottom (`margin-top:auto`).

| # | Key | Type | Content |
|---|---|---|---|
| 1 | `intro` | Welcome | Hero image 330px tall. Eyebrow "Free · 2 minutes". H1 "Is your pet having more good days than bad?". Body "Answer a few quick questions and learn what vets look for as pets age or get sick." Button "Let's begin". Footnote "Designed with CodaPet veterinarians". No top bar. |
| 2 | `reason` | Single-select | "What brings you here today?" / "Pick the one that fits best." Options: I've noticed some changes · My pet has a diagnosis · My pet is getting older · I just want to be prepared |
| 3 | `info1` | Lesson | Copy depends on `reason` (below). 260px image, radius 20. |
| 4 | `duration` | Single-select | "How long has this been on your mind?" / "There's no right answer." Options: Just the past few days · A few weeks · A few months or more · I'm not sure |
| 5 | `noticed` | Multi-select | "Have you noticed any of these?" / "Select all that apply." (options + area mapping below). Continue button is disabled (#a9bcd2) until at least one option is picked. |
| 6 | `areas` | Personalized lesson | Eyebrow "What vets look at". Title "What you noticed falls under {n} of the 7 areas", or "Here's what vets pay attention to" if none. Sub "Vets look at 7 everyday areas. That way no single bad day decides the picture." A white card lists the 7 areas; matched areas get a "You noticed" pill (bg #fbeee2, text #9a5a22, 12px/700, radius 999). |
| 7 | `feeling` | Single-select | "How are you feeling about it?" / "It helps us choose what to send you." Options: Worried · Overwhelmed · Not sure what's normal · Calm, just checking in |
| 8 | `info2` | Lesson | Copy depends on `feeling` (below). |
| 9 | `loading` | Building | No top bar. Big % (Lora 56px #527cac). Title "Putting your summary together". 8px bar. Three checklist rows turn green (#3f7a5c) at 30% / 65% / 95%: "Matching your answers to the 7 areas", "Choosing tips for {durationText}", "Preparing your summary". Runs about 2.3s, then moves on by itself after a 500ms pause. |
| 10 | `email` | Email capture | "✓ Your summary is ready" (13px/700 #3f7a5c). H2 "Where should we send it?". Summary card with 3 ✓ rows: "Areas to watch: {focus}" / "What each one means and what to look for this week." · "Tips from CodaPet vets" / "Small ways to bring more comfort to your pet's day." · "A reminder in 2 weeks" / "Checking twice shows which way things are heading." Email input 56px. Button "Send it & start the check". Optional "Skip for now" (feature flag, default off). Footnote "Private. No calls, no spam. Unsubscribe anytime." |
| 11 | `done` | Sell the check | "✓ Summary sent. One step left." H2 (dynamic): "You noticed changes in {A}, {B} and {C}. The check shows how much they matter.", or "Now see where your pet really stands." Body: "Your summary shows what to watch. CodaPet's quality of life check scores all 7 areas, so you'll know where your pet stands and won't have to guess." Card "Why take it today" with numbered rows: Know where things stand / A score for each area turns a feeling into something you can see. · Catch changes early / Small changes are easier to help with when you spot them early. · Walk into your vet visit prepared / Bring clear answers instead of "something seems off." Line "5 minutes · Free · Designed with CodaPet vets". Button "Take the check now" → QOL URL (same tab in production). |

### Lesson copy
`info1` by `reason` (kicker / title / body):
- changes: Trust that feeling / You know your pet better than anyone. / Vets say small changes are often the earliest and most useful signs. They're worth noting before the days blur together.
- diagnosis: After a diagnosis / Comfort matters as much as the condition. / With an illness, vets focus on how your pet feels day to day. That's exactly what a quality of life check looks at.
- older: About aging / Aging is many small changes, not one. / That's why vets break it into everyday areas, so you can see which ones are shifting and which are fine.
- prepared: Good thinking / Checking on a good day helps later. / A check while things are okay gives you a baseline, so any change is easier to spot.

`info2` by `feeling` (kicker is always "From our vets"):
- worried: Worry means you're paying attention. / You don't need all the answers today. Looking at one area at a time makes things clearer and less heavy.
- overwhelmed: Let's make it smaller. / One question, one area, one week at a time. That's all the check asks of you.
- unsure: Knowing what's normal is hard. / The check puts what you see next to what vets look for, so it's easier to tell ordinary aging from something more.
- calm: A great place to start from. / Checking in while you feel steady gives you a clear record to compare with later.

### "Noticed" options → area
| value | label | area |
|---|---|---|
| play | Less interest in play or walks | Happiness |
| eat | Eating less | Hunger |
| drink | Drinking more or less | Hydration |
| move | Trouble with stairs or jumping | Mobility |
| accidents | Accidents or trouble grooming | Hygiene |
| night | Restless, panting or hiding | Hurt |
| ok | Nothing yet, they seem okay | — (exclusive: clears the others; picking any other option clears it) |

The 7 areas, in display order: Hurt (Pain or discomfort), Hunger (Eating enough), Hydration (Drinking enough), Hygiene (Staying clean), Happiness (Interest and joy), Mobility (Getting around), More good days (Than bad ones, overall).

`durationText`: recent → "recent changes", weeks → "the past few weeks", months → "longer-term changes", unsure → "what you've noticed".

## Interactions & Behavior
- **Single-select:** tapping highlights the option, then moves on after 280ms. There is no Continue button.
- **Multi-select:** tapping toggles an option (square check, radius 6px). Continue moves on.
- **Back** goes to the previous step without clearing answers. Browser back should do the same: push each step to history, e.g. `?step=reason`.
- **Option states:** default bg #fff, 2px border #e3ddd4. Selected bg #eef2f7, border #527cac, indicator filled #527cac with a white ✓. Transition .15s.
- **Email validation:** a basic RFC-style check. Show an inline error below the input ("Please enter a valid email") and keep the user on the screen. Trim and lowercase before saving.
- **On email submit:** POST to `/api/lead` (below), then go to `done` right away. Don't block on the Reply sync.
- **Persistence:** save answers and the current step to `localStorage` so a refresh resumes where they left off.
- **Analytics:** fire Meta Pixel `ViewContent` on the welcome screen, `Lead` on email submit, and a custom `StartQOLCheck` on the final button click. Use a Conversions API event with the same `event_id` if possible.

## State
```ts
step: 'intro'|'reason'|'info1'|'duration'|'noticed'|'areas'|'feeling'|'info2'|'loading'|'email'|'done'
reason: 'changes'|'diagnosis'|'older'|'prepared'|null
duration: 'recent'|'weeks'|'months'|'unsure'|null
noticed: string[]            // values from the table above
feeling: 'worried'|'overwhelmed'|'unsure'|'calm'|null
email: string
utm: { source, medium, campaign, content, term }   // read from the landing URL, kept in sessionStorage
fbclid, fbc, fbp                                    // for Meta attribution
```
Derived: `focusAreas` (areas mapped from `noticed`), `durationText`.

---

## Lead database + Reply.io

### Recommended setup
- **Database:** Supabase (Postgres). CodaPet already uses Supabase, and it offers a dashboard, CSV export and webhooks with no extra tooling.
- **Sync:** a server-side call from `/api/lead` to Reply.io after the database insert. Also add a nightly retry job for rows where `reply_synced_at is null`.

### Table `qol_leads`
```sql
create table qol_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  reason text,
  duration text,
  noticed text[] default '{}',
  focus_areas text[] default '{}',
  feeling text,
  utm_source text, utm_medium text, utm_campaign text, utm_content text, utm_term text,
  fbclid text, fbc text, fbp text,
  landing_url text,
  user_agent text,
  consent_text text not null,          -- exact footnote shown at capture time
  started_qol_at timestamptz,          -- set when "Take the check now" is clicked
  reply_contact_id text,
  reply_synced_at timestamptz,
  reply_error text,
  unique (email, created_at)
);
create index on qol_leads (email);
create index on qol_leads (reply_synced_at) where reply_synced_at is null;
```
Keep every submission as its own row: the same email coming back later is a new re-check. Enable RLS and let only the server (service role key) insert. The browser never talks to the database directly.

### API
`POST /api/lead` with body `{ email, reason, duration, noticed, feeling, utm, fbclid, fbc, fbp, landingUrl }`
1. Validate. Honeypot field + simple rate limit per IP.
2. Insert the row and get `id`.
3. Push to Reply.io (below). On success set `reply_contact_id` and `reply_synced_at`; on failure save `reply_error`.
4. Return `{ id }`. Store it on the client as `leadId`.

`POST /api/lead/:id/started` sets `started_qol_at`. Call it (fire-and-forget) when "Take the check now" is clicked.

### Reply.io sync
Use the Reply API v3 (`https://api.reply.io/v3`, API key from Reply → Settings → API Key, kept in the env var `REPLY_API_KEY`). Check the current docs at docs.reply.io for exact request bodies.
1. **Create or update the contact** with email, plus these **custom fields** (create them in Reply first so sequences can use them as variables):
   `qol_reason`, `qol_duration`, `qol_duration_text`, `qol_focus_areas` (comma-joined, e.g. "Mobility, Happiness"), `qol_feeling`, `utm_content`, `lead_id`.
2. **Add the contact to a sequence.** The sequence ID is in env var `REPLY_SEQUENCE_ID`, so marketing can change it without a deploy. Optional: `REPLY_SEQUENCE_ID_BY_REASON` as JSON to route by `reason`.
3. Note: Reply won't add a contact who is already active in another sequence. Log that case to `reply_error` instead of failing.

Env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `REPLY_API_KEY`, `REPLY_SEQUENCE_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `META_CAPI_TOKEN`.

### Email sequence to set up in Reply (content for marketing)
| When | Subject | Content |
|---|---|---|
| Instantly | Your summary: what to watch this week | Their `{{qol_focus_areas}}` explained in plain language, one tip each, and a link to the QOL check |
| 1 hour | Your quality of life check is waiting | Gentle nudge + link. Skip if they started the check (if you can check `started_qol_at`, pause via the API) |
| Day 3 | Try the good day / hard day calendar | The calendar habit vets recommend |
| Day 7 | What vets mean by "more good days than bad" | How to read the balance + a soft offer to talk with a CodaPet vet |
| Day 14 | How has your pet been these past two weeks? | Re-check link |

The funnel promises the instant summary email, so that email must exist before launch. Every email needs a one-click unsubscribe and CodaPet's physical address (CAN-SPAM).

---

## Design Tokens
**Colors**
- Ink #1f2f45 · Body #4a5868 · Muted #5a6776 / #6b7684 · Disabled text #8a939e
- Primary #527cac (hover #3b5f88) · Primary disabled #a9bcd2
- Success #3f7a5c
- Page bg #faf8f5 · Card #ffffff · Card border #e3ddd4 · Divider #efeae3 · Input border #cfd6de
- Tint #eef2f7 · Number badge bg #e6edf5 · Pill #fbeee2 / #9a5a22 · Image placeholder #e7e1d8

**Type:** Lora 500 (headlines; 31 / 27 / 26 / 24px, line-height 1.16–1.25, letter-spacing −.2px on hero). Nunito Sans 400/600/700 (UI; 17px buttons, 16px body/options, 15px sub, 13px notes, 12px eyebrow uppercase with letter-spacing 1.2px). Load from Google Fonts.

**Radius:** buttons 16 · options/inputs 14 · cards 18 · lesson image 20 · checkbox 6 · pills 999.
**Buttons:** height 56, full width, bg #527cac, white 17px/700, no border.
**Spacing:** 4 / 8 / 10 / 12 / 14 / 18 / 20 / 22 / 24.

## Assets
All from codapet.com. For production, download them and self-host on the funnel domain:
- Wordmark: `https://www.codapet.com/images/codapet-new-logo-wordmark.svg`
- Icon: `https://www.codapet.com/images/codapet-icon.svg`
- Welcome image: `…/media/women_and_cat.0gkrq6ggu0ckl.webp`
- Lesson 1 image: `…/media/homepage_hero.0dlsaz5fn_fym.webp`
- Lesson 2 image: `…/media/women_holding_dog.1vry454d02jt2.webp`
(full URLs are in the prototype source)

## Files
- `QOL Facebook Funnel v3.dc.html`: the clickable prototype. The logic class at the bottom holds all copy and branching.
- `support.js`: needed only to open the prototype locally.

## Before launch
- CodaPet vets sign off on the lesson copy and the noticed → area mapping.
- The instant summary email is written in Reply.
- Privacy policy + terms linked in the funnel footer on the new domain.
