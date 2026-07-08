import { Buffer } from "node:buffer";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Build-time loader for the CJK font used by the OG image cards.
 *
 * Per the chosen "network-fetch" strategy the font comes from a CDN, but the
 * fetch is made NON-FATAL, memoized, validated and cached:
 *  - pinned to a release tag (Sans2.004) for reproducible card output;
 *  - downloaded once per build, written atomically (tmp → rename);
 *  - validated as a real sfnt (magic + size) before caching AND before reuse,
 *    so a truncated/corrupt cache is never handed to CanvasKit;
 *  - on ANY failure returns `[]`, and the caller then omits the custom font so
 *    astro-og-canvas uses its bundled Latin default (Chinese renders as tofu,
 *    but the build never fails on a CDN hiccup).
 */

const FONT_URL =
  "https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@Sans2.004/Sans/SubsetOTF/SC/NotoSansSC-Regular.otf";
const CACHE_DIR = join(process.cwd(), "node_modules", ".cache", "og-fonts");
const CACHE_FILE = join(CACHE_DIR, "NotoSansSC-Regular.otf");
const MIN_FONT_BYTES = 50_000;

/** CanvasKit-parsed family name for the font above. */
export const OG_CJK_FAMILY = "Noto Sans SC";

/** Cheap sanity check that a buffer is a TrueType/OpenType sfnt of plausible size. */
function looksLikeSfnt(buffer: Buffer): boolean {
  if (buffer.length < MIN_FONT_BYTES) {
    return false;
  }
  const tag = buffer.subarray(0, 4).toString("latin1");
  return (
    tag === "OTTO" || // OpenType with CFF outlines (the Noto subset)
    tag === "true" ||
    tag === "ttcf" ||
    (buffer[0] === 0x00 && buffer[1] === 0x01 && buffer[2] === 0x00 && buffer[3] === 0x00) // TrueType
  );
}

let fontPromise: Promise<string[]> | null = null;

async function readValidCache(): Promise<string[] | null> {
  try {
    const buffer = await readFile(CACHE_FILE);
    return looksLikeSfnt(buffer) ? [CACHE_FILE] : null;
  } catch {
    return null;
  }
}

async function load(): Promise<string[]> {
  const cached = await readValidCache();
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(FONT_URL);
    if (!response.ok) {
      throw new Error(`font fetch failed: ${response.status}`);
    }
    const data = Buffer.from(await response.arrayBuffer());
    if (!looksLikeSfnt(data)) {
      throw new Error(`downloaded font is not a valid sfnt (${data.length} bytes)`);
    }
    await mkdir(CACHE_DIR, { recursive: true });
    const tmp = `${CACHE_FILE}.${process.pid}.tmp`;
    await writeFile(tmp, data);
    await rename(tmp, CACHE_FILE); // atomic publish
    return [CACHE_FILE];
  } catch (error) {
    console.warn(
      "[og] CJK font unavailable — OG cards fall back to the Latin font:",
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

/** Memoized: resolves to the font file path(s) to pass to astro-og-canvas `fonts`. */
export function ensureOgFonts(): Promise<string[]> {
  if (!fontPromise) {
    fontPromise = load();
  }
  return fontPromise;
}
