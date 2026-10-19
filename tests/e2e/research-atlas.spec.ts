import { expect, test } from "@playwright/test";
import { waitForFontsSettled } from "./helpers/page-state";

for (const width of [1440, 390]) {
  test(`author research folio is substantive, connected, and readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width > 600 ? 960 : 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/author");
    await waitForFontsSettled(page);

    const hero = page.locator("[data-discover-hero]");
    await expect(hero).toBeVisible();
    await expect(hero.getByRole("heading", { level: 1, name: /A-Znk/ })).toHaveCount(1);
    await expect(hero.locator(".author-atlas-hero__statement")).toBeVisible();
    // The emphasized Chinese sentence must not leave a two-character orphan line.
    // Latin ch-based widths previously made it wrap despite sufficient column space.
    const statementLines = await hero.locator(".author-atlas-hero__statement em").evaluate(el => {
      const style = getComputedStyle(el);
      return el.getBoundingClientRect().height / Number.parseFloat(style.lineHeight);
    });
    expect(statementLines).toBeLessThanOrEqual(1.1);
    await expect(hero.locator(".author-portrait img")).toBeVisible();
    await expect(hero.getByRole("link", { name: /研究成果/ })).toHaveAttribute("href", "/papers");
    const size = await hero.locator("h1").evaluate(el => Number.parseFloat(getComputedStyle(el).fontSize));
    expect(size).toBeGreaterThan(width > 600 ? 68 : 42);

    await expect(page.locator(".author-atlas-research .discover-entity-card")).toHaveCount(3);
    await expect(page.locator(".author-atlas-publication")).toHaveCount(2);
    await expect(page.locator(".author-atlas-publication__content h3 a").first()).toHaveAttribute("href", /\/papers\/duap-/);
    await expect(page.locator(".author-atlas-practice .discover-stream-item")).toHaveCount(4);
    await expect(page.locator(".author-atlas-focus .discover-mini-card")).toHaveCount(2);
    await expect(page.locator(".author-post-grid .post-card").first()).toBeVisible();
    await expect(page.locator(".author-social-card")).toHaveCount(4);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}

for (const path of ["/topics", "/archives", "/papers", "/topics/ai-coding"]) {
  test(`document index typography keeps a clear hierarchy at ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto(path);
    await expect(page.locator(".drawing-index-header h1")).toBeVisible();
    const px = await page.locator(".drawing-index-header h1").evaluate(el => Number.parseFloat(getComputedStyle(el).fontSize));
    expect(px).toBeGreaterThanOrEqual(54);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}

test("knowledge map shares the ruled atlas entry with working graph exploration", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/map");
  await expect(page.locator(".wander-hero h1")).toHaveText("漫游↗");
  await expect(page.locator(".knowledge-graph .explore-map__node").first()).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole("link", { name: /主题目录/ })).toHaveAttribute("href", "/topics");
});

test("missing page is a navigable illustrated dossier", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  const response = await page.goto("/some-nonexistent-page");
  expect(response?.status()).toBe(404);
  await expect(page.locator(".notfound-atlas__figure")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "页面未找到" })).toBeVisible();
  await expect(page.getByRole("link", { name: /返回首页/ })).toHaveAttribute("href", "/");
  await expect(page.getByRole("link", { name: /浏览主题/ })).toHaveAttribute("href", "/topics");
});
