import { describe, expect, it } from "vitest";
import { history, summarizeHistory, validateHistory, type ReviewedHistory } from "./history";
import { summarizeObservations } from "./observatory";

const fixture = (): ReviewedHistory => ({
  schemaVersion: 1,
  reviewedAt: "2026-10-25T10:00:00Z",
  reportingTimezone: "America/Los_Angeles",
  scope: "Selected public blog work",
  items: [{
    id: "one-work-item",
    title: "A single goal with two revisions",
    category: "code",
    deliveredAt: "2026-10-25T06:30:00Z",
    status: "merged",
    outcome: "A public code change exists.",
    adjustment: "The second revision belongs to the same goal.",
    evidence: [
      { label: "Initial change", url: "https://github.com/Yuki-zik/myblog/pull/48" },
      { label: "Revision", url: "https://github.com/Yuki-zik/myblog/pull/52" }
    ]
  }]
});

describe("reviewed delivery history", () => {
  it("counts work items rather than their PRs and keeps review dates in the declared timezone", () => {
    const sample = fixture();
    expect(validateHistory(sample)).toEqual([]);
    expect(summarizeHistory(sample)).toEqual({
      count: 1, from: "2026-10-24", through: "2026-10-24", reviewedDate: "2026-10-25"
    });
    expect(summarizeHistory({ ...sample, items: [] })).toEqual({
      count: 0, from: null, through: null, reviewedDate: "2026-10-25"
    });
  });

  it("rejects duplicate work-item IDs, missing evidence and unsafe public links", () => {
    const duplicate = fixture();
    duplicate.items.push({ ...duplicate.items[0] });
    expect(validateHistory(duplicate).join(" ")).toContain("duplicate");
    const missing = fixture();
    missing.items[0].evidence = [];
    expect(validateHistory(missing).join(" ")).toContain("evidence");
    for (const url of ["javascript:alert(1)", "file:///private/log.jsonl", "https://user:secret@example.com/path"]) {
      const unsafe = fixture();
      unsafe.items[0].evidence[0].url = url;
      expect(validateHistory(unsafe).join(" ")).toContain("url");
    }
  });

  it("rejects invalid or future event timestamps and invalid reporting timezones", () => {
    for (const deliveredAt of ["2026-02-30T10:00:00Z", "tomorrow", "2026-10-26T10:00:00Z"]) {
      const invalid = fixture();
      invalid.items[0].deliveredAt = deliveredAt;
      expect(validateHistory(invalid).length).toBeGreaterThan(0);
    }
    expect(validateHistory({ ...fixture(), reportingTimezone: "Unknown/Place" }).join(" ")).toContain("Timezone");
  });

  it("validates the published snapshot without turning historical merges into measurements or acceptance", () => {
    expect(validateHistory(history)).toEqual([]);
    expect(history.items.length).toBeGreaterThan(0);
    expect(history.items.every(item => item.status === "merged" || item.status === "published")).toBe(true);
    expect(summarizeObservations({ schemaVersion: 1, days: [], tasks: [] })).toMatchObject({
      observedDays: 0, acceptedTasks: null, peakParallel: null, humanHours: null, reworkHours: null
    });
  });
});
