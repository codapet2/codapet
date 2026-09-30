"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AREAS,
  ASSETS,
  CONSENT_TEXT,
  EMPTY_ANSWERS,
  QOL_URL,
  QUESTIONS,
  STEPS,
  areasTitle,
  clampStep,
  CHECK_GIVES,
  DONE_GAP,
  doneTitle,
  reassurance,
  whyNow,
  focusAreas,
  isStep,
  lessonFor,
  loadingItems,
  progressPct,
  summaryRows,
  toggleNoticed,
  type Answers,
  type Area,
  type Noticed,
  type Step,
} from "@/lib/funnel";
import { isValidEmail, normalizeEmail } from "@/lib/lead";
import { captureAttribution, metaIds, newEventId, pixel, type Attribution } from "@/lib/attribution";

const STORE_KEY = "qol-funnel-v1";
const ALLOW_SKIP = process.env.NEXT_PUBLIC_ALLOW_SKIP === "true";

interface Saved {
  step: Step;
  answers: Answers;
  email: string;
  leadId: string | null;
}

function loadSaved(): Saved | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<Saved>;
    return {
      step: isStep(s.step) ? s.step : "intro",
      answers: { ...EMPTY_ANSWERS, ...s.answers },
      email: typeof s.email === "string" ? s.email : "",
      leadId: typeof s.leadId === "string" ? s.leadId : null,
    };
  } catch {
    return null;
  }
}

function urlWithStep(step: Step): string {
  const url = new URL(window.location.href);
  if (step === "intro") url.searchParams.delete("step");
  else url.searchParams.set("step", step);
  return url.pathname + url.search + url.hash;
}

