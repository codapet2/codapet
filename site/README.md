# CodaPet QOL quiz: static site

Plain HTML, CSS and JavaScript. No build step, no server. Upload this folder to any static host.

```
site/
  index.html        the funnel (one page, 7 screens)
  css/styles.css
  js/config.js      ← the only file you edit to launch
  js/app.js         screens, copy and behavior
  images/           brand watercolors
  privacy.html, terms.html   placeholder legal pages (replace the text before launch)
```

## 1. Set it up (`js/config.js`)

| Setting | What to put |
|---|---|
| `leadWebhookUrl` | Where emails are sent. See step 2. Empty = the quiz works but saves nothing. |
| `metaPixelId` | Your Meta Pixel ID. Fires `PageView`, `ViewContent` (welcome), `Lead` (email) and custom `StartQOLCheck` (final button). |
| `qolUrl` | The check people are sent to. Defaults to codapet.com/quality-of-life-scale. |
| `allowSkip` | `true` shows "Skip for now" under the email field. |

## 2. Collect the emails

A static page can't hold API keys, so each lead goes to a webhook as a form POST. The easiest option
is Zapier or Make:

1. Create a Zap with the trigger **Webhooks by Zapier → Catch Hook** and copy its URL into
   `leadWebhookUrl`.
2. Take the quiz once with a test email so Zapier sees the fields.
3. Add a **Filter**: only continue if `event` is `lead`.
4. Add actions, for example:
   - **Google Sheets → Create row** (a simple lead log), and/or
   - **Reply.io → add the contact to your QOL sequence**, mapping the fields below to Reply custom
     variables (`qol_focus_areas`, `qol_area_tips`, `qol_reason`, `utm_content`, `lead_id`).

Fields sent with every lead (`event=lead`):

| Field | Example |
|---|---|
| `email` | `jane@example.com` (trimmed, lowercased) |
| `lead_id` | random ID, also sent when they click through to the check |
| `reason` | `changes` · `diagnosis` · `older` · `prepared` |
| `noticed` | `eat,move` |
| `focus_areas` | `Hunger, Mobility` (or `All 7 areas`) |
| `area_tips` | "What to watch / One thing to try" text for each flagged area, ready for the first email |
| `utm_source` … `utm_term`, `fbclid`, `fbc`, `fbp`, `landing_url` | ad attribution |
| `event_id` | same ID as the Pixel `Lead` event (use it if you add Meta Conversions API in Zapier) |
| `consent_text`, `user_agent`, `submitted_at` | record of what they agreed to |

When someone clicks **Get my pet's score**, a second POST goes to the same URL with
`event=started_check`, `lead_id` and `email`. Use it to stop the "your check is waiting" email in Reply.

Bots that fill the hidden honeypot field are silently dropped.

## 3. Deploy

Any of these takes a few minutes:

- **Netlify:** app.netlify.com → Add new site → Deploy manually → drag the `site` folder in.
- **Vercel:** `npx vercel deploy site --prod`, or import the repo and set the root directory to `site`.
- **Cloudflare Pages / GitHub Pages:** point it at the `site` folder; no build command.
- **Any web host (cPanel, S3, etc.):** upload the contents of `site/` to the web root.

Then connect your domain in the host's settings.

## 4. Test before you spend on ads

- Run through the quiz on a phone, then check that a row arrives in Zapier/Sheets/Reply.
- Load the page with `?utm_source=facebook&utm_campaign=test&fbclid=abc` and confirm those values arrive.
- Use Meta's Pixel Helper or Events Manager → Test Events to see `ViewContent`, `Lead` and `StartQOLCheck`.
- Refresh mid-quiz: it should resume where you left off. Browser Back should step back one screen.

To run it locally: `npx serve site` (or `python3 -m http.server -d site`), then open the printed URL.

## Before launch

- [ ] Replace the text in `privacy.html` and `terms.html` with approved copy
- [ ] Vets sign off on the copy and the area tips in `js/app.js`
- [ ] The instant summary email is live in Reply (see `../docs/email-sequence.md`)
