import {
  evidenceRecords,
  publicObservations,
  summarizeObservations,
  type EvidenceRecord,
  type ObservatoryData
} from "./observatory";
import {
  history,
  historyDate,
  summarizeHistory,
  type ReviewedHistory
} from "./history";

export interface AgentObservatoryDatasetPackage {
  schemaVersion: 1;
  canonicalUrl: string;
  reviewedAt: string;
  reportingTimezone: string;
  methodologyNote: string;
  personalObservations: {
    summary: ReturnType<typeof summarizeObservations>;
    days: ObservatoryData["days"];
    tasks: ObservatoryData["tasks"];
  };
  reviewedDeliveries: {
    summary: ReturnType<typeof summarizeHistory>;
    scope: string;
    items: ReviewedHistory["items"];
  };
  empiricalStudies: EvidenceRecord[];
}

export function buildAgentObservatoryDataset(
  siteUrl: string = "https://a-znk.com",
  obsData: ObservatoryData = publicObservations,
  histData: ReviewedHistory = history,
  studies: EvidenceRecord[] = evidenceRecords
): AgentObservatoryDatasetPackage {
  return {
    schemaVersion: 1,
    canonicalUrl: new URL("/agents", siteUrl).toString(),
    reviewedAt: histData.reviewedAt,
    reportingTimezone: histData.reportingTimezone,
    methodologyNote:
      "Unmeasured fields remain null (never coerced to 0). Personal observations, partial reviewed public repository deliveries, and external empirical studies measure distinct scopes and must not be combined into a single productivity multiplier.",
    personalObservations: {
      summary: summarizeObservations(obsData),
      days: obsData.days,
      tasks: obsData.tasks
    },
    reviewedDeliveries: {
      summary: summarizeHistory(histData),
      scope: histData.scope,
      items: histData.items
    },
    empiricalStudies: studies
  };
}

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const raw = String(value);
  if (/[",\r\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function serializeAgentObservatoryCsv(
  dataset: AgentObservatoryDatasetPackage = buildAgentObservatoryDataset()
): string {
  const columns = [
    "record_type",
    "id",
    "date",
    "category_or_kind",
    "status",
    "title",
    "peak_parallel_tasks",
    "human_minutes",
    "rework_minutes",
    "task_log_complete",
    "summary_or_finding",
    "scope_or_limit",
    "evidence_url"
  ] as const;

  const rows: Array<Array<string | number | boolean | null>> = [
    [...columns]
  ];

  for (const day of dataset.personalObservations.days) {
    rows.push([
      "personal_day",
      `day:${day.date}`,
      day.date,
      "daily_observation",
      day.taskLogComplete ? "complete" : "partial",
      day.date,
      day.peakParallelTasks,
      day.humanMinutes,
      day.reworkMinutes,
      day.taskLogComplete,
      day.note,
      null,
      null
    ]);
  }

  for (const task of dataset.personalObservations.tasks) {
    rows.push([
      "personal_task",
      task.id,
      task.date,
      task.category,
      task.status,
      task.title,
      null,
      null,
      null,
      null,
      task.acceptanceCriterion,
      task.note,
      task.evidenceUrl
    ]);
  }

  for (const item of dataset.reviewedDeliveries.items) {
    rows.push([
      "reviewed_delivery",
      item.id,
      historyDate(item.deliveredAt, dataset.reportingTimezone),
      item.category,
      item.status,
      item.title,
      null,
      null,
      null,
      null,
      item.outcome,
      item.adjustment,
      item.evidence.map((source) => source.url).join(" | ")
    ]);
  }

  for (const study of dataset.empiricalStudies) {
    rows.push([
      "empirical_study",
      study.id,
      study.date,
      study.kind,
      "published",
      study.title,
      null,
      null,
      null,
      null,
      study.finding,
      study.limit,
      study.url
    ]);
  }

  return `${rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n")}\n`;
}
