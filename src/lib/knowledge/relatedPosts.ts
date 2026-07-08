/**
 * Build-time "Related notes" for a post, derived purely from the frontmatter
 * knowledge graph (shared `topics[]` / `concepts[]`). This is an honest
 * relation index — not prose backlinking — and complements the reverse-link
 * sections that already exist on topic/concept pages.
 *
 * Scoring weights a shared topic (broad problem domain) above a shared concept
 * (local term), so the most topically-aligned notes surface first.
 */

export interface RelatedPostInput {
  id: string;
  title: string;
  summary?: string;
  /** ISO date string; used only as a deterministic tie-breaker. */
  date: string;
  topics: string[];
  concepts?: string[];
}

export interface RelatedPost {
  id: string;
  title: string;
  summary?: string;
  sharedTopicCount: number;
  sharedConceptCount: number;
  score: number;
}

const SHARED_TOPIC_WEIGHT = 2;
const SHARED_CONCEPT_WEIGHT = 1;

export function getRelatedPosts(
  current: RelatedPostInput,
  candidates: RelatedPostInput[],
  limit = 4
): RelatedPost[] {
  const topicSet = new Set(current.topics);
  const conceptSet = new Set(current.concepts ?? []);

  return candidates
    .filter((candidate) => candidate.id !== current.id)
    .map((candidate) => {
      const sharedTopicCount = candidate.topics.filter((topic) => topicSet.has(topic)).length;
      const sharedConceptCount = (candidate.concepts ?? []).filter((concept) =>
        conceptSet.has(concept)
      ).length;
      const score =
        sharedTopicCount * SHARED_TOPIC_WEIGHT + sharedConceptCount * SHARED_CONCEPT_WEIGHT;
      return { candidate, sharedTopicCount, sharedConceptCount, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.candidate.date.localeCompare(a.candidate.date))
    .slice(0, Math.max(limit, 0))
    .map((entry) => ({
      id: entry.candidate.id,
      title: entry.candidate.title,
      summary: entry.candidate.summary,
      sharedTopicCount: entry.sharedTopicCount,
      sharedConceptCount: entry.sharedConceptCount,
      score: entry.score
    }));
}
