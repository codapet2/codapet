/* CodaPet quality of life quiz funnel. Plain JavaScript, no build step.
 * Flow: intro > reason > noticed > areas > loading > email > done.
 * All copy lives in the COPY section below so it can be reviewed in one place. */
(function () {
  "use strict";

  var CFG = window.QOL_CONFIG || {};
  var QOL_URL = CFG.qolUrl || "https://www.codapet.com/quality-of-life-scale";
  var CONSENT_TEXT = "Private. No calls, no spam. Unsubscribe anytime.";
  var STORE_KEY = "qol-funnel-v2";
  var ATTR_KEY = "qol-attribution";
  var STEPS = ["intro", "reason", "noticed", "areas", "loading", "email", "done"];

  var IMG = {
    welcome: "images/welcome.webp",
    email: "images/lesson1.webp",
    checklist: "images/checklist.webp",
  };

  /* ───────────────────────────── COPY ───────────────────────────── */

  var REASONS = [
    { value: "changes", label: "I’ve noticed some changes" },
    { value: "diagnosis", label: "My pet has a diagnosis" },
    { value: "older", label: "My pet is getting older" },
    { value: "prepared", label: "I just want to be prepared" },
  ];

  var NOTICED = [
    { value: "play", label: "Less interest in play or walks", area: "Happiness" },
    { value: "eat", label: "Eating less", area: "Hunger" },
    { value: "drink", label: "Drinking more or less", area: "Hydration" },
    { value: "move", label: "Trouble with stairs or jumping", area: "Mobility" },
    { value: "accidents", label: "Accidents or trouble grooming", area: "Hygiene" },
    { value: "night", label: "Restless, panting or hiding", area: "Hurt" },
    { value: "ok", label: "Nothing yet, they seem okay", area: null },
  ];

  var AREAS = [
    { name: "Hurt", desc: "Pain or discomfort" },
    { name: "Hunger", desc: "Eating enough" },
    { name: "Hydration", desc: "Drinking enough" },
    { name: "Hygiene", desc: "Staying clean" },
    { name: "Happiness", desc: "Interest and joy" },
    { name: "Mobility", desc: "Getting around" },
    { name: "More good days", desc: "Than bad ones, overall" },
  ];

  // Lesson shown at the top of the 7-areas screen, matched to "reason".
  var LESSONS = {
    changes: { kicker: "Trust that feeling", title: "You know your pet better than anyone." },
    diagnosis: { kicker: "After a diagnosis", title: "Comfort matters as much as the condition." },
    older: { kicker: "About aging", title: "Aging is many small changes, not one." },
    prepared: { kicker: "Good thinking", title: "Checking on a good day helps later." },
  };

  var WHY_NOW = {
    changes: "Changes are easiest to help with when they’re caught early. Scoring now gives you a starting point.",
    diagnosis: "After a diagnosis, a score today gives you and your vet a starting point to measure treatment and comfort against.",
    older: "Aging happens slowly, which makes it easy to miss. A score today makes the next change easy to spot.",
    prepared: "Scoring on a good day gives you a baseline. If things change later, you’ll see it right away.",
  };

  // Scoring facts follow the HHHHHMM scale: 7 areas, 0–10 each, 70 total.
  var CHECK_GIVES = [
    { t: "A 0–10 score for each area", d: "See which areas need help and which are fine." },
    { t: "A total out of 70", d: "The number vets use to judge overall quality of life. 35 or more is generally considered acceptable." },
    { t: "Clear answers for your vet", d: "Bring numbers to your next visit instead of “something seems off.”" },
    { t: "A baseline for your 2-week re-check", d: "We’ll remind you, so you can see which way things are heading." },
  ];

  var LOADING_ITEMS = [
    { t: "Matching your answers to the 7 areas", at: 30 },
    { t: "Choosing tips from CodaPet vets", at: 65 },
    { t: "Preparing your summary", at: 95 },
  ];

  // Sent with each lead so the first email can explain the areas they flagged.
  // NEEDS VET SIGN-OFF before launch.
  var AREA_TIPS = {
    Hurt: ["Panting at rest, restlessness at night, hiding, or not wanting to be touched in one spot.", "Note what time of day it happens. Patterns help your vet tell pain from other causes."],
    Hunger: ["Leaving food in the bowl, eating slowly, or only eating treats.", "Try warming wet food slightly to make it smell stronger, and write down roughly how much they eat each day."],
    Hydration: ["Drinking much more or less than usual, or dry, tacky gums.", "Fill the bowl to the same line each morning so you can see how much is gone by evening."],
    Hygiene: ["Accidents in the house, a matted or greasy coat, or trouble keeping themselves clean.", "Washable bedding and a gentle wipe-down after accidents keep skin healthy and help them feel like themselves."],
    Happiness: ["Less interest in toys, walks, people, or the things that used to excite them.", "Keep a short list of their three favorite things. If they stop enjoying those, it’s worth noting."],
    Mobility: ["Hesitating at stairs, trouble jumping up, slipping on floors, or slow to stand.", "Rugs or yoga mats on slick floors and a ramp or step to their favorite spot can make a big difference."],
    "More good days": ["The overall balance of good days and hard days over a week or two.", "Mark each day on a calendar as good or hard. After two weeks, the pattern is easier to see."],
  };

  /* ──────────────────────────── HELPERS ─────────────────────────── */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function storageGet(store, key) { try { return JSON.parse(store.getItem(key)); } catch (e) { return null; } }
  function storageSet(store, key, val) { try { store.setItem(key, JSON.stringify(val)); } catch (e) {} }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
  }
  function joinAnd(items) {
    if (items.length <= 1) return items.join("");
    return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
  }
  function focusAreas(noticed) {
    return NOTICED.filter(function (o) { return o.area && noticed.indexOf(o.value) !== -1; })
      .map(function (o) { return o.area; });
  }
  function areaTipsText(hits) {
    var list = hits.length ? hits : AREAS.map(function (a) { return a.name; });
    return list.map(function (a) {
      return a + "\nWhat to watch: " + AREA_TIPS[a][0] + "\nOne thing to try: " + AREA_TIPS[a][1];
    }).join("\n\n");
  }
  // Basic RFC-style check: local@domain.tld, no spaces, one @.
  var EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
  function isValidEmail(raw) {
    var e = String(raw || "").trim().toLowerCase();
    return e.length <= 254 && EMAIL_RE.test(e) && e.indexOf("..") === -1;
  }

  /* ───────────────────────── STATE + ATTRIBUTION ───────────────────────── */

  var state = { step: "intro", reason: null, noticed: [], email: "", leadId: null };
  var saved = storageGet(localStorage, STORE_KEY);
  if (saved && typeof saved === "object") {
    if (LESSONS[saved.reason]) state.reason = saved.reason;
    if (Array.isArray(saved.noticed)) state.noticed = saved.noticed.filter(function (v) { return NOTICED.some(function (o) { return o.value === v; }); });
    if (typeof saved.email === "string") state.email = saved.email;
    if (typeof saved.leadId === "string") state.leadId = saved.leadId;
    if (STEPS.indexOf(saved.step) !== -1) state.step = saved.step;
  }
  function persist() { storageSet(localStorage, STORE_KEY, state); }

  // UTM + fbclid from the landing URL, kept for the session. Only a URL that
  // carries ad params overwrites what is stored.
  var attribution = (function () {
    var params = new URLSearchParams(location.search);
    var utm = {};
    ["source", "medium", "campaign", "content", "term"].forEach(function (k) {
      var v = params.get("utm_" + k);
      if (v) utm[k] = v.slice(0, 200);
    });
    var fbclid = params.get("fbclid");
    var stored = storageGet(sessionStorage, ATTR_KEY);
    if (stored && !fbclid && !Object.keys(utm).length) return stored;
    var url = new URL(location.href);
    url.searchParams.delete("step");
    var fresh = { utm: utm, fbclid: fbclid, landingUrl: url.toString() };
    storageSet(sessionStorage, ATTR_KEY, fresh);
    return fresh;
  })();

  function cookie(name) {
    var m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : "";
  }
  function metaIds() {
    return {
      fbc: cookie("_fbc") || (attribution.fbclid ? "fb.1." + Date.now() + "." + attribution.fbclid : ""),
      fbp: cookie("_fbp"),
    };
  }

  /* ──────────────────────────── TRACKING ─────────────────────────── */

  if (CFG.metaPixelId) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq("init", String(CFG.metaPixelId));
    window.fbq("track", "PageView");
  }
  function pixel(event, custom, eventId, data) {
    if (!window.fbq) return;
    window.fbq(custom ? "trackCustom" : "track", event, data || {}, eventId ? { eventID: eventId } : undefined);
  }

  // Sends a form POST that survives page navigation. Works with Zapier and
  // Make webhooks (no CORS preflight). Never blocks the user.
  function sendToWebhook(fields) {
    if (!CFG.leadWebhookUrl) return;
    var body = new URLSearchParams();
    Object.keys(fields).forEach(function (k) {
      var v = fields[k];
      body.append(k, v == null ? "" : String(v));
    });
    var sent = false;
    try { sent = navigator.sendBeacon && navigator.sendBeacon(CFG.leadWebhookUrl, body); } catch (e) {}
    if (!sent) {
      try { fetch(CFG.leadWebhookUrl, { method: "POST", body: body, mode: "no-cors", keepalive: true }); } catch (e) {}
    }
  }

  /* ──────────────────────────── NAVIGATION ─────────────────────────── */

  function maxReachable() {
    if (!state.reason) return "reason";
    if (!state.noticed.length) return "noticed";
    return "done";
  }
  function clamp(step) {
    return STEPS.indexOf(step) <= STEPS.indexOf(maxReachable()) ? step : maxReachable();
  }
  function urlFor(step) {
    var url = new URL(location.href);
    if (step === "intro") url.searchParams.delete("step");
    else url.searchParams.set("step", step);
    return url.pathname + url.search + url.hash;
  }

  var timers = [];
  function clearTimers() { timers.forEach(clearTimeout); timers.forEach(clearInterval); timers = []; }

  // Each history entry carries its depth so Back never leaves the site.
  // "replace" is used leaving the loading screen so Back from email skips it.
  function go(step, mode) {
    clearTimers();
    var depth = (history.state && history.state.depth) || 0;
    if (mode === "replace") history.replaceState({ step: step, depth: depth }, "", urlFor(step));
    else history.pushState({ step: step, depth: depth + 1 }, "", urlFor(step));
    show(step, true);
    window.scrollTo(0, 0);
  }
  function next() {
    var i = STEPS.indexOf(state.step);
    go(STEPS[Math.min(i + 1, STEPS.length - 1)], state.step === "loading" ? "replace" : "push");
  }
  function back() {
    if (history.state && history.state.depth > 0) history.back();
    else go(STEPS[Math.max(0, STEPS.indexOf(state.step) - 1)], "replace");
  }

  window.addEventListener("popstate", function (e) {
    clearTimers();
    var s = e.state && e.state.step;
    if (STEPS.indexOf(s) === -1) s = new URLSearchParams(location.search).get("step") || "intro";
    show(clamp(STEPS.indexOf(s) === -1 ? "intro" : s), true);
  });

  /* ───────────────────────────── SCREENS ───────────────────────────── */

  var app = $("#app");
  var topbar = $("#topbar");
  var progress = $("#progress");
  var track = $(".track");

  function legalLinks() {
    return '<nav class="legal" aria-label="Legal"><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a></nav>';
  }
  function optionBtn(o, selected, multi) {
    return '<button type="button" class="option' + (multi ? " multi" : "") + '" data-value="' + esc(o.value) +
      '" aria-pressed="' + (selected ? "true" : "false") + '"><span>' + esc(o.label) +
      '</span><span class="mark" aria-hidden="true">' + (selected ? "✓" : "") + "</span></button>";
  }
  function checkRows(rows) {
    return '<ul class="card checks">' + rows.map(function (r) {
      return '<li><span class="tick" aria-hidden="true">✓</span><div><span class="row-title">' + esc(r.t) +
        '</span><span class="row-desc">' + esc(r.d) + "</span></div></li>";
    }).join("") + "</ul>";
  }

  var RENDER = {
    intro: function () {
      return '<img class="hero" src="' + IMG.welcome + '" width="1080" height="591" alt="Watercolor of a woman cuddling her dog on the couch" fetchpriority="high">' +
        '<div class="intro-copy"><span class="eyebrow">Free · 2 minutes</span>' +
        '<h1 class="h1" tabindex="-1">Is your pet having more good days than bad?</h1>' +
        '<p class="lead">Answer a few quick questions and learn what vets look for as pets age or get sick.</p></div>' +
        '<div class="intro-bottom"><button type="button" class="btn" data-action="next">Let’s begin</button>' +
        '<span class="note">Designed with CodaPet veterinarians</span>' + legalLinks() + "</div>";
    },

    reason: function () {
      return '<div class="screen"><div class="stack"><h2 class="h2" tabindex="-1">What brings you here today?</h2>' +
        '<p class="sub">Pick the one that fits best.</p></div>' +
        '<div class="options" data-group="reason">' +
        REASONS.map(function (o) { return optionBtn(o, state.reason === o.value, false); }).join("") + "</div></div>";
    },

    noticed: function () {
      return '<div class="screen"><div class="stack"><h2 class="h2" tabindex="-1">Have you noticed any of these?</h2>' +
        '<p class="sub">Select all that apply.</p></div>' +
        '<div class="options" data-group="noticed" role="group" aria-label="Have you noticed any of these?">' +
        NOTICED.map(function (o) { return optionBtn(o, state.noticed.indexOf(o.value) !== -1, true); }).join("") + "</div>" +
        '<div class="bottom"><button type="button" class="btn" data-action="next" id="noticed-next"' +
        (state.noticed.length ? "" : " disabled") + ">Continue</button></div></div>";
    },

    areas: function () {
      var hits = focusAreas(state.noticed);
      var lesson = LESSONS[state.reason || "changes"];
      return '<div class="screen tight"><div class="stack"><span class="eyebrow">' + esc(lesson.kicker) + "</span>" +
        '<h2 class="h2 sm" tabindex="-1">' + esc(hits.length ? "What you noticed falls under " + hits.length + " of the 7 areas" : "Here’s what vets pay attention to") + "</h2>" +
        '<p class="sub">' + esc(lesson.title) + " Vets look at 7 everyday areas, so no single bad day decides the picture.</p></div>" +
        '<ul class="card areas">' + AREAS.map(function (a) {
          return '<li><div><span class="area-name">' + esc(a.name) + '</span><span class="area-desc">' + esc(a.desc) + "</span></div>" +
            (hits.indexOf(a.name) !== -1 ? '<span class="pill">You noticed</span>' : "") + "</li>";
        }).join("") + "</ul>" +
        '<div class="bottom"><button type="button" class="btn" data-action="next">Continue</button></div></div>';
    },

    loading: function () {
      return '<div class="loading"><img class="loading-art" src="' + IMG.checklist + '" width="640" height="611" alt="">' +
        '<div class="center"><span class="pct" id="pct">0%</span>' +
        '<h2 class="h2" style="font-size:24px;line-height:1.25" tabindex="-1">Putting your summary together</h2></div>' +
        '<div class="bar"><div id="bar"></div></div><ul class="steps">' +
        LOADING_ITEMS.map(function (it) {
          return '<li data-at="' + it.at + '"><span class="dot" aria-hidden="true"></span><span>' + esc(it.t) + "</span></li>";
        }).join("") + "</ul></div>";
    },

    email: function () {
      var hits = focusAreas(state.noticed);
      return '<div class="screen tight"><img class="email-art" src="' + IMG.email + '" width="1000" height="956" alt="">' +
        '<div class="stack"><span class="status">✓ Your summary is ready</span><h2 class="h2" tabindex="-1">Where should we send it?</h2></div>' +
        checkRows([
          { t: "Areas to watch: " + (hits.length ? hits.join(", ") : "All 7 areas"), d: "What each one means and what to look for this week." },
          { t: "Tips from CodaPet vets", d: "Small ways to bring more comfort to your pet’s day." },
          { t: "A reminder in 2 weeks", d: "Checking twice shows which way things are heading." },
        ]) +
        '<form id="email-form" novalidate><div class="field"><label class="sr-only" for="email">Email address</label>' +
        '<input class="input" id="email" type="email" inputmode="email" autocomplete="email" autocapitalize="none" spellcheck="false" placeholder="you@email.com">' +
        '<span class="error" id="email-error" role="alert" hidden></span>' +
        '<input class="hp" id="company" name="company" tabindex="-1" autocomplete="off" aria-hidden="true"></div>' +
        '<div class="bottom"><button type="submit" class="btn">Send it &amp; start the check</button>' +
        (CFG.allowSkip ? '<button type="button" class="link-btn" data-action="skip">Skip for now</button>' : "") +
        '<span class="note">' + esc(CONSENT_TEXT) + "</span>" + legalLinks() + "</div></form></div>";
    },

    done: function () {
      var hits = focusAreas(state.noticed);
      var title = hits.length
        ? "You spotted changes in " + joinAnd(hits) + ". Now find out how much they’re affecting your pet."
        : state.reason === "diagnosis"
          ? "Now find out how the diagnosis is affecting your pet day to day."
          : "Your pet seems okay. Get a score that shows it, while things are good.";
      var href = new URL(QOL_URL);
      href.searchParams.set("utm_source", "qol_funnel");
      href.searchParams.set("utm_medium", "funnel");
      if (attribution.utm && attribution.utm.campaign) href.searchParams.set("utm_campaign", attribution.utm.campaign);

      return '<div class="screen tight"><div class="stack">' +
        '<span class="status">' + (state.email ? "✓ Summary sent. One step left." : "One step left.") + "</span>" +
        '<h2 class="h2 sm" tabindex="-1">' + esc(title) + "</h2>" +
        '<p class="sub" style="color:var(--body);line-height:1.5">This quiz can spot changes. It can’t measure them. The quality of life check scores each of the 7 areas from 0 to 10, so you get a real number instead of a worry.</p></div>' +
        '<div class="card score-card"><div class="score-head"><div><span class="row-title">Your pet’s quality of life score</span>' +
        '<span class="row-desc">' + (hits.length ? hits.length + " of 7 areas flagged" : "No areas flagged") + " · 0 of 7 scored</span></div>" +
        '<span class="score" aria-label="Not scored yet, out of 70"><span class="q">?</span><span class="of"> / 70</span></span></div>' +
        '<ul class="score-areas" aria-label="The 7 areas">' + AREAS.map(function (a) {
          var hit = hits.indexOf(a.name) !== -1;
          return '<li><span class="nm">' + esc(a.name) + '</span><span class="ln" aria-hidden="true"></span>' +
            '<span class="st' + (hit ? " hit" : "") + '">' + (hit ? "Change noticed" : "Not scored") + "</span></li>";
        }).join("") + "</ul></div>" +
        '<div class="stack" style="gap:10px"><span class="eyebrow">What you’ll get</span></div>' + checkRows(CHECK_GIVES) +
        '<div class="why"><span class="eyebrow">Why today</span><p class="a">' + esc(WHY_NOW[state.reason || "changes"]) + "</p>" +
        '<p class="b">Whatever the score, you’ll know exactly what to ask your vet.</p></div>' +
        '<div class="sticky"><a class="btn raised" id="start-check" href="' + esc(href.toString()) + '">Get my pet’s score</a>' +
        '<span class="meta-line">About 5 minutes · Free · Vet-designed</span></div></div>';
    },
  };

  var firstRender = true;
  function show(step, fromNav) {
    state.step = step;
    persist();
    app.innerHTML = RENDER[step]();
    var showBar = step !== "intro" && step !== "loading";
    topbar.hidden = !showBar;
    var pct = Math.round((STEPS.indexOf(step) / (STEPS.length - 1)) * 100);
    progress.style.width = pct + "%";
    track.setAttribute("aria-valuenow", String(pct));

    if (!firstRender && fromNav) {
      var h = $("h1, h2", app);
      if (h) h.focus({ preventScroll: true });
    }
    firstRender = false;

    if (step === "intro") viewContentOnce();
    if (step === "loading") runLoading();
    if (step === "email") {
      var input = $("#email");
      input.value = state.email;
      input.addEventListener("input", function () {
        state.email = input.value;
        persist();
        if (!$("#email-error").hidden) setEmailError("");
      });
      $("#email-form").addEventListener("submit", function (e) { e.preventDefault(); submitEmail(); });
    }
    if (step === "done") $("#start-check").addEventListener("click", startCheck);
  }

  function runLoading() {
    var p = 0;
    var bar = $("#bar"), pctEl = $("#pct"), items = $all(".steps li");
    var iv = setInterval(function () {
      p = Math.min(100, p + 6);
      bar.style.width = p + "%";
      pctEl.textContent = p + "%";
      items.forEach(function (li) {
        var done = p >= Number(li.getAttribute("data-at"));
        li.classList.toggle("done", done);
        li.querySelector(".dot").textContent = done ? "✓" : "";
      });
      if (p >= 100) {
        clearInterval(iv);
        timers.push(setTimeout(function () { go("email", "replace"); }, 500));
      }
    }, 90);
    timers.push(iv);
  }

  function viewContentOnce() {
    if (storageGet(sessionStorage, "qol-vc")) return;
    storageSet(sessionStorage, "qol-vc", 1);
    pixel("ViewContent", false, uuid(), { content_name: "QOL quiz" });
  }

  function setEmailError(msg) {
    var err = $("#email-error"), input = $("#email");
    err.textContent = msg;
    err.hidden = !msg;
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    if (msg) input.setAttribute("aria-describedby", "email-error");
    else input.removeAttribute("aria-describedby");
  }

  function submitEmail() {
    var raw = $("#email").value;
    if (!isValidEmail(raw)) {
      setEmailError("Please enter a valid email");
      $("#email").focus();
      return;
    }
    var email = raw.trim().toLowerCase();
    state.email = email;
    state.leadId = state.leadId || uuid();
    var hits = focusAreas(state.noticed);
    var ids = metaIds();
    var eventId = uuid();
    pixel("Lead", false, eventId, { content_name: "QOL quiz" });

    // Honeypot: bots fill the hidden field; people never see it.
    if (!$("#company").value) {
      var utm = attribution.utm || {};
      sendToWebhook({
        event: "lead",
        lead_id: state.leadId,
        email: email,
        reason: state.reason,
        noticed: state.noticed.join(","),
        focus_areas: hits.length ? hits.join(", ") : "All 7 areas",
        area_tips: areaTipsText(hits),
        utm_source: utm.source, utm_medium: utm.medium, utm_campaign: utm.campaign,
        utm_content: utm.content, utm_term: utm.term,
        fbclid: attribution.fbclid, fbc: ids.fbc, fbp: ids.fbp,
        landing_url: attribution.landingUrl,
        event_id: eventId,
        consent_text: CONSENT_TEXT,
        user_agent: navigator.userAgent,
        submitted_at: new Date().toISOString(),
      });
    }
    go("done");
  }

  function startCheck() {
    var eventId = uuid();
    pixel("StartQOLCheck", true, eventId);
    if (state.leadId) {
      sendToWebhook({ event: "started_check", lead_id: state.leadId, email: state.email, event_id: eventId, started_at: new Date().toISOString() });
    }
  }

  /* ───────────────────────────── EVENTS ───────────────────────────── */

  $("#back").addEventListener("click", back);

  var advanceTimer = null;
  app.addEventListener("click", function (e) {
    var btn = e.target.closest("button, a");
    if (!btn || !app.contains(btn)) return;
    var action = btn.getAttribute("data-action");
    if (action === "next") return next();
    if (action === "skip") return go("done");

    var group = btn.parentElement && btn.parentElement.getAttribute("data-group");
    var value = btn.getAttribute("data-value");
    if (group === "reason") {
      state.reason = value;
      persist();
      $all(".option", btn.parentElement).forEach(function (b) {
        var on = b === btn;
        b.setAttribute("aria-pressed", on ? "true" : "false");
        b.querySelector(".mark").textContent = on ? "✓" : "";
      });
      clearTimeout(advanceTimer);
      advanceTimer = setTimeout(next, 280);
    } else if (group === "noticed") {
      var cur = state.noticed;
      if (cur.indexOf(value) !== -1) cur = cur.filter(function (v) { return v !== value; });
      else if (value === "ok") cur = ["ok"];
      else cur = cur.filter(function (v) { return v !== "ok"; }).concat([value]);
      state.noticed = cur;
      persist();
      $all(".option", btn.parentElement).forEach(function (b) {
        var on = cur.indexOf(b.getAttribute("data-value")) !== -1;
        b.setAttribute("aria-pressed", on ? "true" : "false");
        b.querySelector(".mark").textContent = on ? "✓" : "";
      });
      $("#noticed-next").disabled = !cur.length;
    }
  });

  /* ───────────────────────────── START ───────────────────────────── */

  var fromUrl = new URLSearchParams(location.search).get("step");
  var start = clamp(STEPS.indexOf(fromUrl) !== -1 ? fromUrl : state.step);
  history.replaceState({ step: start, depth: 0 }, "", urlFor(start));
  show(start, false);
  [IMG.email, IMG.checklist].forEach(function (src) { var i = new Image(); i.src = src; });
})();
