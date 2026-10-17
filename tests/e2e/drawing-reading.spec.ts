import { expect, test, type Locator, type Page } from "@playwright/test";
import { waitForFontsSettled } from "./helpers/page-state";

const postPath = "/posts/paragraph-anchor-design";
const papers = [
  {
    path: "/papers/duap-multilingual-speech-privacy",
    authors: ["Qianli Ma", "Wenjie Zhang", "Jiahao Chen", "Jiazhen Jia", "Rangding Wang", "Diqun Yan"],
    resources: ["https://doi.org/10.1109/TIFS.2026.3671687"],
  },
  {
    path: "/papers/oxicams-carbon-dots-machine-learning",
    authors: ["Yihao Zhang", "Qianli Ma", "Sineng Gao", "Xinru Liu", "Haoming Xing", "Houwen Hu", "Linfan Wang", "Weihao Li", "Ting Zhang", "Yafei Hou", "Da Chen"],
    resources: ["https://doi.org/10.1021/acs.analchem.5c03226", "https://doi.org/10.1021/acs.analchem.5c03226.s001"],
  },
] as const;

async function openReader(page: Page, path: string, scheme: "light" | "dark", design: "edge" | "metadata") {
  await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
  await page.goto(path);
  await expect(page.locator("html")).toHaveAttribute("data-color-scheme", scheme);
  await expect(page.locator("body")).toHaveAttribute("data-runtime", "reading");
  await expect(page.locator(".site-header")).toHaveAttribute("data-header-variant", "drawing");
  await expect(page.locator(`[data-reading-design="${design}"]`)).toHaveCount(1);
  await page.waitForFunction(() => !document.documentElement.classList.contains("theme-transitioning"));
  await waitForFontsSettled(page);
}

async function readPaint(locator: Locator, pseudo?: string) {
  return locator.evaluate((node, pseudo) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d")!;
    const rgba = (color: string) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      return Array.from(ctx.getImageData(0, 0, 1, 1).data);
    };
    const blend = (front: number[], back: number[]) => front.slice(0, 3).map((v, i) => v * front[3] / 255 + back[i] * (1 - front[3] / 255));
    const luminance = (rgb: number[]) => rgb.map((v) => {
      const n = v / 255;
      return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    const ancestors: Element[] = [];
    for (let el: Element | null = node; el; el = el.parentElement) ancestors.unshift(el);
    let background: number[] | null = null;
    for (const el of ancestors) {
      const paint = rgba(getComputedStyle(el).backgroundColor);
      if (paint[3] === 255) background = paint.slice(0, 3);
      else if (background) background = blend(paint, background);
    }
    if (!background) throw new Error("Reading contrast requires an opaque painted ancestor");
    const style = getComputedStyle(node, pseudo);
    if (pseudo) background = blend(rgba(style.backgroundColor), background);
    const color = blend(rgba(style.color), background);
    const backgroundLuminance = luminance(background);
    const foregroundLuminance = luminance(color);
    return {
      color,
      textFillAlpha: rgba(style.webkitTextFillColor)[3],
      backgroundLuminance,
      backgroundImage: style.backgroundImage,
      boxShadow: style.boxShadow,
      display: style.display,
      contrast: (Math.max(backgroundLuminance, foregroundLuminance) + 0.05) / (Math.min(backgroundLuminance, foregroundLuminance) + 0.05),
    };
  }, pseudo);
}

async function expectOrangeMarker(locator: Locator, pseudo?: string) {
  const paint = await readPaint(locator, pseudo);
  expect(paint.color[0]).toBeGreaterThan(paint.color[1]);
  expect(paint.color[1] - paint.color[2]).toBeGreaterThan(30);
  expect(paint.textFillAlpha).toBeGreaterThan(0);
  expect(paint.contrast).toBeGreaterThanOrEqual(4.5);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("theme-preference", "system"));
});

test("edge article keeps its reading measure on solid paper with legible orange section markers", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  for (const scheme of ["light", "dark"] as const) {
    await openReader(page, postPath, scheme, "edge");
    const paragraph = page.locator(".post-body--scholarly p[data-anchor]").first();
    await expect(paragraph).toBeVisible();
    const measure = await paragraph.evaluate((node) => {
      const style = getComputedStyle(node);
      return { size: parseFloat(style.fontSize), lineHeight: parseFloat(style.lineHeight), width: node.getBoundingClientRect().width };
    });
    expect(measure.size).toBeCloseTo(18.24, 1);
    expect(measure.lineHeight / measure.size).toBeCloseTo(1.88, 2);
    expect(measure.width).toBeGreaterThanOrEqual(700);
    expect(measure.width).toBeLessThanOrEqual(750);
    const paper = await readPaint(paragraph);
    if (scheme === "light") expect(paper.backgroundLuminance).toBeGreaterThan(0.9);
    else expect(paper.backgroundLuminance).toBeLessThan(0.12);
    expect(paper.contrast).toBeGreaterThanOrEqual(4.5);
    expect(await page.locator("body").evaluate((node) => getComputedStyle(node).backgroundImage)).toBe("none");
    const band = await readPaint(page.locator(".post-reading-layout--tri"), "::after");
    // A removed decorative layer does not paint its legacy computed gradient.
    if (band.display !== "none") {
      expect(band.backgroundImage).toBe("none");
      expect(band.boxShadow).toBe("none");
    }
    const section = page.locator(".post-body--scholarly h2").first();
    await expectOrangeMarker(section, "::before");
    // TOC pinning, section following and rail placement stay covered by
    // theme-layout.spec.ts and design-manual.spec.ts on this same article.
    await expect(page.locator("[data-toc-sidebar]")).toBeVisible();
  }
});

