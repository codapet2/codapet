import { afterEach, describe, expect, it, vi } from "vitest";
import { customFields, sequenceFor, syncToReply } from "./reply";

const lead = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "a@b.co",
  reason: "diagnosis",
  duration: "months",
  focusAreas: ["Mobility", "Happiness"],
  feeling: "worried",
  utmContent: "ad-3",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("reply", () => {
  it("builds custom fields", () => {
    const { qol_area_tips, ...rest } = customFields(lead);
    expect(qol_area_tips).toMatch(/^Mobility\nWhat to watch:/);
    expect(qol_area_tips).toContain("\n\nHappiness\n");
    expect(rest).toEqual({
      qol_reason: "diagnosis",
      qol_duration: "months",
      qol_duration_text: "longer-term changes",
      qol_focus_areas: "Mobility, Happiness",
      qol_feeling: "worried",
      utm_content: "ad-3",
      lead_id: lead.id,
    });
  });
  it("routes sequences by reason with a fallback", () => {
    vi.stubEnv("REPLY_SEQUENCE_ID", "default");
    vi.stubEnv("REPLY_SEQUENCE_ID_BY_REASON", '{"diagnosis":"dx"}');
    expect(sequenceFor("diagnosis")).toBe("dx");
    expect(sequenceFor("older")).toBe("default");
  });
  it("records a sequence refusal as an error without throwing", async () => {
    vi.stubEnv("REPLY_API_KEY", "k");
    vi.stubEnv("REPLY_SEQUENCE_ID", "9");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 42 }), { status: 201 }))
      .mockResolvedValueOnce(new Response("already in a sequence", { status: 409 }));
    vi.stubGlobal("fetch", fetchMock);
    const r = await syncToReply(lead);
    expect(r.contactId).toBe("42");
    expect(r.error).toMatch(/sequence add 409/);
    expect(fetchMock.mock.calls[1][0]).toBe("https://api.reply.io/v3/sequences/9/contacts");
  });
  it("skips cleanly without an API key", async () => {
    expect((await syncToReply(lead)).error).toBe("REPLY_API_KEY not set");
  });
});