export default function Funnel() {
  const [step, setStep] = useState<Step>("intro");
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const attribution = useRef<Attribution | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const hits = useMemo(() => focusAreas(answers.noticed), [answers.noticed]);

  const stepRef = useRef(step);
  stepRef.current = step;

  // Move between steps. Each history entry carries its depth within the funnel
  // so Back never leaves the site. "replace" is used when leaving the loading
  // screen so browser-back from email skips it instead of re-running it.
  const go = useCallback((to: Step, mode: "push" | "replace" = "push") => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    const depth = (window.history.state?.depth as number | undefined) ?? 0;
    const url = urlWithStep(to);
    if (mode === "push") window.history.pushState({ step: to, depth: depth + 1 }, "", url);
    else window.history.replaceState({ step: to, depth }, "", url);
    setStep(to);
    window.scrollTo(0, 0);
  }, []);

  const next = useCallback(() => {
    const cur = stepRef.current;
    go(STEPS[Math.min(STEPS.indexOf(cur) + 1, STEPS.length - 1)], cur === "loading" ? "replace" : "push");
  }, [go]);

  // Restore state, capture attribution, and sync with the URL on first load.
  useEffect(() => {
    attribution.current = captureAttribution();
    const saved = loadSaved();
    const a = saved?.answers ?? EMPTY_ANSWERS;
    if (saved) {
      setAnswers(a);
      setEmail(saved.email);
      setLeadId(saved.leadId);
    }
    const fromUrl = new URLSearchParams(window.location.search).get("step");
    const wanted: Step = isStep(fromUrl) ? fromUrl : (saved?.step ?? "intro");
    const start = clampStep(wanted, a);
    window.history.replaceState({ step: start, depth: 0 }, "", urlWithStep(start));
    setStep(start);
    setHydrated(true);

    const onPop = (e: PopStateEvent) => {
      const s = isStep(e.state?.step) ? e.state.step : new URLSearchParams(window.location.search).get("step");
      const target = clampStep(isStep(s) ? s : "intro", answersRef.current);
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      setStep(target);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Persist so a refresh resumes where they left off.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ step, answers, email, leadId } satisfies Saved));
    } catch {}
  }, [hydrated, step, answers, email, leadId]);

  // Move focus to the new screen's heading for keyboard / screen reader users.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  // ViewContent once per session, on the welcome screen.
  useEffect(() => {
    if (!hydrated || step !== "intro") return;
    try {
      if (sessionStorage.getItem("qol-vc")) return;
      sessionStorage.setItem("qol-vc", "1");
    } catch {}
    pixel("ViewContent", false, newEventId(), { content_name: "QOL quiz" });
  }, [hydrated, step]);

  // Preload lesson images so they don't pop in.
  useEffect(() => {
    if (!hydrated) return;
    [ASSETS.lesson1, ASSETS.lesson2].forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [hydrated]);

  // Loading screen: ~2.3s fill, then a 500ms pause, then on to email.
  useEffect(() => {
    if (step !== "loading") return;
    setProgress(0);
    const timer = setInterval(() => setProgress((p) => Math.min(100, p + 4)), 90);
    return () => clearInterval(timer);
  }, [step]);

  useEffect(() => {
    if (step !== "loading" || progress < 100) return;
    const t = setTimeout(() => go("email", "replace"), 500);
    return () => clearTimeout(t);
  }, [step, progress, go]);

  const pickSingle = <K extends "reason" | "duration" | "feeling">(key: K, value: Answers[K]) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(next, 280);
  };

  const submitEmail = () => {
    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email");
      return;
    }
    setEmailError(null);
    const clean = normalizeEmail(email);
    setEmail(clean);
    const attr = attribution.current ?? captureAttribution();
    const { fbc, fbp } = metaIds(attr);
    const eventId = newEventId();
    pixel("Lead", false, eventId, { content_name: "QOL quiz" });
    const honeypot = (document.getElementById("company") as HTMLInputElement | null)?.value ?? "";
    fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({ email: clean, ...answers, ...attr, fbc, fbp, eventId, company: honeypot }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { id?: string } | null) => d?.id && setLeadId(d.id))
      .catch(() => {});
    go("done");
  };

  const startCheck = () => {
    const attr = attribution.current ?? captureAttribution();
    const { fbc, fbp } = metaIds(attr);
    const eventId = newEventId();
    pixel("StartQOLCheck", true, eventId);
    if (leadId) {
      fetch(`/api/lead/${leadId}/started`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({ eventId, fbc, fbp, landingUrl: attr.landingUrl }),
      }).catch(() => {});
    }
  };

  const qolHref = useMemo(() => {
    const url = new URL(QOL_URL);
    url.searchParams.set("utm_source", "qol_funnel");
    url.searchParams.set("utm_medium", "funnel");
    const campaign = attribution.current?.utm.campaign;
    if (campaign) url.searchParams.set("utm_campaign", campaign);
    return url.toString();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const showBar = step !== "intro" && step !== "loading";
  const back = () => {
    if ((window.history.state?.depth ?? 0) > 0) window.history.back();
    else go(STEPS[Math.max(0, STEPS.indexOf(step) - 1)], "replace");
  };

  return (
    <div className="flex min-h-dvh flex-col bg-page">
      {showBar && (
        <div className="flex items-center gap-3.5 px-5 pt-[18px] pb-3.5">
          <button
            type="button"
            onClick={back}
            aria-label="Back"
            className="w-5 cursor-pointer p-0 text-2xl leading-none text-muted-2"
          >
            ‹
          </button>
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-line"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPct(step)}
            aria-label="Quiz progress"
          >
            <div
              className="h-1.5 rounded-[3px] bg-primary transition-[width] duration-[350ms] ease-in-out"
              style={{ width: `${progressPct(step)}%` }}
            />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ASSETS.icon} alt="" className="h-5" />
        </div>
      )}

      <main className="flex flex-1 flex-col" key={step}>
        {step === "intro" && (
          <div className="flex flex-1 flex-col">
            <div
              className="h-[330px] bg-placeholder bg-cover bg-no-repeat"
              style={{ backgroundImage: `url('${ASSETS.welcome}')`, backgroundPosition: "center 30%" }}
              role="img"
              aria-label="A woman holding her cat"
            />
            <div className="flex flex-col gap-3 px-6 pt-[26px]">
              <Eyebrow>Free · 2 minutes</Eyebrow>
              <h1 ref={headingRef} tabIndex={-1} className="font-serif text-[31px] leading-[1.16] font-medium tracking-[-0.2px] text-pretty outline-none">
                Is your pet having more good days than bad?
              </h1>
              <p className="text-base leading-normal text-body text-pretty">
                Answer a few quick questions and learn what vets look for as pets age or get sick.
              </p>
            </div>
            <div className="mt-auto flex flex-col gap-3 px-5 pt-6 pb-[26px]">
              <PrimaryButton onClick={next}>Let’s begin</PrimaryButton>
              <span className="text-center text-[13px] text-muted">Designed with CodaPet veterinarians</span>
              <LegalLinks />
            </div>
          </div>
        )}

        {(step === "reason" || step === "duration" || step === "feeling") && (
          <Screen>
            <Heading headingRef={headingRef} title={QUESTIONS[step].title} sub={QUESTIONS[step].sub} />
            <div className="flex flex-col gap-2.5">
              {QUESTIONS[step].options.map((o) => (
                <OptionButton
                  key={o.value}
                  label={o.label}
                  selected={answers[step] === o.value}
                  onClick={() => pickSingle(step, o.value as never)}
                />
              ))}
            </div>
          </Screen>
        )}

        {step === "noticed" && (
          <Screen>
            <Heading headingRef={headingRef} title={QUESTIONS.noticed.title} sub={QUESTIONS.noticed.sub} />
            <div className="flex flex-col gap-2.5" role="group" aria-label={QUESTIONS.noticed.title}>
              {QUESTIONS.noticed.options.map((o) => (
                <OptionButton
                  key={o.value}
                  multi
                  label={o.label}
                  selected={answers.noticed.includes(o.value)}
                  onClick={() => setAnswers((a) => ({ ...a, noticed: toggleNoticed(a.noticed, o.value as Noticed) }))}
                />
              ))}
            </div>
            <PrimaryButton onClick={next} disabled={!answers.noticed.length} className="mt-auto">
              Continue
            </PrimaryButton>
          </Screen>
        )}

        {(step === "info1" || step === "info2") && (() => {
          const l = lessonFor(step, answers);
          return (
            <Screen gap="gap-5">
              <div
                className="h-[260px] rounded-[20px] bg-placeholder bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url('${l.image}')` }}
                role="img"
                aria-label={step === "info1" ? "A pet owner with their pet" : "A woman holding her dog"}
              />
              <div className="flex flex-col gap-2.5 px-1">
                <Eyebrow>{l.kicker}</Eyebrow>
                <h2 ref={headingRef} tabIndex={-1} className="font-serif text-[27px] leading-[1.2] font-medium text-pretty outline-none">
                  {l.title}
                </h2>
                <p className="text-base leading-[1.55] text-body text-pretty">{l.body}</p>
              </div>
              <PrimaryButton onClick={next} className="mt-auto">Continue</PrimaryButton>
            </Screen>
          );
        })()}

        {step === "areas" && (
          <Screen gap="gap-[18px]">
            <div className="flex flex-col gap-2 px-1">
              <Eyebrow>What vets look at</Eyebrow>
              <h2 ref={headingRef} tabIndex={-1} className="font-serif text-[26px] leading-[1.2] font-medium text-pretty outline-none">
                {areasTitle(hits)}
              </h2>
              <p className="text-[15px] leading-[1.45] text-muted text-pretty">
                Vets look at 7 everyday areas. That way no single bad day decides the picture.
              </p>
            </div>
            <ul className="rounded-[18px] border border-line bg-white px-4 py-1">
              {AREAS.map((a) => (
                <li key={a.name} className="flex items-center justify-between gap-2.5 border-b border-divider py-[11px] last:border-b-0">
                  <div className="flex flex-col gap-px">
                    <span className="text-[15px] font-bold">{a.name}</span>
                    <span className="text-[13px] text-muted-2">{a.desc}</span>
                  </div>
                  {hits.includes(a.name) && (
                    <span className="flex-none rounded-full bg-pill px-[9px] py-1 text-xs font-bold text-pill-ink">You noticed</span>
                  )}
                </li>
              ))}
            </ul>
            <PrimaryButton onClick={next} className="mt-auto">Continue</PrimaryButton>
          </Screen>
        )}

        {step === "loading" && (
          <div className="flex flex-1 flex-col justify-center gap-[26px] px-7 pb-[60px]" aria-live="polite">
            <div className="flex flex-col items-center gap-2.5 text-center">
              <span className="font-serif text-[56px] leading-none text-primary">{progress}%</span>
              <h2 ref={headingRef} tabIndex={-1} className="font-serif text-2xl leading-[1.25] font-medium outline-none">
                Putting your summary together
              </h2>
            </div>
            <div className="h-2 overflow-hidden rounded bg-line">
              <div className="h-2 rounded bg-primary" style={{ width: `${progress}%` }} />
            </div>
            <ul className="flex flex-col gap-3.5">
              {loadingItems(answers.duration).map((it) => {
                const done = progress >= it.at;
                return (
                  <li key={it.t} className={`flex items-center gap-3 text-[15px] font-semibold transition-colors ${done ? "text-ink" : "text-disabled"}`}>
                    <span className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full text-xs text-white transition-colors ${done ? "bg-success" : "bg-line"}`}>
                      {done ? "✓" : ""}
                    </span>
                    <span>{it.t}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {step === "email" && (
          <Screen gap="gap-[18px]">
            <div className="flex flex-col gap-2 px-1">
              <span className="text-[13px] font-bold text-success">✓ Your summary is ready</span>
              <h2 ref={headingRef} tabIndex={-1} className="font-serif text-[27px] leading-[1.2] font-medium text-pretty outline-none">
                Where should we send it?
              </h2>
            </div>
            <CheckCard rows={summaryRows(hits)} />
            <form
              noValidate
              className="flex flex-1 flex-col gap-[18px]"
              onSubmit={(e) => {
                e.preventDefault();
                submitEmail();
              }}
            >
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="sr-only">Email address</label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "email-error" : undefined}
                  className={`h-14 w-full rounded-[14px] border bg-white px-4 text-[17px] text-ink outline-none placeholder:text-[#9aa3ae] focus:border-primary ${emailError ? "border-[#b4443a]" : "border-input"}`}
                />
                {emailError && (
                  <span id="email-error" role="alert" className="px-1 text-[13px] font-semibold text-[#b4443a]">
                    {emailError}
                  </span>
                )}
                {/* Honeypot: hidden from people, tempting to bots. */}
                <input id="company" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
              </div>
              <div className="mt-auto flex flex-col gap-2.5">
                <PrimaryButton type="submit">Send it &amp; start the check</PrimaryButton>
                {ALLOW_SKIP && (
                  <button type="button" onClick={() => go("done")} className="cursor-pointer text-sm text-muted-2 underline">
                    Skip for now
                  </button>
                )}
                <span className="text-center text-[13px] leading-[1.45] text-muted">{CONSENT_TEXT}</span>
                <LegalLinks />
              </div>
            </form>
          </Screen>
        )}

        {step === "done" && (
          <Screen gap="gap-[18px]">
            <div className="flex flex-col gap-2 px-1">
              <span className="text-[13px] font-bold text-success">
                {leadId || email ? "✓ Summary sent. One step left." : "One step left."}
              </span>
              <h2 ref={headingRef} tabIndex={-1} className="font-serif text-[26px] leading-[1.2] font-medium text-pretty outline-none">
                {doneTitle(hits, answers)}
              </h2>
              <p className="text-[15px] leading-normal text-body text-pretty">{DONE_GAP}</p>
            </div>

            <ScoreCard hits={hits} />

            <div className="flex flex-col gap-2.5">
              <span className="px-1 text-xs font-bold tracking-[1.2px] text-primary uppercase">What you’ll get</span>
              <CheckCard rows={CHECK_GIVES.map((g) => ({ t: g.t, d: g.d }))} />
            </div>

            <div className="flex flex-col gap-1.5 rounded-[18px] bg-tint p-4">
              <span className="text-xs font-bold tracking-[1.2px] text-primary uppercase">Why today</span>
              <p className="text-[15px] leading-normal text-ink text-pretty">{whyNow(answers)}</p>
              <p className="text-[14px] leading-normal text-body text-pretty">{reassurance(answers.feeling)}</p>
            </div>

            {/* Stays in view while they scroll, so the next step is always one tap away. */}
            <div className="sticky bottom-0 -mx-5 mt-auto flex flex-col gap-2 bg-gradient-to-t from-page from-75% to-transparent px-5 pt-5 pb-[max(16px,env(safe-area-inset-bottom))]">
              <a
                href={qolHref}
                onClick={startCheck}
                className="flex h-14 items-center justify-center rounded-2xl bg-primary text-[17px] font-bold text-white no-underline shadow-[0_6px_18px_rgba(82,124,172,.35)] transition-colors hover:bg-primary-hover hover:text-white"
              >
                Get my pet’s score
              </a>
              <span className="text-center text-[13px] font-semibold text-body">
                About 5 minutes · Free · Vet-designed
              </span>
            </div>
          </Screen>
        )}
      </main>
    </div>
  );
}

function Screen({ children, gap = "gap-[22px]" }: { children: ReactNode; gap?: string }) {
  return <div className={`flex flex-1 flex-col px-5 pt-3.5 pb-6 ${gap}`}>{children}</div>;
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="text-xs font-bold tracking-[1.2px] text-primary uppercase">{children}</span>;
}

function Heading({
  title,
  sub,
  headingRef,
}: {
  title: string;
  sub: string;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <div className="flex flex-col gap-2 px-1">
      <h2 ref={headingRef} tabIndex={-1} className="font-serif text-[27px] leading-[1.2] font-medium text-pretty outline-none">
        {title}
      </h2>
      <p className="text-[15px] leading-[1.45] text-muted">{sub}</p>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`h-14 w-full cursor-pointer rounded-2xl border-0 text-[17px] font-bold text-white transition-colors ${
        disabled ? "cursor-not-allowed bg-primary-disabled" : "bg-primary hover:bg-primary-hover"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function OptionButton({
  label,
  selected,
  onClick,
  multi = false,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex min-h-[58px] cursor-pointer items-center justify-between gap-3 rounded-[14px] border-2 px-4 py-3 text-left text-base font-bold text-ink transition-[background-color,border-color] duration-150 ${
        selected ? "border-primary bg-tint" : "border-line bg-white"
      }`}
    >
      <span>{label}</span>
      <span
        aria-hidden="true"
        className={`flex h-[22px] w-[22px] flex-none items-center justify-center border-2 text-[13px] text-white ${
          multi ? "rounded-md" : "rounded-full"
        } ${selected ? "border-primary bg-primary" : "border-line bg-white"}`}
      >
        {selected ? "✓" : ""}
      </span>
    </button>
  );
}

function ScoreCard({ hits }: { hits: Area[] }) {
  return (
    <div className="flex flex-col gap-3.5 rounded-[18px] border border-line bg-white p-4">
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[15px] font-bold">Your pet’s quality of life score</span>
          <span className="text-[13px] text-muted">
            {hits.length ? `${hits.length} of 7 areas flagged` : "No areas flagged"} · 0 of 7 scored
          </span>
        </div>
        <span className="flex-none font-serif text-[34px] leading-none text-ink" aria-label="Not scored yet, out of 70">
          <span className="text-primary">?</span>
          <span className="text-[20px] text-muted-2"> / 70</span>
        </span>
      </div>
      <ul className="grid grid-cols-[max-content_1fr_auto] items-center gap-x-2.5 gap-y-2" aria-label="The 7 areas">
        {AREAS.map((a) => {
          const hit = hits.includes(a.name);
          return (
            <li key={a.name} className="contents">
              <span className="text-[13px] font-bold">{a.name}</span>
              <span className="h-2 rounded-full border border-dashed border-line bg-page" aria-hidden="true" />
              <span className={`text-[12px] font-bold ${hit ? "rounded-full bg-pill px-2 py-0.5 text-pill-ink" : "text-disabled"}`}>
                {hit ? "Change noticed" : "Not scored"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CheckCard({ rows }: { rows: { t: string; d: string }[] }) {
  return (
    <ul className="flex flex-col gap-3 rounded-[18px] border border-line bg-white p-4">
      {rows.map((s) => (
        <li key={s.t} className="flex items-start gap-3">
          <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[7px] bg-primary text-xs font-bold text-white">
            ✓
          </span>
          <div className="flex flex-col gap-px">
            <span className="text-[15px] font-bold">{s.t}</span>
            <span className="text-[13px] leading-[1.4] text-muted">{s.d}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function LegalLinks() {
  return (
    <nav className="flex justify-center gap-4 text-xs text-muted-2" aria-label="Legal">
      <a href="/privacy" className="text-muted-2 underline">Privacy</a>
      <a href="/terms" className="text-muted-2 underline">Terms</a>
    </nav>
  );
}
