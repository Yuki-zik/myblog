import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  AUTO_APPLY_SCORE,
  computeFigureCrop,
  extractOverviewFromLayout,
  extractPaperSections,
  parseBboxLayout,
  parsePdfResource,
  rankFigureCandidates,
  renderFigureCrop,
  upsertGeneratedCoverBlock,
} from "../../../scripts/papers/lib.mjs";

const bboxFixture = `<?xml version="1.0"?>
<doc>
  <page width="612" height="792">
    <flow><block>
      <line xMin="50" yMin="600" xMax="560" yMax="614">
        <word xMin="50" yMin="600" xMax="85" yMax="614">Figure</word>
        <word xMin="90" yMin="600" xMax="98" yMax="614">2.</word>
        <word xMin="102" yMin="600" xMax="160" yMax="614">Overview</word>
        <word xMin="164" yMin="600" xMax="180" yMax="614">of</word>
        <word xMin="184" yMin="600" xMax="205" yMax="614">the</word>
        <word xMin="209" yMin="600" xMax="270" yMax="614">proposed</word>
        <word xMin="274" yMin="600" xMax="330" yMax="614">pipeline.</word>
      </line>
      <line xMin="50" yMin="640" xMax="400" yMax="654">
        <word xMin="50" yMin="640" xMax="82" yMax="654">Table</word>
        <word xMin="86" yMin="640" xMax="94" yMax="654">1.</word>
        <word xMin="98" yMin="640" xMax="145" yMax="654">Results</word>
      </line>
    </block></flow>
  </page>
</doc>`;

describe("paper PDF enrichment helpers", () => {
  it("keeps a small figure's crop pixels, original proportions and transparency without a canvas", async () => {
    const width = 400;
    const height = 320;
    const pixels = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        pixels.set([x % 256, y % 256, 128, 137], offset);
      }
    }
    const input = await sharp(pixels, { raw: { width, height, channels: 4 } }).png().toBuffer();

    const result = await renderFigureCrop(input, { x: .1, y: .25, width: .6, height: .5 });
    const metadata = await sharp(result).metadata();
    expect(metadata).toMatchObject({ format: "png", width: 240, height: 160, hasAlpha: true });
    const output = await sharp(result).raw().toBuffer();
    expect([...output.subarray(0, 4)]).toEqual([40, 80, 128, 137]);
    expect([...output.subarray(-4)]).toEqual([23, 239, 128, 137]);
  });

  it("limits a large extracted figure to 1600px wide while preserving its crop ratio", async () => {
    const input = await sharp({
      create: { width: 3200, height: 1200, channels: 3, background: { r: 31, g: 93, b: 151 } },
    }).png().toBuffer();

    const result = await renderFigureCrop(input, { x: .125, y: .25, width: .75, height: .5 });
    expect(await sharp(result).metadata()).toMatchObject({ format: "png", width: 1600, height: 400 });
  });

  it("preserves a portrait figure's natural height without enlarging its narrow width", async () => {
    const input = await sharp({
      create: { width: 600, height: 1200, channels: 3, background: { r: 88, g: 123, b: 160 } },
    }).png().toBuffer();

    const result = await renderFigureCrop(input, { x: .25, y: .1, width: .5, height: .8 });
    expect(await sharp(result).metadata()).toMatchObject({ format: "png", width: 300, height: 960 });
  });

  it("extracts abstract and introduction overview without later sections", () => {
    const sections = extractPaperSections(`
      ABSTRACT
      We present a multilingual privacy pipeline.
      Keywords: privacy, ASR
      1 Introduction
      Automatic speech recognition creates new privacy risks.
      2 Related Work
      This should not be included.
    `);

    expect(sections.abstract).toBe("We present a multilingual privacy pipeline.");
    expect(sections.overview).toBe("Automatic speech recognition creates new privacy risks.");
  });

  it("ranks a pipeline figure above non-method captions and computes a safe crop", () => {
    const pages = parseBboxLayout(bboxFixture);
    const [candidate] = rankFigureCandidates(pages);

    expect(candidate.caption).toContain("Overview of the proposed pipeline");
    expect(candidate.caption).not.toContain("Table");
    expect(candidate.score).toBeGreaterThanOrEqual(AUTO_APPLY_SCORE);
    expect(computeFigureCrop(candidate)).toMatchObject({
      x: expect.any(Number),
      y: expect.any(Number),
      width: expect.any(Number),
      height: expect.any(Number),
    });
    expect(computeFigureCrop(candidate).y + computeFigureCrop(candidate).height).toBeLessThan(0.8);
  });

  it("excludes detected figure internals from the layout-derived overview", () => {
    const pages = parseBboxLayout(`<?xml version="1.0"?><doc><page width="612" height="792"><flow><block>
      <line xMin="50" yMin="80" xMax="160" yMax="94"><word>1</word><word>Introduction</word></line>
      <line xMin="50" yMin="110" xMax="520" yMax="124"><word>Speech</word><word>privacy</word><word>needs</word><word>robust</word><word>protection.</word></line>
      <line xMin="50" yMin="300" xMax="160" yMax="314"><word>Input</word><word>Encoder</word></line>
      <line xMin="50" yMin="500" xMax="520" yMax="514"><word>Figure</word><word>1.</word><word>Proposed</word><word>pipeline.</word></line>
      <line xMin="50" yMin="550" xMax="160" yMax="564"><word>2</word><word>Method</word></line>
    </block></flow></page></doc>`);
    const candidates = rankFigureCandidates(pages);

    expect(extractOverviewFromLayout(pages, candidates)).toBe(
      "Speech privacy needs robust protection.",
    );
  });

  it("finds only explicitly public PDF resources", () => {
    expect(
      parsePdfResource(`resources:
  - type: publisher
    url: https://doi.org/example
  - type: pdf
    url: https://example.org/paper.pdf
bibtex: value
---`),
    ).toBe("https://example.org/paper.pdf");
  });

  it("adds and replaces an auditable generated cover block", () => {
    const markdown = `---
title: Example
year: 2026
---

Body`;
    const first = upsertGeneratedCoverBlock(markdown, {
      filename: "example-pipeline.png",
      alt: "Pipeline",
      caption: "Figure 1. Pipeline",
      page: 3,
    });
    const second = upsertGeneratedCoverBlock(first, {
      filename: "example-pipeline-v2.png",
      alt: "Updated pipeline",
      caption: "Figure 2. Architecture",
      page: 4,
    });

    expect(second).toContain("./covers/example-pipeline-v2.png");
    expect(second).toContain("sourcePage: 4");
    expect(second.match(/paper-automation:start/g)).toHaveLength(1);
  });

  it("preserves an author-selected figure instead of replacing it with an automatic crop", () => {
    const selected = "---\ntitle: Example\ncover:\n  src: ./covers/author-figure.png\n  figureLabel: Fig. 3\n---\nBody";
    expect(() => upsertGeneratedCoverBlock(selected, {
      filename: "auto-pipeline.png", alt: "Automatic candidate", caption: "Figure 1", page: 2,
    })).toThrow(/manual cover/);
  });
});
