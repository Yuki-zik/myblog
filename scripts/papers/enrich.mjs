#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import {
  AUTO_APPLY_SCORE,
  PIPELINE_VERSION,
  computeFigureCrop,
  extractOverviewFromLayout,
  extractPaperSections,
  fileExists,
  parseBboxLayout,
  parsePaperTitle,
  parsePdfResource,
  rankFigureCandidates,
  relativeToRoot,
  sha256File,
  upsertGeneratedCoverBlock,
  writeJson,
} from "./lib.mjs";

const execFile = promisify(execFileCallback);
const root = process.cwd();
const contentDir = path.resolve(root, process.env.PAPER_CONTENT_DIR ?? "src/content/papers");
const localSourceDir = path.resolve(root, process.env.PAPER_SOURCE_DIR ?? ".paper-sources");
const reportDir = path.resolve(root, process.env.PAPER_REPORT_DIR ?? ".paper-pipeline/reports");
const coverDir = path.join(contentDir, "covers");
const manifestDir = path.join(contentDir, "automation");

function parseArgs(argv) {
  const args = {
    all: false,
    apply: false,
    check: false,
    force: false,
    slug: "",
    pdf: "",
    figurePage: 0,
    crop: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--all") args.all = true;
    else if (arg === "--apply") args.apply = true;
    else if (arg === "--check") args.check = true;
    else if (arg === "--force") args.force = true;
    else if (arg === "--slug") args.slug = argv[++index] ?? "";
    else if (arg === "--pdf") args.pdf = argv[++index] ?? "";
    else if (arg === "--figure-page") args.figurePage = Number(argv[++index] ?? 0);
    else if (arg === "--crop") {
      const values = (argv[++index] ?? "").split(",").map(Number);
      const [x, y, width, height] = values;
      if (
        values.length !== 4 ||
        values.some((value) => !Number.isFinite(value)) ||
        x < 0 ||
        y < 0 ||
        width <= 0 ||
        height <= 0 ||
        x + width > 1 ||
        y + height > 1
      ) {
        throw new Error("--crop expects normalized x,y,width,height values fully inside 0..1");
      }
      args.crop = { x, y, width, height };
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!args.check && !args.all && !args.slug) {
    throw new Error("Pass --slug <paper-slug>, --all, or --check");
  }
  if (args.pdf && !args.slug) {
    throw new Error("--pdf requires --slug");
  }
  return args;
}

async function requireCommand(command, installHint) {
  try {
    await execFile("sh", ["-c", `command -v ${command}`]);
  } catch {
    throw new Error(`Missing ${command}. ${installHint}`);
  }
}

async function listPaperFiles() {
  const entries = await readdir(contentDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => ({
      slug: entry.name.slice(0, -3),
      filePath: path.join(contentDir, entry.name),
    }));
}

async function downloadPdf(url, destination) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": "MyBlog paper enrichment/1.0 (+https://github.com/Yuki-zik/myblog)" },
  });
  if (!response.ok) {
    throw new Error(`PDF download failed with HTTP ${response.status}: ${url}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > 100 * 1024 * 1024) {
    throw new Error("PDF exceeds the 100 MiB safety limit");
  }
  if (bytes.subarray(0, 5).toString() !== "%PDF-") {
    throw new Error(`Source did not return a PDF: ${url}`);
  }
  await writeFile(destination, bytes);
}

async function resolvePdfSource(paper, markdown, args, tempDir) {
  if (args.pdf) {
    const explicit = path.resolve(root, args.pdf);
    if (!(await fileExists(explicit))) throw new Error(`PDF not found: ${explicit}`);
    return { kind: "explicit-local", path: explicit, reference: relativeToRoot(root, explicit) };
  }

  const local = path.join(localSourceDir, `${paper.slug}.pdf`);
  if (await fileExists(local)) {
    return { kind: "local", path: local, reference: relativeToRoot(root, local) };
  }

  const publicUrl = parsePdfResource(markdown);
  if (publicUrl) {
    const downloaded = path.join(tempDir, `${paper.slug}.pdf`);
    await downloadPdf(publicUrl, downloaded);
    return { kind: "public-url", path: downloaded, reference: publicUrl };
  }

  return null;
}

function selectCandidate(candidates, args, pages) {
  if (!args.figurePage) return candidates[0] ?? null;
  const detected = candidates.find((candidate) => candidate.page === args.figurePage);
  if (detected) return detected;

  const page = pages[args.figurePage - 1];
  if (!page) throw new Error(`--figure-page ${args.figurePage} is outside the PDF page range`);
  return {
    page: args.figurePage,
    caption: `Method figure manually selected from page ${args.figurePage}.`,
    score: 0,
    pageWidth: page.width,
    pageHeight: page.height,
    captionBox: {
      xMin: page.width * 0.05,
      yMin: page.height * 0.94,
      xMax: page.width * 0.95,
      yMax: page.height * 0.96,
    },
    figureTop: page.height * 0.08,
    manual: true,
  };
}

async function renderCover(pdfPath, candidate, crop, outputPath, tempDir) {
  const pageBase = path.join(tempDir, "pipeline-page");
  await execFile("pdftoppm", [
    "-f",
    String(candidate.page),
    "-l",
    String(candidate.page),
    "-singlefile",
    "-png",
    "-r",
    "180",
    pdfPath,
    pageBase,
  ]);

  const pageImage = `${pageBase}.png`;
  const image = sharp(pageImage);
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) throw new Error("Rendered PDF page has no dimensions");

  const left = Math.max(0, Math.round(crop.x * metadata.width));
  const top = Math.max(0, Math.round(crop.y * metadata.height));
  const width = Math.min(metadata.width - left, Math.round(crop.width * metadata.width));
  const height = Math.min(metadata.height - top, Math.round(crop.height * metadata.height));
  if (width < 64 || height < 64) throw new Error("Detected figure crop is too small");

  await sharp(pageImage)
    .extract({ left, top, width, height })
    .resize(1600, 900, {
      fit: "contain",
      background: { r: 247, g: 247, b: 245, alpha: 1 },
    })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}

async function analyzePaper(paper, args) {
  const markdown = await readFile(paper.filePath, "utf8");
  const title = parsePaperTitle(markdown);
  const tempDir = await mkdtemp(path.join(os.tmpdir(), `myblog-paper-${paper.slug}-`));

  try {
    const source = await resolvePdfSource(paper, markdown, args, tempDir);
    if (!source) {
      return {
        slug: paper.slug,
        title,
        status: "skipped",
        reason: `No legal PDF source. Add ${relativeToRoot(root, path.join(localSourceDir, `${paper.slug}.pdf`))} or a resources[type=pdf] URL.`,
      };
    }

    const textPath = path.join(tempDir, "paper.txt");
    const bboxPath = path.join(tempDir, "paper-bbox.xml");
    await execFile("pdftotext", ["-layout", source.path, textPath]);
    await execFile("pdftotext", ["-bbox-layout", source.path, bboxPath]);

    const [text, bboxXml, sourceSha256] = await Promise.all([
      readFile(textPath, "utf8"),
      readFile(bboxPath, "utf8"),
      sha256File(source.path),
    ]);
    const pages = parseBboxLayout(bboxXml);
    const sections = extractPaperSections(text);
    const candidates = rankFigureCandidates(pages);
    sections.overview = extractOverviewFromLayout(pages, candidates) || sections.overview;
    const candidate = selectCandidate(candidates, args, pages);
    const report = {
      version: PIPELINE_VERSION,
      slug: paper.slug,
      title,
      source: { kind: source.kind, reference: source.reference, sha256: sourceSha256 },
      extracted: sections,
      candidates: candidates.slice(0, 8),
      selected: candidate,
    };

    await mkdir(reportDir, { recursive: true });
    const reportPath = path.join(reportDir, `${paper.slug}.json`);
    await writeJson(reportPath, report);

    if (!candidate) {
      return {
        slug: paper.slug,
        title,
        status: "candidate-needed",
        reason: "No Figure caption was detected.",
        reportPath: relativeToRoot(root, reportPath),
      };
    }
    if (!args.apply) {
      return {
        slug: paper.slug,
        title,
        status: "analyzed",
        score: candidate.score,
        caption: candidate.caption,
        reportPath: relativeToRoot(root, reportPath),
      };
    }
    if (candidate.score < AUTO_APPLY_SCORE && !args.force && !args.figurePage) {
      return {
        slug: paper.slug,
        title,
        status: "review-needed",
        score: candidate.score,
        reason: `Best figure score ${candidate.score} is below auto-apply threshold ${AUTO_APPLY_SCORE}.`,
        reportPath: relativeToRoot(root, reportPath),
      };
    }

    const crop = args.crop ?? computeFigureCrop(candidate);
    await mkdir(coverDir, { recursive: true });
    await mkdir(manifestDir, { recursive: true });
    const filename = `${paper.slug}-pipeline.png`;
    const outputPath = path.join(coverDir, filename);
    await renderCover(source.path, candidate, crop, outputPath, tempDir);
    const coverSha256 = await sha256File(outputPath);
    const alt = `论文方法流程图：${candidate.caption}`;
    const nextMarkdown = upsertGeneratedCoverBlock(markdown, {
      filename,
      alt,
      caption: candidate.caption,
      page: candidate.page,
    });
    await writeFile(paper.filePath, nextMarkdown, "utf8");

    const manifestPath = path.join(manifestDir, `${paper.slug}.json`);
    await writeJson(manifestPath, {
      version: PIPELINE_VERSION,
      slug: paper.slug,
      source: { kind: source.kind, reference: source.reference, sha256: sourceSha256 },
      overview: {
        abstractSha256: createHash("sha256").update(sections.abstract).digest("hex"),
        overviewSha256: createHash("sha256").update(sections.overview).digest("hex"),
        localReport: relativeToRoot(root, reportPath),
      },
      figure: {
        page: candidate.page,
        caption: candidate.caption,
        score: candidate.score,
        crop,
      },
      cover: {
        path: relativeToRoot(root, outputPath),
        sha256: coverSha256,
      },
    });

    return {
      slug: paper.slug,
      title,
      status: "applied",
      score: candidate.score,
      outputPath: relativeToRoot(root, outputPath),
      manifestPath: relativeToRoot(root, manifestPath),
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function checkGeneratedOutputs() {
  await mkdir(manifestDir, { recursive: true });
  const entries = await readdir(manifestDir, { withFileTypes: true });
  const failures = [];

  for (const entry of entries.filter((item) => item.isFile() && item.name.endsWith(".json"))) {
    const manifestPath = path.join(manifestDir, entry.name);
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    const coverPath = path.join(root, manifest.cover.path);
    if (!(await fileExists(coverPath))) {
      failures.push(`${entry.name}: missing ${manifest.cover.path}`);
      continue;
    }
    const actualHash = await sha256File(coverPath);
    if (actualHash !== manifest.cover.sha256) {
      failures.push(`${entry.name}: cover hash does not match provenance manifest`);
    }
    const paperPath = path.join(contentDir, `${manifest.slug}.md`);
    if (!(await fileExists(paperPath))) {
      failures.push(`${entry.name}: paper Markdown is missing`);
      continue;
    }
    const markdown = await readFile(paperPath, "utf8");
    if (!markdown.includes(path.basename(coverPath))) {
      failures.push(`${entry.name}: paper frontmatter does not reference generated cover`);
    }
  }

  if (failures.length) {
    throw new Error(`Generated paper assets are stale:\n- ${failures.join("\n- ")}`);
  }
  return entries.length;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.check) {
    const count = await checkGeneratedOutputs();
    console.log(`Paper automation check passed (${count} generated manifest${count === 1 ? "" : "s"}).`);
    return;
  }

  await Promise.all([
    requireCommand("pdftotext", "Install Poppler (macOS: brew install poppler)."),
    requireCommand("pdftoppm", "Install Poppler (macOS: brew install poppler)."),
  ]);

  const papers = await listPaperFiles();
  const selected = args.all ? papers : papers.filter((paper) => paper.slug === args.slug);
  if (!selected.length) throw new Error(`Paper not found: ${args.slug}`);

  let failed = false;
  for (const paper of selected) {
    try {
      const result = await analyzePaper(paper, args);
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      failed = true;
      console.error(JSON.stringify({ slug: paper.slug, status: "failed", error: error.message }, null, 2));
    }
  }
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
