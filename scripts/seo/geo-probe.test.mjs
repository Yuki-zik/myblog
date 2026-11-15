import test from "node:test";
import assert from "node:assert/strict";
import {
  tokenizeForRetrieval,
  extractMetaDescription,
  extractPageChunks,
  scoreGeoSfeStructure,
  runChunkBm25Benchmark,
  auditDiscoveryLinkPurity
} from "./geo-probe.mjs";

test("tokenizeForRetrieval splits both Latin compound identifiers and CJK bigrams", () => {
  const tokens = tokenizeForRetrieval("Whisper 语言特征解耦 anchor_id dataset.csv 95%");
  assert(tokens.includes("whisper"));
  assert(tokens.includes("anchor_id"));
  assert(tokens.includes("anchor"));
  assert(tokens.includes("id"));
  assert(tokens.includes("dataset.csv"));
  assert(tokens.includes("dataset"));
  assert(tokens.includes("csv"));
  assert(tokens.includes("95"));
  assert(tokens.includes("语言"));
  assert(tokens.includes("特征"));
  assert(tokens.includes("解耦"));
});

test("extractMetaDescription preserves apostrophes inside double-quoted English descriptions", () => {
  const html = `<head><meta name="description" content="A-Znk's bilingual research notes on Whisper speech privacy."></head>`;
  assert.equal(
    extractMetaDescription(html),
    "A-Znk's bilingual research notes on Whisper speech privacy."
  );
});

test("extractPageChunks and runChunkBm25Benchmark rank matching meso-chunks first", () => {
  const html = `<!doctype html><html><head><title>DUAP Paper</title><meta name="description" content="A-Znk's multilingual speech privacy dossier"></head><body><main><h1>DUAP</h1><p>Lead summary for Whisper.</p><h2>Method</h2><p>Language Feature Disentanglement uses dual encoders and swap reconstruction.</p></main></body></html>`;
  const chunks = extractPageChunks(html, "/en/papers/duap");
  assert.equal(chunks.length, 2);
  assert(chunks[0].text.includes("A-Znk's multilingual speech privacy dossier"));
  const bench = runChunkBm25Benchmark(chunks, [
    {
      id: "q1",
      bucket: "paper",
      locale: "en",
      query: "Language Feature Disentanglement dual encoders swap reconstruction",
      expectedRoutes: ["/en/papers/duap"]
    }
  ]);
  assert.equal(bench.recallAt1, 1);
  assert.equal(bench.mrr, 1);
});

test("scoreGeoSfeStructure rewards tables, metrics, citations, and multi-section layout", () => {
  const thinHtml = `<main><h1>Note</h1><p>Short note.</p></main>`;
  const pad = "Whisper multilingual speech privacy protection via disentangled universal adversarial perturbations ".repeat(5);
  const richHtml = `<head><script type="application/ld+json">{"datePublished":"2026-03-01","dateModified":"2026-11-16"}</script></head><main><h1>DUAP Study</h1><p>${pad}</p><h2>Background</h2><p>${pad} 2026.</p><h2>Method</h2><p>${pad} DOI https://doi.org/10.1109/TIFS.2026.3671687</p><h2>Architecture</h2><p>${pad}</p><h2>Results</h2><p>${pad}</p><h2>Limitations</h2><p>${pad}</p><table><tr><td>95%</td><td>85%</td><td>87%</td><td>100%</td></tr></table></main>`;
  assert(scoreGeoSfeStructure(richHtml, "/a").total > scoreGeoSfeStructure(thinHtml, "/b").total + 50);
});

test("auditDiscoveryLinkPurity checks references, homepageUrl, and canonical readbacks", () => {
  const audit = auditDiscoveryLinkPurity({
    origin: "https://a-znk-blog.vercel.app/",
    references: [
      { repo: "Yuki-zik/Yuki-zik", addedUrls: ["https://a-znk-blog.vercel.app/", "https://a-znk.com/author"] }
    ],
    readback: {
      repositories: [
        { repo: "Yuki-zik/myblog", homepageUrl: "https://a-znk.com" }
      ]
    }
  });
  assert.equal(audit.originMatchesCanonical, false);
  assert.equal(audit.totalRecordedUrls, 3);
  assert.equal(audit.canonicalUrls, 2);
  assert.equal(audit.legacyUrls.length, 1);
});
