import rawObservations from "../../data/agent-observatory.json";

export type Coverage = "none" | "partial" | "complete";
export type TaskCategory = "code" | "research" | "writing" | "operations" | "other";
export type TaskStatus = "active" | "accepted" | "rejected" | "abandoned";

export interface ObservationDay {
  /** Calendar date in the author's reporting timezone, YYYY-MM-DD. */
  date: string;
  peakParallelTasks: number | null;
  /** All human attention, including planning, review and failed attempts. */
  humanMinutes: number | null;
  /** A subset of humanMinutes, never additional time. */
  reworkMinutes: number | null;
  /** Explicit confirmation that all task outcomes for this day are recorded. */
  taskLogComplete: boolean;
  note: string;
}

export interface ObservationTask {
  /** Stable work-item ID; retries and subagents reuse the same record. */
  id: string;
  /** Date of acceptance or the latest recorded outcome/status. */
  date: string;
  title: string;
  category: TaskCategory;
  status: TaskStatus;
  acceptanceCriterion: string;
  evidenceUrl: string | null;
  note: string;
}

export interface ObservatoryData {
  schemaVersion: 1;
  days: ObservationDay[];
  tasks: ObservationTask[];
}

export interface ObservationSummary {
  windowStart: string | null;
  windowEnd: string | null;
  observedDays: number;
  peakParallel: number | null;
  acceptedTasks: number | null;
  humanHours: number | null;
  reworkHours: number | null;
  coverage: { peak: Coverage; human: Coverage; rework: Coverage; accepted: Coverage };
}

export interface EvidenceRecord {
  id: string;
  /** Source publication date; month precision is retained when the day is unknown. */
  date: string;
  kind: string;
  title: string;
  finding: string;
  limit: string;
  url: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isCalendarDate = (value: unknown): value is string => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
};

const isMeasurement = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value) && value >= 0);

