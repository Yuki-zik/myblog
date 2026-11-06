export const CONSENT_KEY = "analytics-consent-v1";
export const PUBLIC_HOSTS = new Set(["a-znk.com", "www.a-znk.com", "vps.a-znk.com"]);
export const CAMPAIGN_SOURCES = new Set(["telegram", "tg", "discord", "x", "twitter", "github", "newsletter", "wechat", "bilibili", "zhihu", "xiaohongshu"]);
const CAMPAIGNS = new Set(["bionic-reading", "weekly-digest", "agent-memory", "blog-launch"]);

export function analyticsAllowed(input: { host: string; preference: string | null; dnt?: string | null; gpc?: boolean }): boolean {
  return PUBLIC_HOSTS.has(input.host) && (input.preference === null || input.preference === "on") && input.dnt !== "1" && !input.gpc;
}

/** Only static, public blog routes; never query/search/form values or fragments. */
export function cleanPath(input: string): string | null {
  if (!input.startsWith("/") || input.startsWith("//")) return null;
  const path = input.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
  if (path === "/" || path === "/en") return path;
  if (/^(?:\/en)?\/(?:author|archives|map|agents|papers|topics)$/.test(path)) return path;
  if (/^(?:\/en)?\/(?:posts|papers|topics|concepts)\/[a-z0-9][a-z0-9-]{0,160}$/.test(path)) return path;
  return null;
}

/** Keep only known campaign labels or an external origin, never full referral URLs. */
export function sourceLabel(href: string, referrer: string): string {
  try {
    const url = new URL(href);
    const source = url.searchParams.get("utm_source")?.toLowerCase();
    if (source && CAMPAIGN_SOURCES.has(source)) {
      const campaign = url.searchParams.get("utm_campaign") ?? "";
      return `campaign:${source}${CAMPAIGNS.has(campaign) ? ":" + campaign : ""}`;
    }
    if (!referrer) return "";
    const ref = new URL(referrer);
    return /^https?:$/.test(ref.protocol) && !PUBLIC_HOSTS.has(ref.hostname) ? ref.origin : "";
  } catch { return ""; }
}

export type OutboundKind = "telegram" | "discord" | "github" | "email" | "rss" | "external";
export function outboundKind(href: string, origin: string): OutboundKind | null {
  try {
    const url = new URL(href, origin);
    if (url.protocol === "mailto:") return "email";
    if (!/^https?:$/.test(url.protocol)) return null;
    if (url.origin === origin || PUBLIC_HOSTS.has(url.hostname)) return /^(?:\/en)?\/rss\.xml$/.test(url.pathname) ? "rss" : null;
    if (["t.me", "telegram.me"].includes(url.hostname)) return "telegram";
    if (["discord.com", "discord.gg"].includes(url.hostname)) return "discord";
    if (url.hostname === "github.com") return "github";
    return "external";
  } catch { return null; }
}

export function readingMilestones(progress: number, activeSeconds: number, sent: Set<number>): number[] {
  if (!Number.isFinite(progress) || activeSeconds < 10) return [];
  return [25, 50, 75, 90].filter(value => progress * 100 >= value && !sent.has(value));
}

export function eventPath(name: string, path: string): string {
  return `${name}:${path}`;
}

export function parsePublicCount(value: unknown): number | null {
  if (!value || typeof value !== "object" || !("count" in value)) return null;
  const raw = (value as {count:unknown}).count;
  if (typeof raw !== "number" && (typeof raw !== "string" || !/^\d[\d,]*$/.test(raw))) return null;
  const count = Number(typeof raw === "string" ? raw.replaceAll(",", "") : raw);
  return Number.isSafeInteger(count) && count >= 0 ? count : null;
}
