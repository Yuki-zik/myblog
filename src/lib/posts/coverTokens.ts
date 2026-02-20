export type CoverPattern = "grid" | "stripes" | "beams";

export interface CoverTokens {
  palette: [string, string, string];
  accent: string;
  pattern: CoverPattern;
  badge: string;
  tilt: number;
}

const PALETTES: Array<[string, string, string]> = [
  ["#0f2e4b", "#13627a", "#2ca488"],
  ["#1c1f4d", "#1f4f78", "#17938f"],
  ["#1f2f5c", "#145f70", "#24a87b"],
  ["#17304a", "#0f5b82", "#31a191"],
  ["#1f2a56", "#156380", "#2db297"]
];

const PATTERNS: CoverPattern[] = ["grid", "stripes", "beams"];

const BADGES = [
  "TOPIC FIRST",
  "KNOWLEDGE FLOW",
  "PARAGRAPH DESIGN",
  "CONCEPT LINK",
  "EDITORIAL TECH"
] as const;

function hashSlug(slug: string): number {
  let hash = 2166136261;

  for (let i = 0; i < slug.length; i += 1) {
    hash ^= slug.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function getPostCoverTokens(slug: string): CoverTokens {
  const normalized = slug.trim().toLowerCase();
  const hash = hashSlug(normalized);

  const palette = PALETTES[hash % PALETTES.length];
  const accent = palette[(hash >>> 3) % palette.length];
  const pattern = PATTERNS[(hash >>> 7) % PATTERNS.length];
  const badge = BADGES[(hash >>> 11) % BADGES.length];
  const tilt = ((hash >>> 15) % 31) - 15;

  return {
    palette,
    accent,
    pattern,
    badge,
    tilt
  };
}
