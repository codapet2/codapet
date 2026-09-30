import { describe, expect, it } from "vitest";
import { isValidEmail, parseLead } from "./lead";

describe("isValidEmail", () => {
  it.each(["a@b.co", " Jane.Doe+pets@Example.COM ", "x@sub.domain.org"])("accepts %s", (e) =>
    expect(isValidEmail(e)).toBe(true),
  );
  it.each(["", "plain", "a@b", "a@@b.com", "a b@c.com", "a@b..com", "a..b@c.com"])("rejects %s", (e) =>
    expect(isValidEmail(e)).toBe(false),
  );
});

describe("parseLead", () => {
  it("normalizes and whitelists fields", () => {
    const r = parseLead({
      email: "  Pet@Owner.COM ",
      reason: "older",
      duration: "bogus",
      noticed: ["eat", "eat", "hack", "night"],
      feeling: "calm",
      utm: { source: "facebook", content: "ad-7", evil: "x" },
      fbclid: "abc",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.lead.email).toBe("pet@owner.com");
    expect(r.lead.duration).toBeNull();
    expect(r.lead.noticed).toEqual(["eat", "night"]);
    expect(r.lead.focusAreas).toEqual(["Hunger", "Hurt"]);
    expect(r.lead.utm).toEqual({ source: "facebook", content: "ad-7" });
  });
  it("rejects a bad email", () => {
    expect(parseLead({ email: "nope" })).toEqual({ ok: false, error: "Please enter a valid email" });
    expect(parseLead(null).ok).toBe(false);
  });
});
