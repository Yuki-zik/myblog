#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const DEFAULT_DIST = path.resolve(process.cwd(), "dist");
const DEFAULT_QUERIES = path.resolve(process.cwd(), "src/data/geo-golden-queries.json");
const DEFAULT_DISCOVERY = path.resolve(process.cwd(), "docs/discovery-links.json");
const CANONICAL_ORIGIN = "https://a-znk.com";

/**
 * Hybrid lexical tokenizer supporting both English/Latin identifiers and CJK
 * unigrams + character bigrams so BM25 handles bilingual RAG chunk retrieval
 * without external native dependencies.
 */
export function tokenizeForRetrieval(text) {
  const normalized = String(text ?? "")
    .normalize("NFKC")
    .toLowerCase();
  const tokens = [];

  for (const match of normalized.matchAll(/[a-z0-9]+(?:[-._/][a-z0-9]+)*/g)) {
    const token = match[0];
    if (token.length >= 2 || /\d/.test(token)) {
      tokens.push(token);
      if (/[-._/]/.test(token)) {
        for (const part of token.split(/[-._/]/)) {
          if (part.length >= 2 || /\d/.test(part)) tokens.push(part);
        }
      }
    }
  }

  for (const match of normalized.matchAll(/\p{Script=Han}+/gu)) {
    const run = match[0];
    if (run.length === 1) {
      tokens.push(run);
      continue;
    }
    for (let i = 0; i < run.length - 1; i += 1) {
      tokens.push(run.slice(i, i + 2));
    }
  }

  return tokens;
}

