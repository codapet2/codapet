import { describe, expect, it } from "vitest";
import {
  EMPTY_ANSWERS,
  areasTitle,
  clampStep,
  doneTitle,
  durationText,
  focusAreas,
  joinAnd,
  lessonFor,
  progressPct,
  summaryRows,
  toggleNoticed,
} from "./funnel";

describe("toggleNoticed", () => {
  it("adds and removes options", () => {
    expect(toggleNoticed([], "eat")).toEqual(["eat"]);
    expect(toggleNoticed(["eat", "move"], "eat")).toEqual(["move"]);
  });
  it("makes 'ok' exclusive both ways", () => {
    expect(toggleNoticed(["eat", "move"], "ok")).toEqual(["ok"]);
    expect(toggleNoticed(["ok"], "play")).toEqual(["play"]);
  });
});

describe("focusAreas", () => {
  it("maps picks to areas in option order and ignores 'ok'", () => {
    expect(focusAreas(["night", "play"])).toEqual(["Happiness", "Hurt"]);
    expect(focusAreas(["ok"])).toEqual([]);
  });
});

describe("copy", () => {
  it("builds the done title with an Oxford-free 'and'", () => {
    expect(joinAnd(["A"])).toBe("A");
    expect(joinAnd(["A", "B", "C"])).toBe("A, B and C");
    expect(doneTitle(["Mobility"])).toBe("You noticed changes in Mobility. The check shows how much they matter.");
    expect(doneTitle([])).toBe("Now see where your pet really stands.");
  });
  it("areas title and summary fall back when nothing was noticed", () => {
    expect(areasTitle(["Hunger", "Hurt"])).toBe("What you noticed falls under 2 of the 7 areas");
    expect(areasTitle([])).toBe("Here’s what vets pay attention to");
    expect(summaryRows([])[0].t).toBe("Areas to watch: All 7 areas");
    expect(summaryRows(["Hunger", "Hurt"])[0].t).toBe("Areas to watch: Hunger, Hurt");
  });
  it("picks lessons by answer", () => {
    expect(lessonFor("info1", { ...EMPTY_ANSWERS, reason: "older" }).kicker).toBe("About aging");
    expect(lessonFor("info2", { ...EMPTY_ANSWERS, feeling: "calm" }).title).toBe("A great place to start from.");
    expect(lessonFor("info2", EMPTY_ANSWERS).kicker).toBe("From our vets");
  });
  it("duration text", () => {
    expect(durationText("weeks")).toBe("the past few weeks");
    expect(durationText(null)).toBe("what you’ve noticed");
  });
});

describe("steps", () => {
  it("progress runs 0..100 over 11 steps", () => {
    expect(progressPct("intro")).toBe(0);
    expect(progressPct("reason")).toBe(10);
    expect(progressPct("done")).toBe(100);
  });
  it("won't skip past missing answers", () => {
    expect(clampStep("email", EMPTY_ANSWERS)).toBe("reason");
    expect(clampStep("info1", { ...EMPTY_ANSWERS, reason: "changes" })).toBe("info1");
    expect(clampStep("areas", { ...EMPTY_ANSWERS, reason: "changes", duration: "weeks" })).toBe("noticed");
    const full = { reason: "changes", duration: "weeks", noticed: ["eat"], feeling: "calm" } as const;
    expect(clampStep("done", { ...full, noticed: ["eat"] })).toBe("done");
    expect(clampStep("intro", EMPTY_ANSWERS)).toBe("intro");
  });
});
