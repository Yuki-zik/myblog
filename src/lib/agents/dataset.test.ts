import { describe, expect, it } from "vitest";
import { buildAgentObservatoryDataset, serializeAgentObservatoryCsv } from "./dataset";
import type { ObservatoryData } from "./observatory";

describe("Agent Work Observatory dataset exports", () => {
  it("preserves null for missing personal measurements and never fabricates zero totals", () => {
    const emptyObs: ObservatoryData = { schemaVersion: 1, days: [], tasks: [] };
    const pkg = buildAgentObservatoryDataset("https://a-znk.com", emptyObs);

    expect(pkg.schemaVersion).toBe(1);
    expect(pkg.canonicalUrl).toBe("https://a-znk.com/agents");
    expect(pkg.personalObservations.summary.peakParallel).toBeNull();
    expect(pkg.personalObservations.summary.humanHours).toBeNull();
    expect(pkg.personalObservations.summary.reworkHours).toBeNull();
    expect(pkg.reviewedDeliveries.items.length).toBeGreaterThan(0);
    expect(pkg.empiricalStudies.length).toBeGreaterThanOrEqual(6);
  });

  it("serializes RFC 4180 CSV with empty cells for null numeric measurements instead of 0", () => {
    const partialObs: ObservatoryData = {
      schemaVersion: 1,
      days: [
        {
          date: "2026-10-24",
          peakParallelTasks: 2,
          humanMinutes: null,
          reworkMinutes: null,
          taskLogComplete: false,
          note: "Initial setup, comma test"
        }
      ],
      tasks: []
    };
    const pkg = buildAgentObservatoryDataset("https://a-znk.com", partialObs);
    const csv = serializeAgentObservatoryCsv(pkg);
    const lines = csv.trim().split("\n");

    expect(lines[0]).toContain("record_type,id,date,category_or_kind,status,title,peak_parallel_tasks,human_minutes,rework_minutes");
    // peak_parallel_tasks=2, human_minutes="", rework_minutes="", task_log_complete=false
    expect(lines[1]).toBe(
      'personal_day,day:2026-10-24,2026-10-24,daily_observation,partial,2026-10-24,2,,,false,"Initial setup, comma test",,'
    );
    expect(csv).toContain("reviewed_delivery,");
    expect(csv).toContain("empirical_study,metr-task-horizons-2025,");
  });
});
