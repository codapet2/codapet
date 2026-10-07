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
  reassurance,
  toggleNoticed,
  whyNow,
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
    const none = { reason: null, noticed: [] };
    expect(doneTitle(["Mobility", "Hurt"], none)).toBe(
      "You spotted changes in Mobility and Hurt. Now find out how much they’re affecting your pet.",
    );
    expect(doneTitle([], none)).toMatch(/^Your pet seems okay/);
    expect(doneTitle([], { reason: "diagnosis", noticed: ["ok"] })).toMatch(/diagnosis/);
  });
  it("areas title and summary fall back when nothing was noticed", () => {
    expect(areasTitle(["Hunger", "Hurt"])).toBe("What you noticed falls under 2 of the 7 areas");
    expect(areasTitle([])).toBe("Here’s what vets pay attention to");
    expect(summaryRows([])[0].t).toBe("Areas to watch: All 7 areas");
    expect(summaryRows(["Hunger", "Hurt"])[0].t).toBe("Areas to watch: Hunger, Hurt");
  });
  it("picks lessons by answer", () => {
    expect(lessonFor({ reason: "older" }).kicker).toBe("About aging");
    expect(lessonFor({ reason: null }).kicker).toBe("Trust that feeling");
  });
  it("personalizes why-now and reassurance", () => {
    expect(whyNow({ reason: "changes", duration: "months" })).toMatch(/for months/);
    expect(whyNow({ reason: "changes", duration: "recent" })).toMatch(/caught early/);
    expect(whyNow({ reason: "older", duration: null })).toMatch(/Aging/);
    expect(reassurance("overwhelmed")).toMatch(/stop whenever/);
    expect(reassurance(null)).toMatch(/two weeks/);
  });
  it("duration text", () => {
    expect(durationText("weeks")).toBe("the past few weeks");
    expect(durationText(null)).toBe("what you’ve noticed");
  });
});

describe("steps", () => {
  it("progress runs 0..100 over 7 steps", () => {
    expect(progressPct("intro")).toBe(0);
    expect(progressPct("noticed")).toBe(33);
    expect(progressPct("done")).toBe(100);
  });
  it("won't skip past missing answers", () => {
    expect(clampStep("email", EMPTY_ANSWERS)).toBe("reason");
    expect(clampStep("noticed", { ...EMPTY_ANSWERS, reason: "changes" })).toBe("noticed");
    expect(clampStep("areas", { ...EMPTY_ANSWERS, reason: "changes" })).toBe("noticed");
    expect(clampStep("done", { ...EMPTY_ANSWERS, reason: "changes", noticed: ["eat"] })).toBe("done");
    expect(clampStep("intro", EMPTY_ANSWERS)).toBe("intro");
  });
});