const isEvidenceUrl = (value: unknown): boolean => {
  if (value === null) return true;
  if (typeof value !== "string" || value !== value.trim() || /[\\\u0000-\u0020\u007f]/u.test(value)) return false;
  try {
    const decoded = decodeURIComponent(value);
    if (/[\\\u0000-\u001f\u007f]/u.test(decoded)) return false;
    if (value.startsWith("/")) {
      if (value.startsWith("//") || decoded.startsWith("//")) return false;
      return new URL(value, "https://a-znk.com").origin === "https://a-znk.com";
    }
    return /^https?:\/\//i.test(value) && ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

/** Validate published input without filling unknown values or manufacturing records. */
export function validateObservations(input: unknown): string[] {
  if (!isRecord(input)) return ["observations must be an object"];
  const errors: string[] = [];
  if (input.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (!Array.isArray(input.days) || !Array.isArray(input.tasks)) {
    return [...errors, "days and tasks must be arrays"];
  }
  const dates = new Set<string>();
  for (const [index, item] of input.days.entries()) {
    const prefix = `days[${index}]`;
    if (!isRecord(item)) { errors.push(`${prefix} must be an object`); continue; }
    if (!isCalendarDate(item.date)) errors.push(`${prefix}.date must be a valid calendar date`);
    else {
      if (dates.has(item.date)) errors.push(`${prefix}: duplicate day ${item.date}`);
      dates.add(item.date);
    }
    for (const key of ["peakParallelTasks", "humanMinutes", "reworkMinutes"] as const) {
      if (!isMeasurement(item[key])) errors.push(`${prefix}.${key} must be a non-negative finite number or null`);
    }
    if (typeof item.peakParallelTasks === "number" && !Number.isInteger(item.peakParallelTasks)) {
      errors.push(`${prefix}.peakParallelTasks must be an integer`);
    }
    if (typeof item.humanMinutes === "number" && item.humanMinutes > 1440) {
      errors.push(`${prefix}.humanMinutes cannot exceed 1440 minutes in one day`);
    }
    if (typeof item.reworkMinutes === "number") {
      if (typeof item.humanMinutes !== "number") errors.push(`${prefix}.reworkMinutes requires humanMinutes`);
      else if (item.reworkMinutes > item.humanMinutes) errors.push(`${prefix}.reworkMinutes exceeds humanMinutes`);
    }
    if (typeof item.taskLogComplete !== "boolean") errors.push(`${prefix}.taskLogComplete must be explicit`);
    if (typeof item.note !== "string") errors.push(`${prefix}.note must be a string`);
  }
  const ids = new Set<string>();
  for (const [index, item] of input.tasks.entries()) {
    const prefix = `tasks[${index}]`;
    if (!isRecord(item)) { errors.push(`${prefix} must be an object`); continue; }
    if (typeof item.id !== "string" || !item.id.trim()) errors.push(`${prefix}.id must be non-empty`);
    else {
      if (ids.has(item.id)) errors.push(`${prefix}: duplicate task id ${item.id}`);
      ids.add(item.id);
    }
    if (!isCalendarDate(item.date)) errors.push(`${prefix}.date must be a valid calendar date`);
    else if (!dates.has(item.date)) errors.push(`${prefix}.date needs a corresponding day record`);
    if (typeof item.title !== "string" || !item.title.trim()) errors.push(`${prefix}.title must be non-empty`);
    if (!["code", "research", "writing", "operations", "other"].includes(String(item.category))) errors.push(`${prefix}.category is unsupported`);
    if (!["active", "accepted", "rejected", "abandoned"].includes(String(item.status))) errors.push(`${prefix}.status is unsupported`);
    if (typeof item.acceptanceCriterion !== "string" || (item.status === "accepted" && !item.acceptanceCriterion.trim())) {
      errors.push(`${prefix}.acceptanceCriterion must be a string and non-empty for accepted tasks`);
    }
    if (!isEvidenceUrl(item.evidenceUrl)) errors.push(`${prefix}.evidenceUrl must be an HTTP(S) URL, site path, or null`);
    if (item.status === "accepted" && item.evidenceUrl === null) errors.push(`${prefix}.evidenceUrl is required for accepted tasks`);
    if (typeof item.note !== "string") errors.push(`${prefix}.note must be a string`);
  }
  return errors;
}

const inputErrors = validateObservations(rawObservations);
if (inputErrors.length) throw new Error(`Invalid Agent observatory data: ${inputErrors.join("; ")}`);
export const publicObservations = rawObservations as ObservatoryData;
export const observations = publicObservations;

/**
 * Summarize the latest observed seven calendar days, never the reader's current week.
 * Partial calendar totals are explicitly marked. Missing measurements within recorded
 * days suppress a total. Missing days are never interpreted as zero-work days.
 */
export function summarizeObservations(data: ObservatoryData = publicObservations): ObservationSummary {
  const latest = [...data.days.map((day) => day.date), ...data.tasks.map((task) => task.date)].sort().at(-1);
  if (!latest) return {
    windowStart: null, windowEnd: null, observedDays: 0,
    peakParallel: null, acceptedTasks: null, humanHours: null, reworkHours: null,
    coverage: { peak: "none", human: "none", rework: "none", accepted: "none" }
  };
  const start = new Date(`${latest}T00:00:00.000Z`);
  start.setUTCDate(start.getUTCDate() - 6);
  const windowStart = start.toISOString().slice(0, 10);
  const inWindow = (date: string) => date >= windowStart && date <= latest;
  const days = [...new Map(data.days.filter((day) => inWindow(day.date)).map((day) => [day.date, day])).values()];
  const coverage = (count: number): Coverage => count === 0 ? "none" : count === 7 ? "complete" : "partial";
  const known = (key: "peakParallelTasks" | "humanMinutes" | "reworkMinutes") =>
    days.map((day) => day[key]).filter((value): value is number => value !== null);
  const peaks = known("peakParallelTasks");
  const human = known("humanMinutes");
  const rework = known("reworkMinutes");
  const completeTaskDays = days.filter((day) => day.taskLogComplete).length;
  const hours = (values: number[]) => days.length > 0 && values.length === days.length
    ? values.reduce((total, value) => total + value, 0) / 60 : null;
  const acceptedIds = new Set(data.tasks.filter((task) => task.status === "accepted" && inWindow(task.date)).map((task) => task.id));
  return {
    windowStart,
    windowEnd: latest,
    observedDays: days.length,
    peakParallel: peaks.length > 0 && peaks.length === days.length ? Math.max(...peaks) : null,
    acceptedTasks: days.length > 0 && completeTaskDays === days.length ? acceptedIds.size : null,
    humanHours: hours(human),
    reworkHours: hours(rework),
    coverage: {
      peak: coverage(peaks.length),
      human: coverage(human.length),
      rework: coverage(rework.length),
      accepted: coverage(completeTaskDays)
    }
  };
}

export const summary = summarizeObservations();

export const evidenceRecords: EvidenceRecord[] = [
  {
    id: "metr-task-horizons-2025",
    date: "2025-03-19",
    kind: "能力基准",
    title: "可完成的任务跨度在增长",
    finding: "METR 的研究以人类专家完成任务所需的时间衡量难度，报告 50% 成功率对应的任务跨度在研究期间约每七个月翻倍。",
    limit: "这是任务的人类用时，无法直接换算成 Agent 连续运行时长、人均管理数量或可靠交付能力。",
    url: "https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/"
  },
  {
    id: "microsoft-field-experiments-2025",
    date: "2025-06",
    kind: "现场随机实验",
    title: "真实工作中测得收益，也存在差异",
    finding: "三个现场实验涵盖 4,867 名开发者；合并估计使用 AI 助手后完成任务数提高 26.08%，标准误为 10.3%。",
    limit: "研究主要考察代码助手；任务数量增长不能直接转成人均价值增长，也没有测量多 Agent 的收益。",
    url: "https://www.microsoft.com/en-us/research/publication/the-effects-of-generative-ai-on-high-skilled-work-evidence-from-three-field-experiments-with-software-developers/"
  },
  {
    id: "metr-developer-rct-2025",
    date: "2025-07-10",
    kind: "现场随机实验",
    title: "感觉更快与实际更快会分离",
    finding: "16 名熟悉大型开源项目的开发者处理 246 个真实任务；允许使用当时的 AI 工具使完成时间增加 19%。",
    limit: "这是特定时段、人员和代码库上的结果，不能外推到当前全部开发任务；审核与纠错应纳入人工投入。",
    url: "https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/"
  },
  {
    id: "metr-parallel-measurement-2026",
    date: "2026-02-24",
    kind: "测量方法更新",
    title: "一人多 Agent 改变了计时方法",
    finding: "METR 指出并发使用 Agent、等待期间处理其他任务，以及参与者和任务选择偏差，使逐任务耗时难以代表真实生产率。",
    limit: "这项更新揭示测量限制，无法据此推断一个人能管理多少 Agent，也不能把新实验点估计作为确定的生产率增益。",
    url: "https://metr.org/blog/2026-02-24-uplift-update/"
  },
  {
    id: "agent-scaling-v3-2026",
    date: "2026-04-08",
    kind: "多 Agent 基准",
    title: "并行收益取决于任务与协作结构",
    finding: "论文 v3 比较 260 种配置与 6 个基准；相对单 Agent，报告的任务表现变化从可拆分金融推理的 +80.8% 到顺序规划的 −70.0%。",
    limit: "这些百分比来自不同任务的基准表现，不能拼成一条生产率曲线，也不等于人类工作效率的变化。",
    url: "https://arxiv.org/abs/2512.08296v3"
  },
  {
    id: "metr-self-report-2026",
    date: "2026-05-11",
    kind: "自报调查",
    title: "速度与产出价值需要分别记录",
    finding: "349 名技术工作者的调查中，三种产出价值问题的自报增益中位数为 1.4–2 倍，自报速度增益中位数为 3 倍。",
    limit: "便利样本与自报反事实描述参与者的判断，尚不能证明因果收益；感受、实际用时与交付价值应分开记录。",
    url: "https://metr.org/blog/2026-05-11-ai-usage-survey/"
  }
];
export const evidence = evidenceRecords;
