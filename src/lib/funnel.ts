// All funnel copy, branching and derived values live here so vets/marketing
// can review one file. Mirrors the logic class in docs/design-handoff.

export const STEPS = [
  "intro",
  "reason",
  "info1",
  "duration",
  "noticed",
  "areas",
  "feeling",
  "info2",
  "loading",
  "email",
  "done",
] as const;
export type Step = (typeof STEPS)[number];

export type Reason = "changes" | "diagnosis" | "older" | "prepared";
export type Duration = "recent" | "weeks" | "months" | "unsure";
export type Feeling = "worried" | "overwhelmed" | "unsure" | "calm";
export type Noticed = "play" | "eat" | "drink" | "move" | "accidents" | "night" | "ok";
export type Area =
  | "Hurt"
  | "Hunger"
  | "Hydration"
  | "Hygiene"
  | "Happiness"
  | "Mobility"
  | "More good days";

export interface Answers {
  reason: Reason | null;
  duration: Duration | null;
  noticed: Noticed[];
  feeling: Feeling | null;
}

export const EMPTY_ANSWERS: Answers = { reason: null, duration: null, noticed: [], feeling: null };

export const QOL_URL =
  process.env.NEXT_PUBLIC_QOL_URL || "https://www.codapet.com/quality-of-life-scale";

export const CONSENT_TEXT = "Private. No calls, no spam. Unsubscribe anytime.";

// Remote until `npm run fetch-assets` has been run on a machine that can reach codapet.com;
// then swap to the local /images paths.
const CDN = (f: string) =>
  `https://www.codapet.com/_next/image?url=%2F_next%2Fstatic%2Fimmutable%2Fmedia%2F${f}&w=828&q=75`;
export const ASSETS = {
  wordmark: "https://www.codapet.com/images/codapet-new-logo-wordmark.svg",
  icon: "https://www.codapet.com/images/codapet-icon.svg",
  welcome: CDN("women_and_cat.0gkrq6ggu0ckl.webp"),
  lesson1: CDN("homepage_hero.0dlsaz5fn_fym.webp"),
  lesson2: CDN("women_holding_dog.1vry454d02jt2.webp"),
};

type Option<K extends string> = { value: K; label: string };

export const REASON_OPTIONS: Option<Reason>[] = [
  { value: "changes", label: "I’ve noticed some changes" },
  { value: "diagnosis", label: "My pet has a diagnosis" },
  { value: "older", label: "My pet is getting older" },
  { value: "prepared", label: "I just want to be prepared" },
];

export const DURATION_OPTIONS: Option<Duration>[] = [
  { value: "recent", label: "Just the past few days" },
  { value: "weeks", label: "A few weeks" },
  { value: "months", label: "A few months or more" },
  { value: "unsure", label: "I’m not sure" },
];

export const FEELING_OPTIONS: Option<Feeling>[] = [
  { value: "worried", label: "Worried" },
  { value: "overwhelmed", label: "Overwhelmed" },
  { value: "unsure", label: "Not sure what’s normal" },
  { value: "calm", label: "Calm, just checking in" },
];

export const NOTICED_OPTIONS: (Option<Noticed> & { area: Area | null })[] = [
  { value: "play", label: "Less interest in play or walks", area: "Happiness" },
  { value: "eat", label: "Eating less", area: "Hunger" },
  { value: "drink", label: "Drinking more or less", area: "Hydration" },
  { value: "move", label: "Trouble with stairs or jumping", area: "Mobility" },
  { value: "accidents", label: "Accidents or trouble grooming", area: "Hygiene" },
  { value: "night", label: "Restless, panting or hiding", area: "Hurt" },
  { value: "ok", label: "Nothing yet, they seem okay", area: null },
];

export const AREAS: { name: Area; desc: string }[] = [
  { name: "Hurt", desc: "Pain or discomfort" },
  { name: "Hunger", desc: "Eating enough" },
  { name: "Hydration", desc: "Drinking enough" },
  { name: "Hygiene", desc: "Staying clean" },
  { name: "Happiness", desc: "Interest and joy" },
  { name: "Mobility", desc: "Getting around" },
  { name: "More good days", desc: "Than bad ones, overall" },
];

export const QUESTIONS = {
  reason: { title: "What brings you here today?", sub: "Pick the one that fits best.", options: REASON_OPTIONS },
  duration: { title: "How long has this been on your mind?", sub: "There’s no right answer.", options: DURATION_OPTIONS },
  noticed: { title: "Have you noticed any of these?", sub: "Select all that apply.", options: NOTICED_OPTIONS },
  feeling: { title: "How are you feeling about it?", sub: "It helps us choose what to send you.", options: FEELING_OPTIONS },
} as const;

