import rawHistory from "../../data/agent-history.json";

export interface HistoryEvidence { label: string; url: string; }
export interface HistoryWorkItem {
  /** One delivery goal; revisions, retries and subagents share this ID. */
  id: string;
  title: string;
  category: string;
  /** Timestamp of the latest included public delivery, not human working time. */
  deliveredAt: string;
  status: "merged" | "published";
  outcome: string;
  adjustment: string;
  evidence: HistoryEvidence[];
}
export interface ReviewedHistory {
  schemaVersion: 1;
  reviewedAt: string;
  reportingTimezone: string;
  scope: string;
  items: HistoryWorkItem[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const hasText = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const isTimestamp = (value: unknown): value is string => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value.replace(/(?<!\.\d{3})Z$/, ".000Z");
};
const isPublicLink = (value: unknown): boolean => {
  if (typeof value !== "string" || value !== value.trim() || /[\\\u0000-\u0020\u007f]/u.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      && url.origin === "https://github.com"
      && /^\/Yuki-zik\/myblog\/(?:pull\/\d+|blob\/[a-f0-9]{40}\/.+)$/.test(url.pathname)
      && !url.search && !url.hash;
  } catch { return false; }
};

/** Only a reviewed public summary belongs here; raw conversation logs stay local. */
export function validateHistory(input: unknown): string[] {
  if (!isRecord(input)) return ["history must be an object"];
  const errors: string[] = [];
  if (input.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (!isTimestamp(input.reviewedAt)) errors.push("reviewedAt must be an exact UTC timestamp");
  try {
    if (!hasText(input.reportingTimezone)) throw new Error("missing");
    new Intl.DateTimeFormat("en-CA", { timeZone: input.reportingTimezone });
  } catch { errors.push("reportingTimezone must be an IANA timezone"); }
  if (!hasText(input.scope)) errors.push("scope must describe the partial review");
  if (!Array.isArray(input.items)) return [...errors, "items must be an array"];
  const ids = new Set<string>();
  input.items.forEach((item, index) => {
    const prefix = "items[" + index + "]";
    if (!isRecord(item)) { errors.push(prefix + " must be an object"); return; }
    for (const key of ["id", "title", "category", "outcome", "adjustment"]) {
      if (!hasText(item[key])) errors.push(prefix + "." + key + " must be non-empty");
    }
    if (typeof item.id === "string") {
      if (ids.has(item.id)) errors.push(prefix + ": duplicate work-item ID");
      ids.add(item.id);
    }
    if (!isTimestamp(item.deliveredAt)) errors.push(prefix + ".deliveredAt must be an exact UTC timestamp");
    else if (isTimestamp(input.reviewedAt) && Date.parse(item.deliveredAt) > Date.parse(input.reviewedAt)) {
      errors.push(prefix + ".deliveredAt is later than the review");
    }
    if (!["merged", "published"].includes(String(item.status))) errors.push(prefix + ".status must describe a public delivery");
    if (!Array.isArray(item.evidence) || item.evidence.length === 0) errors.push(prefix + ".evidence is required");
    else for (const source of item.evidence) {
      if (!isRecord(source) || !hasText(source.label)) errors.push(prefix + ".evidence label is required");
      if (!isRecord(source) || !isPublicLink(source.url)) errors.push(prefix + ".evidence url must be a public repository record");
    }
  });
  return errors;
}

const errors = validateHistory(rawHistory);
if (errors.length) throw new Error("Invalid reviewed Agent history: " + errors.join("; "));
export const history = rawHistory as ReviewedHistory;

export function historyDate(timestamp: string, timeZone: string = history.reportingTimezone): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(timestamp));
}

/** Coverage of selected historical work, independent of the seven-day measurement window. */
export function summarizeHistory(data: ReviewedHistory = history) {
  const dates = data.items.map(item => historyDate(item.deliveredAt, data.reportingTimezone)).sort();
  return {
    count: new Set(data.items.map(item => item.id)).size,
    from: dates[0] ?? null,
    through: dates.at(-1) ?? null,
    reviewedDate: historyDate(data.reviewedAt, data.reportingTimezone)
  };
}
export const historySummary = summarizeHistory();