function stripTags(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractMetaDescription(html) {
  const nameFirst = html.match(
    /<meta\b[^>]*name=(["'])description\1[^>]*content=(["'])([\s\S]*?)\2/i
  );
  if (nameFirst) return stripTags(nameFirst[3]);
  const contentFirst = html.match(
    /<meta\b[^>]*content=(["'])([\s\S]*?)\1[^>]*name=(["'])description\3/i
  );
  return contentFirst ? stripTags(contentFirst[2]) : "";
}

/**
 * Extracts Meso-level semantic chunks (split by <h2>/<h3> inside <main>) from a
 * rendered HTML document, mirroring RAG passage splitters evaluated in GEO-SFE
 * (arXiv:2603.29979) and SIGIR '26 Competitive GEO (arXiv:2605.25517).
 */
export function extractPageChunks(html, route) {
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const pageTitle = titleMatch ? stripTags(titleMatch[1]) : route;
  const metaDescription = extractMetaDescription(html);

  const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  const mainHtml = mainMatch ? mainMatch[1] : html;
  const h1Match = mainHtml.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const h1 = h1Match ? stripTags(h1Match[1]) : pageTitle;

  const headingRegex = /<(h2|h3)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  const splits = [];
  let match;
  while ((match = headingRegex.exec(mainHtml)) !== null) {
    splits.push({
      index: match.index,
      endIndex: match.index + match[0].length,
      level: match[1].toLowerCase(),
      heading: stripTags(match[2])
    });
  }

  const chunks = [];
  const introSlice = splits.length > 0 ? mainHtml.slice(0, splits[0].index) : mainHtml;
  const introText = stripTags(introSlice);
  if (introText.length > 0 || metaDescription.length > 0) {
    chunks.push({
      id: `${route}#lead`,
      route,
      heading: h1,
      text: `${pageTitle}. ${metaDescription}. ${introText}`.trim()
    });
  }

  for (let i = 0; i < splits.length; i += 1) {
    const current = splits[i];
    const nextStart = i + 1 < splits.length ? splits[i + 1].index : mainHtml.length;
    const sectionHtml = mainHtml.slice(current.endIndex, nextStart);
    const bodyText = stripTags(sectionHtml);
    if (!bodyText) continue;
    chunks.push({
      id: `${route}#s${i + 1}`,
      route,
      heading: current.heading,
      text: `${h1} — ${current.heading}: ${bodyText}`
    });
  }

  return chunks;
}

/**
 * Scores a rendered HTML page on empirically validated structural & citation
 * readiness features (GEO-SFE arXiv:2603.29979 + Competitive GEO arXiv:2605.25517):
 * - Macro (30 pts): >=5 descriptive h2 sections (15) + machine-readable JSON-LD & date/DOI cues (15)
 * - Meso (35 pts): self-contained lead density >=50 tokens (15) + multi-chunk coverage >=5 substantive chunks (20)
 * - Micro (35 pts): structured containers table/dl/list (15) + >=5 quantitative metrics (10) + primary external/DOI citations (10)
 */
export function scoreGeoSfeStructure(html, route) {
  const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  const mainHtml = mainMatch ? mainMatch[1] : html;
  const h2Count = (mainHtml.match(/<h2\b/gi) ?? []).length;
  const hasJsonLd = /<script\b[^>]*type=["']application\/ld\+json["']/i.test(html);
  const hasFreshnessSignal = /dateModified|citation_publication_date/i.test(html);

  const chunks = extractPageChunks(html, route);
  const substantiveChunks = chunks.filter(
    (chunk) => tokenizeForRetrieval(chunk.text).length >= 35
  ).length;
  const leadTokens = chunks[0] ? tokenizeForRetrieval(chunks[0].text).length : 0;

  const hasDataTable = /<table\b/i.test(mainHtml);
  const hasListOrDl = /<(?:ul|ol|dl)\b/i.test(mainHtml);
  const plainMain = stripTags(mainHtml);
  const quantMatches =
    plainMain.match(/\b\d+(?:\.\d+)?%|\b20\d{2}\b|\b\d+\s*(?:px|ms|min|分钟|篇|项|条)\b/g) ?? [];
  const hasAuthoritativeCitation =
    /doi\.org\/10\.|arxiv\.org|scholar\.google\.com|orcid\.org|metr\.org/i.test(html);

  const macro =
    Math.min(15, h2Count * 3) +
    (hasJsonLd && hasFreshnessSignal ? 15 : hasJsonLd ? 8 : 0);
  const meso =
    Math.min(15, Math.round((leadTokens / 50) * 15)) +
    Math.min(20, substantiveChunks * 4);
  const micro =
    (hasDataTable ? 15 : hasListOrDl ? 6 : 0) +
    Math.min(10, quantMatches.length * 2) +
    (hasAuthoritativeCitation ? 10 : 0);

  return {
    route,
    total: Math.min(100, macro + meso + micro),
    macro: Math.min(30, macro),
    meso: Math.min(35, meso),
    micro: Math.min(35, micro),
    details: {
      h2Count,
      chunkCount: chunks.length,
      substantiveChunks,
      leadTokens,
      hasDataTable,
      quantitativeAnchors: quantMatches.length,
      hasAuthoritativeCitation,
      hasFreshnessSignal
    }
  };
}

/**
 * Evaluates BM25 (k1 = 1.5, b = 0.75) over Meso-level chunks and aggregates
 * per-route best chunk scores (MaxP passage retrieval, matching Google Passage
 * Ranking & standard RAG rerankers).
 */
export function runChunkBm25Benchmark(chunks, queries, { k1 = 1.5, b = 0.75 } = {}) {
  const tokenizedChunks = chunks.map((chunk) => {
    const tokens = tokenizeForRetrieval(chunk.text);
    const tf = new Map();
    for (const token of tokens) {
      tf.set(token, (tf.get(token) ?? 0) + 1);
    }
    return { ...chunk, tokens, length: tokens.length, tf };
  });

  const docCount = Math.max(1, tokenizedChunks.length);
  const avgDocLength =
    tokenizedChunks.reduce((sum, item) => sum + item.length, 0) / docCount || 1;
  const df = new Map();
  for (const item of tokenizedChunks) {
    for (const term of item.tf.keys()) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }

  const results = [];
  for (const entry of queries) {
    const qTerms = [...new Set(tokenizeForRetrieval(entry.query))];
    const routeBest = new Map();

    for (const chunk of tokenizedChunks) {
      let score = 0;
      for (const term of qTerms) {
        const freq = chunk.tf.get(term) ?? 0;
        if (freq === 0) continue;
        const termDf = df.get(term) ?? 0;
        const idf = Math.log(1 + (docCount - termDf + 0.5) / (termDf + 0.5));
        const denom = freq + k1 * (1 - b + b * (chunk.length / avgDocLength));
        score += idf * ((freq * (k1 + 1)) / denom);
      }
      if (score > 0) {
        const prev = routeBest.get(chunk.route);
        if (!prev || score > prev.score) {
          routeBest.set(chunk.route, {
            route: chunk.route,
            chunkId: chunk.id,
            heading: chunk.heading,
            score: Number(score.toFixed(4))
          });
        }
      }
    }

    const ranked = [...routeBest.values()].sort((a, b) => b.score - a.score);
    const expected = new Set(entry.expectedRoutes);
    const hitIndex = ranked.findIndex((item) => expected.has(item.route));
    const rank = hitIndex === -1 ? null : hitIndex + 1;

    results.push({
      id: entry.id,
      bucket: entry.bucket,
      locale: entry.locale,
      query: entry.query,
      expectedRoutes: entry.expectedRoutes,
      rank,
      hitAt1: rank === 1,
      hitAt3: rank !== null && rank <= 3,
      reciprocalRank: rank ? Number((1 / rank).toFixed(4)) : 0,
      topRoutes: ranked.slice(0, 3)
    });
  }

  const count = Math.max(1, results.length);
  const recallAt1 = Number(
    (results.filter((item) => item.hitAt1).length / count).toFixed(4)
  );
  const recallAt3 = Number(
    (results.filter((item) => item.hitAt3).length / count).toFixed(4)
  );
  const mrr = Number(
    (results.reduce((sum, item) => sum + item.reciprocalRank, 0) / count).toFixed(4)
  );

  return { recallAt1, recallAt3, mrr, totalQueries: results.length, results };
}

export function auditDiscoveryLinkPurity(discoveryJson) {
  const urls = [];
  for (const ref of discoveryJson?.references ?? []) {
    for (const url of ref.addedUrls ?? []) {
      urls.push({ source: `references:${ref.repo}`, url });
    }
  }
  for (const repo of discoveryJson?.readback?.repositories ?? []) {
    if (repo.homepageUrl) {
      urls.push({ source: `readback.homepageUrl:${repo.repo}`, url: repo.homepageUrl });
    }
    for (const url of repo.addedUrls ?? []) {
      urls.push({ source: `readback.addedUrls:${repo.repo}`, url });
    }
  }
  if (discoveryJson?.productionSeo?.personUrl) {
    urls.push({
      source: "productionSeo.personUrl",
      url: discoveryJson.productionSeo.personUrl
    });
  }
  for (const page of discoveryJson?.productionReaderReadback?.pages ?? []) {
    if (page.canonical) {
      urls.push({
        source: `productionReaderReadback:${page.route}`,
        url: page.canonical
      });
    }
  }

  const recordedOrigin = discoveryJson?.origin ? String(discoveryJson.origin).replace(/\/$/, "") : null;
  const originMatchesCanonical = recordedOrigin === CANONICAL_ORIGIN;
  const legacyUrls = urls.filter((item) => !String(item.url).startsWith(CANONICAL_ORIGIN));
  return {
    recordedOrigin: discoveryJson?.origin ?? null,
    originMatchesCanonical,
    totalRecordedUrls: urls.length,
    canonicalUrls: urls.length - legacyUrls.length,
    legacyUrls
  };
}

function routeToHtmlPath(distDir, route) {
  if (route === "/") return path.join(distDir, "index.html");
  const clean = route.replace(/^\//, "");
  const indexCandidate = path.join(distDir, clean, "index.html");
  if (existsSync(indexCandidate)) return indexCandidate;
  return path.join(distDir, `${clean}.html`);
}

function loadCanonicalRoutesFromSitemap(distDir) {
  const sitemapPath = path.join(distDir, "sitemap.xml");
  if (!existsSync(sitemapPath)) {
    throw new Error(`Missing ${sitemapPath}; run pnpm build first.`);
  }
  const xml = readFileSync(sitemapPath, "utf8");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => {
    const parsed = new URL(match[1].trim());
    return parsed.pathname === "/" ? "/" : parsed.pathname.replace(/\/$/, "");
  });
}

async function runLiveAudit() {
  const checks = [];
  for (const endpoint of [
    "/agents/dataset.json",
    "/agents/dataset.csv",
    "/papers/duap-multilingual-speech-privacy.bib"
  ]) {
    const response = await fetch(`${CANONICAL_ORIGIN}${endpoint}`);
    checks.push({
      endpoint,
      status: response.status,
      contentType: response.headers.get("content-type"),
      robotsTag: response.headers.get("x-robots-tag")
    });
  }
  return checks;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const jsonOutput = args.has("--json");
  const liveMode = args.has("--live");

  const routes = loadCanonicalRoutesFromSitemap(DEFAULT_DIST);
  const allChunks = [];
  const pageHtmlByRoute = new Map();

  for (const route of routes) {
    const htmlPath = routeToHtmlPath(DEFAULT_DIST, route);
    if (!existsSync(htmlPath)) continue;
    const html = readFileSync(htmlPath, "utf8");
    pageHtmlByRoute.set(route, html);
    allChunks.push(...extractPageChunks(html, route));
  }

  const querySpec = JSON.parse(readFileSync(DEFAULT_QUERIES, "utf8"));
  const retrieval = runChunkBm25Benchmark(allChunks, querySpec.queries);

  const flagshipRoutes = [
    "/papers/duap-multilingual-speech-privacy",
    "/en/papers/duap-multilingual-speech-privacy",
    "/agents",
    "/en/agents",
    "/posts/ant-ai-coding-review",
    "/posts/paragraph-anchor-design",
    "/posts/myblog-design-manual",
    "/author"
  ];
  const structuralScores = flagshipRoutes
    .filter((route) => pageHtmlByRoute.has(route))
    .map((route) => scoreGeoSfeStructure(pageHtmlByRoute.get(route), route));
  const meanGeoSfeScore = Number(
    (
      structuralScores.reduce((sum, item) => sum + item.total, 0) /
      Math.max(1, structuralScores.length)
    ).toFixed(1)
  );

  const agentsHtml = pageHtmlByRoute.get("/agents") ?? "";
  const duapHtml = pageHtmlByRoute.get("/papers/duap-multilingual-speech-privacy") ?? "";
  const assetReadiness = {
    agentsDatasetJsonLd: /"@type"\s*:\s*"Dataset"/.test(agentsHtml),
    agentsDatasetJsonEndpoint: existsSync(path.join(DEFAULT_DIST, "agents/dataset.json")),
    agentsDatasetCsvEndpoint: existsSync(path.join(DEFAULT_DIST, "agents/dataset.csv")),
    duapBibtexEndpoint: existsSync(
      path.join(DEFAULT_DIST, "papers/duap-multilingual-speech-privacy.bib")
    ),
    duapBibtexHeadLink: /type=["']application\/x-bibtex["']/.test(duapHtml)
  };

  const discoveryJson = existsSync(DEFAULT_DISCOVERY)
    ? JSON.parse(readFileSync(DEFAULT_DISCOVERY, "utf8"))
    : null;
  const discoveryPurity = auditDiscoveryLinkPurity(discoveryJson);

  const liveChecks = liveMode ? await runLiveAudit() : null;

  const assetsOk = Object.values(assetReadiness).every(Boolean);
  const purityOk =
    discoveryPurity.originMatchesCanonical && discoveryPurity.legacyUrls.length === 0;
  const liveOk =
    !liveChecks ||
    liveChecks.every(
      (item) =>
        item.status === 200 && String(item.robotsTag ?? "").toLowerCase().includes("noindex")
    );
  const ok = assetsOk && purityOk && liveOk;
  if (!ok) {
    process.exitCode = 1;
  }

  const report = {
    ok,
    canonicalRoutes: routes.length,
    totalMesoChunks: allChunks.length,
    retrieval: {
      recallAt1: retrieval.recallAt1,
      recallAt3: retrieval.recallAt3,
      mrr: retrieval.mrr,
      missedQueries: retrieval.results
        .filter((item) => !item.hitAt1)
        .map((item) => ({
          id: item.id,
          query: item.query,
          expected: item.expectedRoutes,
          rank: item.rank,
          top1: item.topRoutes[0]?.route ?? null
        }))
    },
    geoSfe: {
      meanScore: meanGeoSfeScore,
      pages: structuralScores
    },
    assetReadiness,
    discoveryPurity,
    ...(liveChecks ? { liveChecks } : {})
  };

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log("=== GEO & Search Retrieval Probe ===");
  console.log(
    `Routes: ${report.canonicalRoutes} | Meso-chunks: ${report.totalMesoChunks} | Recall@1: ${(
      retrieval.recallAt1 * 100
    ).toFixed(1)}% | Recall@3: ${(retrieval.recallAt3 * 100).toFixed(1)}% | MRR: ${retrieval.mrr}`
  );
  console.log(`Mean Flagship GEO-SFE Structural Score: ${meanGeoSfeScore}/100`);
  for (const page of structuralScores) {
    console.log(
      `  - ${page.route}: ${page.total}/100 (macro=${page.macro}/30, meso=${page.meso}/35, micro=${page.micro}/35)`
    );
  }
  console.log(
    `Dataset & Citation Readiness: DatasetJSON-LD=${assetReadiness.agentsDatasetJsonLd}, CSV=${assetReadiness.agentsDatasetCsvEndpoint}, JSON=${assetReadiness.agentsDatasetJsonEndpoint}, BibTeX=${assetReadiness.duapBibtexEndpoint}`
  );
  console.log(
    `GitHub Discovery Link Purity: ${discoveryPurity.canonicalUrls}/${discoveryPurity.totalRecordedUrls} canonical (${discoveryPurity.legacyUrls.length} legacy URLs, originOk=${discoveryPurity.originMatchesCanonical})`
  );
  if (liveChecks) {
    console.log("Live Production Endpoints:");
    for (const check of liveChecks) {
      console.log(
        `  - ${check.endpoint}: HTTP ${check.status} | Content-Type=${check.contentType} | X-Robots-Tag=${check.robotsTag}`
      );
    }
  }
  if (report.retrieval.missedQueries.length > 0) {
    console.log("Queries not at Rank 1:");
    for (const miss of report.retrieval.missedQueries) {
      console.log(
        `  * [${miss.id}] rank=${miss.rank ?? "MISS"} top1=${miss.top1} expected=${miss.expected.join(",")}`
      );
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
