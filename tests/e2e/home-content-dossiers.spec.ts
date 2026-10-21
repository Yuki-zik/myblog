import { expect, test } from "@playwright/test";
import { waitForFontsSettled } from "./helpers/page-state";

const notes = [
  { slug: "ant-ai-coding-review", title: "蚂蚁 AI Coding 笔试复盘" },
  { slug: "paragraph-anchor-design", title: "段落锚点短评的最小实现" },
  { slug: "why-topic-first", title: "为什么主题页应成为博客第一入口" },
];

test("home note dossiers expose each real cover, summary and original reading destination", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await waitForFontsSettled(page);
  const rows = page.locator("[data-home-recent-item]");
  await expect(rows).toHaveCount(notes.length);

  for (const [index, note] of notes.entries()) {
    const row = rows.nth(index);
    await row.scrollIntoViewIfNeeded();
    await expect(row).toHaveAttribute("href", `/posts/${note.slug}`);
    await expect(row).toHaveClass(/content-dossier/);
    await expect(row.getByRole("heading", { level: 3 })).toHaveText(note.title);
    await expect(row.locator(".home-reference-recent-item__summary")).toBeVisible();
    expect((await row.locator(".home-reference-recent-item__summary").innerText()).length).toBeGreaterThan(16);
    const cover = row.locator("[data-post-cover-manual=true] img:not([aria-hidden])");
    await expect(cover).toHaveCount(1);
    await expect.poll(() => cover.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(row.locator("a")).toHaveCount(0);
  }

  await rows.nth(1).click();
  await expect(page).toHaveURL(/\/posts\/paragraph-anchor-design$/);
});

for (const width of [320, 390, 768]) {
  test(`home note dossiers preserve readable text and complete artwork at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await waitForFontsSettled(page);
    const rows = page.locator("[data-home-recent-item]");
    await rows.first().scrollIntoViewIfNeeded();
    const geometry = await rows.evaluateAll(elements => elements.map(row => {
      const title = row.querySelector<HTMLElement>("h3")!;
      const summary = row.querySelector<HTMLElement>(".home-reference-recent-item__summary")!;
      const cover = row.querySelector<HTMLElement>("[data-post-cover]")!;
      const image = cover.querySelector<HTMLImageElement>("img:not([aria-hidden])")!;
      const box = cover.getBoundingClientRect();
      return {
        titleSize: parseFloat(getComputedStyle(title).fontSize),
        summarySize: parseFloat(getComputedStyle(summary).fontSize),
        summaryOverflow: summary.scrollWidth - summary.clientWidth,
        coverWidth: box.width,
        coverHeight: box.height,
        imageFit: getComputedStyle(image).objectFit,
      };
    }));
    for (const row of geometry) {
      expect(row.titleSize).toBeGreaterThanOrEqual(20);
      expect(row.summarySize).toBeGreaterThanOrEqual(15);
      expect(row.summaryOverflow).toBeLessThanOrEqual(1);
      expect(row.coverWidth).toBeGreaterThanOrEqual(88);
      expect(row.coverHeight).toBeGreaterThanOrEqual(55);
      expect(row.imageFit).toBe("contain");
    }
    if (width < 600) {
      const lastLines = await rows.locator("h3").evaluateAll(titles => titles.map(title => {
        const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
        const lines = new Map<number, string>();
        let node: Node | null;
        while ((node = walker.nextNode())) {
          for (let i = 0; i < (node.textContent?.length ?? 0); i++) {
            const char = node.textContent![i];
            if (!char.trim()) continue;
            const range = document.createRange();
            range.setStart(node, i); range.setEnd(node, i + 1);
            const top = Math.round(range.getBoundingClientRect().top);
            lines.set(top, (lines.get(top) ?? "") + char);
          }
        }
        return [...lines.values()].at(-1) ?? "";
      }));
      for (const last of lastLines) expect(last.length, "a headline must not end in an isolated glyph").toBeGreaterThan(1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}