export type Lesson = { kicker: string; title: string; body: string; image: string };

const INFO1: Record<Reason, Omit<Lesson, "image">> = {
  changes: {
    kicker: "Trust that feeling",
    title: "You know your pet better than anyone.",
    body: "Vets say small changes are often the earliest and most useful signs. They’re worth noting before the days blur together.",
  },
  diagnosis: {
    kicker: "After a diagnosis",
    title: "Comfort matters as much as the condition.",
    body: "With an illness, vets focus on how your pet feels day to day. That’s exactly what a quality of life check looks at.",
  },
  older: {
    kicker: "About aging",
    title: "Aging is many small changes, not one.",
    body: "That’s why vets break it into everyday areas, so you can see which ones are shifting and which are fine.",
  },
  prepared: {
    kicker: "Good thinking",
    title: "Checking on a good day helps later.",
    body: "A check while things are okay gives you a baseline, so any change is easier to spot.",
  },
};

const INFO2: Record<Feeling, Omit<Lesson, "image" | "kicker">> = {
  worried: {
    title: "Worry means you’re paying attention.",
    body: "You don’t need all the answers today. Looking at one area at a time makes things clearer and less heavy.",
  },
  overwhelmed: {
    title: "Let’s make it smaller.",
    body: "One question, one area, one week at a time. That’s all the check asks of you.",
  },
  unsure: {
    title: "Knowing what’s normal is hard.",
    body: "The check puts what you see next to what vets look for, so it’s easier to tell ordinary aging from something more.",
  },
  calm: {
    title: "A great place to start from.",
    body: "Checking in while you feel steady gives you a clear record to compare with later.",
  },
};

export function lessonFor(step: "info1" | "info2", a: Answers): Lesson {
  if (step === "info1") return { ...INFO1[a.reason ?? "changes"], image: ASSETS.lesson1 };
  return { kicker: "From our vets", ...INFO2[a.feeling ?? "worried"], image: ASSETS.lesson2 };
}

const DURATION_TEXT: Record<Duration, string> = {
  recent: "recent changes",
  weeks: "the past few weeks",
  months: "longer-term changes",
  unsure: "what you’ve noticed",
};

export function durationText(d: Duration | null): string {
  return d ? DURATION_TEXT[d] : DURATION_TEXT.unsure;
}

/** Areas matched by the "noticed" answers, in the order of NOTICED_OPTIONS. */
export function focusAreas(noticed: readonly string[]): Area[] {
  return NOTICED_OPTIONS.filter((o) => o.area && noticed.includes(o.value)).map((o) => o.area as Area);
}

/** Toggle a "noticed" option. "ok" is exclusive with every other option. */
export function toggleNoticed(current: Noticed[], value: Noticed): Noticed[] {
  if (current.includes(value)) return current.filter((v) => v !== value);
  if (value === "ok") return ["ok"];
  return [...current.filter((v) => v !== "ok"), value];
}

