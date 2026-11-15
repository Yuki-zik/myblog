import type { APIContext } from "astro";
import { buildAgentObservatoryDataset } from "../../lib/agents/dataset";

/**
 * Machine-readable JSON distribution (`/agents/dataset.json`) for the Agent Work Observatory.
 * Preserves null for unrecorded measurements; carries `X-Robots-Tag: noindex, follow`.
 */

export const prerender = true;

export function GET(context: APIContext) {
  const site = context.site ?? new URL("https://a-znk.com/");
  const payload = buildAgentObservatoryDataset(site.toString());

  return new Response(`${JSON.stringify(payload, null, 2)}\n`, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Robots-Tag": "noindex, follow",
      "Cache-Control": "public, max-age=300, must-revalidate"
    }
  });
}
