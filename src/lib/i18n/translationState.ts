/** A hash proves freshness, not semantic correctness. */
export type TranslationState = "current" | "stale" | "untracked" | "manual" | "missing";
export interface TranslationRecord {
  sourceHash?: string;
  targetHash?: string;
  translatedAt?: string;
  provider?: string;
  model?: string | null;
  state?: string;
  failedSourceHash?: string;
}
export function deriveTranslationState(sourceHash: string, targetHash: string | undefined, entry?: TranslationRecord): TranslationState {
  if (!targetHash) return "missing";
  if (!entry?.sourceHash || !entry.targetHash) return "untracked";
  if (entry.sourceHash !== sourceHash) return "stale";
  if (entry.targetHash !== targetHash) return "manual";
  return "current";
}
