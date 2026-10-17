import { expect, test, type Locator } from "@playwright/test";

const indexes = [
  { path: "/topics", kind: "topics", records: "[data-drawing-topic]", type: "topic", count: 5 },
  { path: "/topics/knowledge-network", kind: "topic", records: "[data-topic-posts] [data-post-card]", type: "post", count: 3 },
  { path: "/archives", kind: "archives", records: "[data-archive-card]", type: "post", count: 4 },
  { path: "/papers", kind: "papers", records: "[data-paper-card]", type: "paper", count: 2 },
] as const;

type IndexEntry = { type: string; title: string; url: string; keywords: string[] };

async function readPaint(locator: Locator) {
  return locator.evaluate((node) => {
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
    if (!background) throw new Error("Contrast sampling requires an opaque painted ancestor");
    const style = getComputedStyle(node);
    const color = blend(rgba(style.color), background);
    const backgroundLuminance = luminance(background);
    const foregroundLuminance = luminance(color);
    return {
      background,
      ownBackground: rgba(style.backgroundColor),
      color,
      backgroundLuminance,
      contrast: (Math.max(backgroundLuminance, foregroundLuminance) + 0.05) / (Math.min(backgroundLuminance, foregroundLuminance) + 0.05),
    };
  });
}

async function expectReadableOrange(label: Locator) {
  await expect(label).toBeVisible();
  const paint = await readPaint(label);
  expect(paint.color[0]).toBeGreaterThan(paint.color[1]);
  expect(paint.color[1] - paint.color[2]).toBeGreaterThan(30);
  expect(paint.contrast).toBeGreaterThanOrEqual(4.5);
}

for (const scheme of ["light", "dark"] as const) {
  test(`drawing discovery indexes show real records promptly on readable ${scheme} paper`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.addInitScript(() => localStorage.setItem("theme-preference", "system"));
    const index = await (await page.request.get("/search-index.json")).json() as IndexEntry[];

    for (const item of indexes) {
      await page.goto(item.path);
      await expect(page.locator("html")).toHaveAttribute("data-color-scheme", scheme);
      await page.waitForFunction(() => !document.documentElement.classList.contains("theme-transitioning"));
      await expect(page.locator("body")).toHaveAttribute("data-runtime", "discover");
      await expect(page.locator(".site-header")).toHaveAttribute("data-header-variant", "drawing");
      const shell = page.locator(`[data-drawing-index="${item.kind}"]`);
      await expect(shell).toHaveCount(1);
      await expect(shell.locator(".drawing-index-header h1")).toBeVisible();
      const paint = await readPaint(shell);
      expect(paint.ownBackground[3], `${item.path} has its own opaque paper`).toBe(255);
      if (scheme === "light") {
        expect(paint.backgroundLuminance).toBeGreaterThan(0.9);
        expect(Math.max(...paint.background) - Math.min(...paint.background)).toBeLessThan(12);
      } else {
        expect(paint.backgroundLuminance).toBeLessThan(0.12);
      }
      await expectReadableOrange(shell.locator(".drawing-index-kicker").first());

      const records = shell.locator(item.records);
      await expect(records).toHaveCount(item.count);
      await expect(records.first()).toBeVisible();
      expect((await records.first().boundingBox())!.y, `${item.path} first real record`).toBeLessThanOrEqual(440);
      const expected = index.filter((entry) => entry.type === item.type && (item.kind !== "topic" || entry.keywords.includes("knowledge-network")));
      const actual = await records.evaluateAll((nodes) => nodes.map((node) => {
        const link = node.matches("a[href]") ? node : node.querySelector("h3 a[href], .archive-post-link, a[href]");
        return { href: link?.getAttribute("href"), text: node.textContent ?? "" };
      }));
      expect(actual.map((record) => record.href).sort()).toEqual(expected.map((record) => record.url).sort());
      for (const entry of expected) expect(actual.find((record) => record.href === entry.url)?.text).toContain(entry.title);

      if (item.kind === "topic") {
        // A large cover entering the viewport is not sufficient: readers
        // must be able to identify the article without another screenful.
        expect((await records.first().locator("h3").boundingBox())!.y).toBeLessThanOrEqual(560);
        await expect(records.locator('[data-post-cover="card"]')).toHaveCount(item.count);
        await expect(records.first().getByRole("group", { name: "文章元信息", exact: true })).toBeVisible();
      }
      if (item.kind === "archives") {
        const cover = await records.first().locator('[data-post-cover="archive-square"]').boundingBox();
        expect(Math.abs(cover!.width - cover!.height), "archive thumbnail keeps its square shape").toBeLessThan(2);
        await expect(records.locator("[data-archive-date]")).toHaveCount(item.count);
        await expect(records.locator("[data-archive-author]")).toHaveCount(item.count);
      }
      if (item.kind === "papers") {
        await expect(records.locator("[data-paper-status]")).toHaveText(["已发表", "已发表"]);
        await expect(records.locator(".paper-index-row__authors .is-self")).toHaveText(["Qianli Ma", "Qianli Ma"]);
        await expect(records.locator(".paper-index-row__meta")).toContainText(["IEEE TIFS · 2026", "Anal. Chem. · 2025"]);
        for (const doi of ["10.1109/TIFS.2026.3671687", "10.1021/acs.analchem.5c03226", "10.1021/acs.analchem.5c03226.s001"]) {
          await expect(records.locator(`.paper-index-row__resources a[href="https://doi.org/${doi}"]`)).toBeVisible();
        }
      }
    }
  });
}

for (const width of [390, 320]) {
  test(`drawing indexes preserve readable orange labels and all records at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await page.addInitScript(() => localStorage.setItem("theme-preference", "light"));
    for (const item of indexes) {
      await page.goto(item.path);
      const shell = page.locator(`[data-drawing-index="${item.kind}"]`);
      await expect(shell).toBeVisible();
      await expect(shell.locator(item.records)).toHaveCount(item.count);
      await expectReadableOrange(shell.locator(".drawing-index-kicker").first());
      if (item.kind === "archives") {
        const cover = await shell.locator('[data-post-cover="archive-square"]').first().boundingBox();
        expect(Math.abs(cover!.width - cover!.height)).toBeLessThan(2);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), item.path).toBeLessThanOrEqual(0);
    }
  });
}

test("post and scholarly detail readers keep their existing runtime and default header", async ({ page }) => {
  for (const path of ["/posts/paragraph-anchor-design", "/papers/duap-multilingual-speech-privacy"]) {
    await page.goto(path);
    await expect(page.locator("body")).toHaveAttribute("data-runtime", "reading");
    await expect(page.locator(".site-header")).toHaveAttribute("data-header-variant", "default");
    await expect(page.locator("[data-drawing-index]")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});
