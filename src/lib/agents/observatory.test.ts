import { describe, expect, it } from "vitest";
import {
  publicObservations,
  summarizeObservations,
  validateObservations,
  type ObservationDay,
  type ObservationTask,
  type ObservatoryData
} from "./observatory";

const day = (date: string, values: Partial<ObservationDay> = {}): ObservationDay => ({
  date,
  peakParallelTasks: null,
  humanMinutes: null,
  reworkMinutes: null,
  taskLogComplete: false,
  note: "",
  ...values
});

const task = (id: string, date: string): ObservationTask => ({
  id,
  date,
  title: "Test fixture",
  category: "code",
  status: "accepted",
  acceptanceCriterion: "Fixture meets its predefined acceptance check",
  evidenceUrl: "/test-evidence",
  note: ""
});

const data = (days: ObservationDay[], tasks: ObservationTask[] = []): ObservatoryData => ({
  schemaVersion: 1,
  days,
  tasks
});

describe("Agent observatory measurements", () => {
  it("validates published observations and distinguishes missing data from measured zero", () => {
    expect(validateObservations(publicObservations)).toEqual([]);
    expect(summarizeObservations(data([]))).toMatchObject({
      windowStart: null,
      windowEnd: null,
      observedDays: 0,
      peakParallel: null,
      acceptedTasks: null,
      humanHours: null,
      reworkHours: null
    });
    const zero = summarizeObservations(data([day("2024-01-01", {
      peakParallelTasks: 0,
      humanMinutes: 0,
      reworkMinutes: 0,
      taskLogComplete: true
    })]));
    expect(zero).toMatchObject({ peakParallel: 0, acceptedTasks: 0, humanHours: 0, reworkHours: 0 });
    expect(zero.coverage.human).toBe("partial");
  });

  it("anchors a seven-calendar-day window to recorded dates across a leap day and counts distinct accepted IDs", () => {
    const value = summarizeObservations(data([
      day("2024-02-24", { humanMinutes: 900, taskLogComplete: true }),
      day("2024-02-25", { humanMinutes: 60, reworkMinutes: 15, peakParallelTasks: 2, taskLogComplete: true }),
      day("2024-03-02", { humanMinutes: 120, reworkMinutes: 30, peakParallelTasks: 4, taskLogComplete: true })
    ], [task("outside", "2024-02-24"), task("a", "2024-02-25"), task("a", "2024-02-25"), task("b", "2024-03-02")]));
    expect(value).toMatchObject({
      windowStart: "2024-02-25",
      windowEnd: "2024-03-02",
      observedDays: 2,
      peakParallel: 4,
      acceptedTasks: 2,
      humanHours: 3,
      reworkHours: 0.75
    });
    expect(value.coverage.human).toBe("partial");
  });

  it("does not silently sum around missing measurements or imply a complete task log", () => {
    const value = summarizeObservations(data([
      day("2024-04-01", { peakParallelTasks: 2, humanMinutes: 60, reworkMinutes: 10, taskLogComplete: true }),
      day("2024-04-02")
    ], [task("a", "2024-04-01")]));
    expect(value.humanHours).toBeNull();
    expect(value.reworkHours).toBeNull();
    expect(value.acceptedTasks).toBeNull();
    expect(value.peakParallel).toBeNull();
    expect(value.coverage).toEqual({ peak: "partial", human: "partial", rework: "partial", accepted: "partial" });
  });

  it("marks coverage complete only when all seven calendar days are explicitly recorded", () => {
    const days = Array.from({ length: 7 }, (_, i) => day(`2024-05-0${i + 1}`, {
      peakParallelTasks: i === 5 ? 3 : 1,
      humanMinutes: 60,
      reworkMinutes: 0,
      taskLogComplete: true
    }));
    expect(summarizeObservations(data(days))).toMatchObject({
      observedDays: 7,
      humanHours: 7,
      acceptedTasks: 0,
      coverage: { peak: "complete", human: "complete", rework: "complete", accepted: "complete" }
    });
  });

  it("rejects invalid dates, duplicate canonical task IDs, and rework that cannot be a subset of human time", () => {
    const errors = validateObservations(data([
      day("2024-02-30"),
      day("2024-03-01", { humanMinutes: 20, reworkMinutes: 30 }),
      day("2024-03-02", { reworkMinutes: 5 })
    ], [task("a", "2024-03-01"), task("a", "2024-03-01")]));
    expect(errors.some((error) => error.includes("valid calendar date"))).toBe(true);
    expect(errors.some((error) => error.includes("duplicate task id"))).toBe(true);
    expect(errors.some((error) => error.includes("exceeds humanMinutes"))).toBe(true);
    expect(errors.some((error) => error.includes("requires humanMinutes"))).toBe(true);
  });

  it("requires acceptance evidence, rejects disguised external paths, and bounds one person's daily time", () => {
    const recorded = [day("2024-06-01", { humanMinutes: 1440 })];
    expect(validateObservations(data(recorded, [task("a", "2024-06-01")]))).toEqual([]);
    const errors = validateObservations(data([day("2024-06-01", { humanMinutes: 1441 })], [{
      ...task("a", "2024-06-01"), acceptanceCriterion: " ", evidenceUrl: null
    }]));
    expect(errors.some((error) => error.includes("1440"))).toBe(true);
    expect(errors.some((error) => error.includes("acceptanceCriterion"))).toBe(true);
    expect(errors.some((error) => error.includes("evidenceUrl is required"))).toBe(true);
    for (const evidenceUrl of ["//example.com", "/\\example.com", "/\n/example.com", "/%5cexample.com", "/%2fexample.com", "/%09/example.com"]) {
      const invalid = { ...task("a", "2024-06-01"), evidenceUrl };
      expect(validateObservations(data(recorded, [invalid])).some((error) => error.includes("evidenceUrl"))).toBe(true);
    }
    for (const evidenceUrl of ["/posts/example#result", "https://example.com/evidence", "https://example.com/%E6%B5%8B%E8%AF%95"]) {
      expect(validateObservations(data(recorded, [{ ...task("a", "2024-06-01"), evidenceUrl }]))).toEqual([]);
    }
  });
});
