import type { APIContext } from "astro";
import {
  buildAgentObservatoryDataset,
  serializeAgentObservatoryCsv
} from "../../lib/agents/dataset";

/**
 * Tabular CSV distribution (`/agents/dataset.csv`) for Google Dataset Search & researchers.
 * Preserves empty cells (never 0) for unmeasured numeric fields; `X-Robots-Tag: noindex, follow`.
 */

export const prerender = true;

export function GET(context: APIContext) {
  const site = context.site ?? new URL("https://a-znk.com/");
  const body = serializeAgentObservatoryCsv(buildAgentObservatoryDataset(site.toString()));

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "X-Robots-Tag": "noindex, follow",
      "Cache-Control": "public, max-age=300, must-revalidate"
    }
  });
}