export function joinAnd(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function areasTitle(hits: Area[]): string {
  return hits.length
    ? `What you noticed falls under ${hits.length} of the 7 areas`
    : "Here’s what vets pay attention to";
}

// ---- Hand-off screen ("done") ----
// The quiz can spot changes but can't measure them. The page makes that gap
// visible (an unscored "? / 70") and sells the check as the way to close it.
// Scoring facts follow the HHHHHMM scale (Villalobos): 7 areas, 0–10 each,
// 70 total, 35+ generally read as acceptable. Confirm against CodaPet's check.

export function doneTitle(hits: Area[], a: Pick<Answers, "reason" | "noticed">): string {
  if (hits.length) {
    return `You spotted changes in ${joinAnd(hits)}. Now find out how much they’re affecting your pet.`;
  }
  if (a.reason === "diagnosis") return "Now find out how the diagnosis is affecting your pet day to day.";
  return "Your pet seems okay. Get a score that shows it, while things are good.";
}

export const DONE_GAP =
  "This quiz can spot changes. It can’t measure them. The quality of life check scores each of the 7 areas from 0 to 10, so you get a real number instead of a worry.";

export function whyNow(a: Pick<Answers, "reason" | "duration">): string {
  switch (a.reason) {
    case "diagnosis":
      return "After a diagnosis, a score today gives you and your vet a starting point to measure treatment and comfort against.";
    case "older":
      return "Aging happens slowly, which makes it easy to miss. A score today makes the next change easy to spot.";
    case "prepared":
      return "Scoring on a good day gives you a baseline. If things change later, you’ll see it right away.";
    default:
      return a.duration === "months"
        ? "You’ve had this on your mind for months. A score shows whether it’s time to talk with your vet."
        : "Changes are easiest to help with when they’re caught early. Scoring now gives you a starting point.";
  }
}

const REASSURE: Record<Feeling, string> = {
  worried: "Whatever the score, you’ll know exactly what to ask your vet.",
  overwhelmed: "It’s one question at a time. You can stop whenever you need to.",
  unsure: "It puts what you’re seeing next to what vets look for, so you’ll know what’s normal.",
  calm: "You’ll have a clear record to compare with in two weeks.",
};

export function reassurance(f: Feeling | null): string {
  return REASSURE[f ?? "calm"];
}

export const CHECK_GIVES = [
  { t: "A 0–10 score for each area", d: "See which areas need help and which are fine." },
  { t: "A total out of 70", d: "The number vets use to judge overall quality of life. 35 or more is generally considered acceptable." },
  { t: "Clear answers for your vet", d: "Bring numbers to your next visit instead of “something seems off.”" },
  { t: "A baseline for your 2-week re-check", d: "We’ll remind you, so you can see which way things are heading." },
];

export function summaryRows(hits: Area[]) {
  return [
    {
      t: `Areas to watch: ${hits.length ? hits.join(", ") : "All 7 areas"}`,
      d: "What each one means and what to look for this week.",
    },
    { t: "Tips from CodaPet vets", d: "Small ways to bring more comfort to your pet’s day." },
    { t: "A reminder in 2 weeks", d: "Checking twice shows which way things are heading." },
  ];
}

export function loadingItems(d: Duration | null) {
  return [
    { t: "Matching your answers to the 7 areas", at: 30 },
    { t: `Choosing tips for ${durationText(d)}`, at: 65 },
    { t: "Preparing your summary", at: 95 },
  ];
}


export function progressPct(step: Step): number {
  return Math.round((STEPS.indexOf(step) / (STEPS.length - 1)) * 100);
}

export function isStep(s: unknown): s is Step {
  return typeof s === "string" && (STEPS as readonly string[]).includes(s);
}

/**
 * The furthest step the answers allow. Stops deep links or stale history from
 * landing someone on a screen whose inputs are missing. "done" is allowed once
 * the quiz is complete, since the optional skip reaches it without an email.
 */
export function maxReachableStep(a: Answers): Step {
  if (!a.reason) return "reason";
  if (!a.duration) return "duration";
  if (!a.noticed.length) return "noticed";
  if (!a.feeling) return "feeling";
  return "done";
}

export function clampStep(step: Step, a: Answers): Step {
  const max = maxReachableStep(a);
  return STEPS.indexOf(step) <= STEPS.indexOf(max) ? step : max;
}

// Plain-language "what to watch" + one tip per area, used in the instant summary
// email via the Reply custom field `qol_area_tips`. NEEDS VET SIGN-OFF before launch.
export const AREA_TIPS: Record<Area, { watch: string; tip: string }> = {
  Hurt: {
    watch: "Panting at rest, restlessness at night, hiding, or not wanting to be touched in one spot.",
    tip: "Note what time of day it happens. Patterns help your vet tell pain from other causes.",
  },
  Hunger: {
    watch: "Leaving food in the bowl, eating slowly, or only eating treats.",
    tip: "Try warming wet food slightly to make it smell stronger, and write down roughly how much they eat each day.",
  },
  Hydration: {
    watch: "Drinking much more or less than usual, or dry, tacky gums.",
    tip: "Fill the bowl to the same line each morning so you can see how much is gone by evening.",
  },
  Hygiene: {
    watch: "Accidents in the house, a matted or greasy coat, or trouble keeping themselves clean.",
    tip: "Washable bedding and a gentle wipe-down after accidents keep skin healthy and help them feel like themselves.",
  },
  Happiness: {
    watch: "Less interest in toys, walks, people, or the things that used to excite them.",
    tip: "Keep a short list of their three favorite things. If they stop enjoying those, it’s worth noting.",
  },
  Mobility: {
    watch: "Hesitating at stairs, trouble jumping up, slipping on floors, or slow to stand.",
    tip: "Rugs or yoga mats on slick floors and a ramp or step to their favorite spot can make a big difference.",
  },
  "More good days": {
    watch: "The overall balance of good days and hard days over a week or two.",
    tip: "Mark each day on a calendar as good or hard. After two weeks, the pattern is easier to see.",
  },
};

/** Text block for the instant summary email. Falls back to all 7 areas. */
export function areaTipsText(hits: readonly Area[]): string {
  const list = hits.length ? hits : AREAS.map((a) => a.name);
  return list.map((a) => `${a}\nWhat to watch: ${AREA_TIPS[a].watch}\nOne thing to try: ${AREA_TIPS[a].tip}`).join("\n\n");
}