test("metadata paper readers keep all authors and resources before the readable main column", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  for (const paper of papers) {
    await openReader(page, paper.path, "light", "metadata");
    const title = page.locator(".paper-dossier__masthead h1");
    const titleSize = await title.evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
    expect(titleSize).toBeGreaterThanOrEqual(36);
    expect(titleSize).toBeLessThanOrEqual(40);
    const authors = page.locator(".paper-dossier__authors");
    await expect(authors.locator(':scope > :not([aria-hidden="true"])')).toHaveText([...paper.authors]);
    const resources = page.locator(".paper-primary-actions");
    for (const href of paper.resources) await expect(resources.locator(`a[href="${href}"]`)).toBeVisible();
    await expect(resources.locator('a[href="#citation"]')).toBeVisible();
    const paragraph = page.locator(".paper-body p").first();
    const measure = await paragraph.evaluate((node) => {
      const style = getComputedStyle(node);
      return { size: parseFloat(style.fontSize), lineHeight: parseFloat(style.lineHeight), width: node.getBoundingClientRect().width, top: node.getBoundingClientRect().top };
    });
    expect(measure.size).toBeCloseTo(18, 1);
    expect(measure.lineHeight / measure.size).toBeCloseTo(1.85, 2);
    expect(measure.width).toBeGreaterThanOrEqual(660);
    expect(measure.width).toBeLessThanOrEqual(700);
    const authorBox = (await authors.boundingBox())!;
    const resourcesBox = (await resources.boundingBox())!;
    expect(authorBox.y + authorBox.height).toBeLessThan(measure.top);
    expect(resourcesBox.y + resourcesBox.height).toBeLessThan(measure.top);
    expect((await readPaint(paragraph)).contrast).toBeGreaterThanOrEqual(4.5);
    await expectOrangeMarker(page.locator(".paper-section-kicker").first());
  }
});

test("inline code and code-block text stay legible on the new paper in both themes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  for (const scheme of ["light", "dark"] as const) {
    await openReader(page, "/posts/myblog-design-manual", scheme, "edge");
    const inline = page.locator(".post-body :not(pre) > code").first();
    await expect(inline).toBeVisible();
    expect((await readPaint(inline)).contrast, `inline code in ${scheme}`).toBeGreaterThanOrEqual(4.5);
    const code = page.locator(".post-body pre code").first();
    await expect(code).toBeVisible();
    expect((await readPaint(code)).contrast, `code block in ${scheme}`).toBeGreaterThanOrEqual(4.5);
    const tokens = page.locator(".post-body pre.astro-code span[style]");
    expect(await tokens.count()).toBeGreaterThan(0);
    for (const token of (await tokens.all()).slice(0, 8)) {
      expect((await readPaint(token)).contrast, `syntax token in ${scheme}`).toBeGreaterThanOrEqual(4.5);
    }
  }
});

for (const scheme of ["light", "dark"] as const) {
  test(`edge and metadata readers avoid page overflow at narrow and tablet widths in ${scheme}`, async ({ page }) => {
    for (const width of [320, 390, 1024]) {
      await page.setViewportSize({ width, height: 844 });
      for (const reader of [
        { path: postPath, design: "edge" },
        { path: papers[1].path, design: "metadata" },
      ] as const) {
        await openReader(page, reader.path, scheme, reader.design);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        if (reader.design === "metadata") {
          const bibtex = page.locator(".paper-bibtex");
          await bibtex.locator("summary").click();
          await expect(bibtex).toHaveAttribute("open", "");
          await expect(bibtex.locator("code")).toContainText("10.1021/acs.analchem.5c03226");
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `${reader.path} at ${width}px`).toBeLessThanOrEqual(0);
        const marker = reader.design === "edge"
          ? page.locator(".post-body--scholarly h2").first()
          : page.locator(".paper-section-kicker").first();
        await expectOrangeMarker(marker, reader.design === "edge" ? "::before" : undefined);
      }
    }
  });
}
