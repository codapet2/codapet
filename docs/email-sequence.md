# QOL funnel: Reply.io email sequence (draft copy)

This is draft copy for marketing and the CodaPet vets to edit in Reply. The funnel promises the
**instant summary**, so email 1 must be live before any ad spend.

Variables come from the Reply custom fields that `/api/lead` sets:

| Variable | Example |
|---|---|
| `{{qol_focus_areas}}` | `Mobility, Happiness` (or `All 7 areas`) |
| `{{qol_area_tips}}` | One "What to watch / One thing to try" block per area (plain text, see `AREA_TIPS` in `src/lib/funnel.ts`) |
| `{{qol_duration_text}}` | `the past few weeks` |
| `{{qol_reason}}`, `{{qol_feeling}}` | Raw answers, for routing or conditional snippets |
| `{{lead_id}}` | Lead row id in Supabase |

Every link to the check should be
`https://www.codapet.com/quality-of-life-scale?utm_source=reply&utm_medium=email&utm_campaign=qol_funnel&utm_content=e{N}`.
Every email needs a one-click unsubscribe and CodaPet's physical mailing address (CAN-SPAM).

---

## 1. Instantly: "Your summary: what to watch this week"

> Preview: The areas you noticed, what they mean, and one small thing to try for each.

Hi there,

Thanks for taking a few minutes for your pet today. Here's the summary you asked for.

**Areas to watch: {{qol_focus_areas}}**

{{qol_area_tips}}

**Your next step:** CodaPet's quality of life check scores all 7 areas, so you'll know where your pet
stands instead of guessing. It takes about 5 minutes.

[Take the quality of life check →]

We'll check in again in 2 weeks. Checking twice shows which way things are heading.

Warmly,
The CodaPet vet team

---

## 2. After 1 hour, only if the check isn't started: "Your quality of life check is waiting"

Pause or skip this step for contacts whose `started_qol_at` is set (see README: "Pausing email 2").

> Preview: Take your time. It's here whenever you're ready.

These questions can be hard to think about. That's okay.

The check asks about one area at a time (pain, appetite, hydration, hygiene, happiness and mobility)
and gives you a clear score for each. Many people tell us it's a relief to see it written down.

[Take the check when you're ready →]

---

## 3. Day 3: "Try the good day / hard day calendar"

> Preview: The simple habit vets recommend.

One of the most useful things you can do costs nothing: **mark each day as good or hard.**

- Put a calendar on the fridge or use your phone.
- At bedtime, ask: *Was today mostly good for them, or mostly hard?*
- Add a word or two if something stood out ("didn't finish dinner", "played with the ball").

After a week or two, you'll see the pattern instead of relying on memory, which tends to blur. Bring it
to your next vet visit.

Pair it with the [quality of life check →] for a score in each area.

---

## 4. Day 7: "What vets mean by 'more good days than bad'"

> Preview: How to read the balance, and when to talk to a vet.

When vets talk about quality of life, they often come back to one question: **is your pet having more
good days than bad?**

- **Mostly good days:** keep watching, keep the calendar, and re-check every few weeks.
- **About even:** a good time to talk with your vet about comfort, pain relief, or changes at home.
- **More hard days than good:** it's time for a conversation with a vet about what comes next. You
  don't have to have it all figured out first.

If you'd like to talk it through, a CodaPet vet can help, in your home and at your pace.
[Talk with a CodaPet vet →]

---

## 5. Day 14: "How has your pet been these past two weeks?"

> Preview: Take the check again and see which way things are heading.

It's been two weeks since you first looked at {{qol_focus_areas}}.

Taking the check again now shows whether things are steady, improving, or shifting, and it only takes
about 5 minutes.

[Re-take the quality of life check →]
