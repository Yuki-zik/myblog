const SHANGHAI_TIME_ZONE = "Asia/Shanghai";

const displayDateFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: SHANGHAI_TIME_ZONE
});

const stableDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: SHANGHAI_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

function getFormattedDateParts(dateValue: string): { year: string; month: string; day: string } | null {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const parts = stableDateFormatter.formatToParts(parsed);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return null;
  }

  return { year, month, day };
}

export function getPostDateISO(dateValue: string): string {
  const direct = dateValue.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(direct)) {
    return direct;
  }

  const parts = getFormattedDateParts(dateValue);
  if (!parts) {
    return "0000-00-00";
  }

  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getPostMonthKey(dateValue: string): string {
  return getPostDateISO(dateValue).slice(0, 7);
}

export function formatPostDisplayDate(dateValue: string): string {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return getPostDateISO(dateValue).replace(/-/g, "/");
  }

  return displayDateFormatter.format(parsed);
}
