import { expect, test } from "@playwright/test";
import { SITE_AUTHOR_PROFILE } from "../../src/lib/site";
import { waitForFontsSettled } from "./helpers/page-state";

test("author practice retains real content and offers keyboard-accessible reading context", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/author");
  await waitForFontsSettled(page);
  const projects = page.locator("[data-practice-dossier]");
  await expect(projects).toHaveCount(SITE_AUTHOR_PROFILE.practiceHighlights!.length);
  for (const [index, item] of SITE_AUTHOR_PROFILE.practiceHighlights!.entries()) {
    const project = projects.nth(index);
    await expect(project.getByRole("heading", { level: 3 })).toHaveText(item.title);
    await expect(project.locator(".content-dossier__description")).toHaveText(item.description);
    const context = project.locator("details");
    await expect(context).not.toHaveAttribute("open");
    const trigger = context.locator("summary");
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(context).toHaveAttribute("open");
    await expect(context.locator("a").first()).toBeVisible();
    await expect(context.locator("a").first()).toHaveAttribute("href", /^\//);
    await page.keyboard.press("Space");
    await expect(context).not.toHaveAttribute("open");
  }
});

for (const width of [1440, 390, 320]) {
  test(`author notes preserve all questions, reading width and content order at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 });
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: width === 390 ? "dark" : "light" });
    await page.goto("/author");
    await waitForFontsSettled(page);
    const focus = page.locator(".author-atlas-focus");
    await expect(focus.locator(".content-dossier")).toHaveCount(2);
    if (width < 600) {
      const headingLines = await focus.locator(".discover-section-head h2").evaluate(el => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return new Set([...range.getClientRects()].filter(r => r.width > 0).map(r => Math.round(r.top))).size;
      });
      expect(headingLines, "an empty metadata column must not squeeze the section heading").toBe(1);
    }
    for (const text of [...SITE_AUTHOR_PROFILE.currentFocus!, ...SITE_AUTHOR_PROFILE.blogScope!]) {
      await expect(focus.getByText(text, { exact: true })).toBeVisible();
    }
    const measures = await page.locator("[data-practice-dossier] .content-dossier__description, .author-atlas-focus .content-dossier__items li").evaluateAll(nodes => nodes.map(node => ({
      size: parseFloat(getComputedStyle(node).fontSize),
      width: node.clientWidth,
      overflow: node.scrollWidth - node.clientWidth,
    })));
    for (const measure of measures) {
      expect(measure.size).toBeGreaterThanOrEqual(16);
      expect(measure.width).toBeGreaterThanOrEqual(width < 600 ? 210 : 270);
      expect(measure.overflow).toBeLessThanOrEqual(1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}

test("project context remains available without client JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto("/author#practice");
  const project = page.locator("[data-practice-dossier]").last();
  await project.locator("summary").click();
  const link = project.getByRole("link", { name: "Agent 工程主题" });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/topics\/agent-engineering$/);
  await context.close();
});
