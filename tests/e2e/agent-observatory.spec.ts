import { test, expect } from "@playwright/test";
import observations from "../../src/data/agent-observatory.json" with { type: "json" };

test("each instrument has an independent reversible interaction while measured values stay unchanged", async ({ page }) => {
  await page.goto("/agents");
  const desk = page.locator("[data-agent-instruments]");
  await expect(desk).toHaveAttribute("data-ready", "true");
  const measured = desk.locator(".agent-instrument__value");
  const before = await measured.allTextContents();
  await desk.locator("[data-delivery-next]").click();
  await expect(desk.locator("[data-delivery-index]")).toHaveText("2 / 3");
  await expect(desk.locator("[data-delivery-ticket]:not([hidden])")).toHaveCount(1);
  await desk.locator("[data-delivery-prev]").click();
  await expect(desk.locator("[data-delivery-index]")).toHaveText("1 / 3");
  const ticket = desk.locator("[data-delivery-ticket]:not([hidden])");
  await ticket.locator("summary").click();
  await expect(ticket.locator("details")).toHaveAttribute("open", "");
  await desk.locator('[data-attention-part="review"]').click();
  await expect(desk.locator("[data-attention-output]")).toHaveText("45 分钟");
  await expect(desk.locator('[data-attention-part="review"]')).toHaveAttribute("aria-pressed", "true");
  await expect(desk.locator('[data-attention-part="plan"]')).toHaveAttribute("aria-pressed", "false");
  await desk.locator('[data-attention-part="rework"]').focus();
  await desk.locator('[data-attention-part="rework"]').press("Space");
  await expect(desk.locator("[data-attention-output]")).toHaveText("15 分钟");
  await expect(desk.locator("[data-rework-output]")).toHaveText("15 分钟");
  const rework = desk.locator("[data-rework-scrub]");
  await rework.focus();
  await rework.press("End");
  await expect(desk.locator("[data-rework-output]")).toHaveText("90 分钟");
  await desk.locator("[data-rework-reset]").click();
  await expect(rework).toHaveValue("0");
  await expect(desk.locator("[data-rework-output]")).toHaveText("0 分钟");
  expect(await measured.allTextContents()).toEqual(before);
});

test("compact instruments remain readable in narrow light and dark views and preserve source access", async ({ page }, testInfo) => {
  for (const [width, scheme] of [[1280, "light"], [320, "light"], [390, "dark"]] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.goto("/agents");
    const desk = page.locator("[data-agent-instruments]");
    await expect(desk).toHaveAttribute("data-ready", "true");
    await expect(page.locator("html")).toHaveAttribute("data-color-scheme", scheme);
    await expect(page.getByRole("heading", { name: "Agent 工作观察站", level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
    for (const item of await desk.locator("[data-agent-instrument]").all()) {
      const box = await item.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
    }
    if (!observations.days.length) {
      for (const value of await desk.locator(".agent-instrument__value").all()) await expect(value).toContainText("待记录");
    }
    const sources = page.locator("[data-agent-reference]");
    await expect(sources).not.toHaveAttribute("open", "");
    const shot = testInfo.outputPath(`agent-instruments-${width}-${scheme}.png`);
    await page.screenshot({ path: shot, fullPage: width < 700, animations: "disabled" });
    await testInfo.attach(`agent-instruments-${width}-${scheme}`, { path: shot, contentType: "image/png" });
  }
  await page.locator("[data-agent-reference] > summary").click();
  await expect(page.locator(".agent-observatory-timeline > li")).toHaveCount(6);
  const source = page.locator(".agent-observatory-timeline details").first();
  await source.locator("summary").click();
  await expect(source.getByRole("link", { name: /阅读原始研究/ })).toBeVisible();
  await expect(source.getByRole("link")).toHaveAttribute("href", /^https:\/\//);
  const template = await page.request.get("/agent-observatory-template.json");
  expect(template.ok()).toBe(true);
  expect(await template.json()).toEqual({ schemaVersion: 1, days: [], tasks: [] });
  await expect(page.getByRole("link", { name: /下载每日记录模板/ })).toHaveAttribute("download", "");
});

test("the homepage keeps only a compact entry and preserves the bilingual navigation", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect(page.locator(".agent-observatory-widget")).toHaveCount(0);
  await expect(page.locator(".site-nav-links > a")).toHaveCount(6);
  const entry = page.locator(".agent-observatory-entry");
  await expect(entry).toHaveCount(1);
  await entry.scrollIntoViewIfNeeded();
  expect((await entry.boundingBox())!.height).toBeLessThanOrEqual(120);
  const shot = testInfo.outputPath("agent-instruments-home-entry-1280-light.png");
  await page.screenshot({ path: shot, animations: "disabled" });
  await testInfo.attach("agent-instruments-home-entry", { path: shot, contentType: "image/png" });
  await entry.click();
  await expect(page).toHaveURL(/\/agents\/?$/);
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator(".agent-observatory-entry")).toHaveCount(1);
  await expect(page.locator(".agent-observatory-entry")).toHaveAttribute("href", "/en/agents");
  await expect(page.locator("[data-agent-instruments]")).toHaveCount(0);
  await expect(page.locator(".site-nav-links > a")).toHaveCount(6);
});

test("without JavaScript measurements and reference disclosures remain readable", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
  const page = await context.newPage();
  await page.goto("/agents");
  await expect(page.locator("[data-agent-instrument]")).toHaveCount(4);
  for (const control of await page.locator("[data-agent-instruments] button, [data-agent-instruments] input").all()) await expect(control).toBeDisabled();
  await expect(page.locator("[data-agent-instruments] noscript")).toBeVisible();
  await page.locator("[data-agent-reference] > summary").click();
  await expect(page.getByRole("heading", { name: "公开研究", exact: true })).toBeVisible();
  const source = page.locator(".agent-observatory-timeline details").first();
  await source.locator("summary").click();
  await expect(source.getByRole("link", { name: /阅读原始研究/ })).toBeVisible();
  await expect(source.getByRole("link")).toHaveAttribute("href", /^https:\/\//);
  await expect(page.getByRole("link", { name: /下载每日记录模板/ })).toBeVisible();
  await context.close();
});
