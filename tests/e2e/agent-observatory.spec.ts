import { test, expect } from "@playwright/test";
import observations from "../../src/data/agent-observatory.json";

test("Agent observatory exposes sources and an honest empty record with usable mobile and dark layouts", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const response = await page.goto("/agents");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Agent 工作观察站", level: 1 })).toBeVisible();
  expect(await page.locator(".agent-observatory-timeline > li").count()).toBeGreaterThan(0);
  await expect(page.locator(".agent-observatory-metrics dd")).toHaveCount(4);
  if (observations.days.length === 0) {
    for (const metric of await page.locator(".agent-observatory-metrics dd").all()) {
      await expect(metric).toHaveText("待记录");
    }
  }
  const firstSource = page.locator(".agent-observatory-timeline details").first();
  await firstSource.locator("summary").click();
  await expect(firstSource.getByRole("link", { name: /阅读原始研究/ })).toBeVisible();
  await expect(firstSource.getByRole("link")).toHaveAttribute("href", /^https:\/\//);

  const template = await page.request.get("/agent-observatory-template.json");
  expect(template.ok()).toBe(true);
  expect(await template.json()).toEqual({ schemaVersion: 1, days: [], tasks: [] });
  await expect(page.getByRole("link", { name: /下载每日记录模板/ })).toHaveAttribute("download", "");

  for (const [width, scheme] of [[1280, "light"], [320, "light"], [320, "dark"]] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.evaluate((color) => document.documentElement.setAttribute("data-color-scheme", color), scheme);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.getByRole("heading", { name: "Agent 工作观察站", level: 1 })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);
    const shot = testInfo.outputPath(`agent-observatory-${width}-${scheme}.png`);
    await page.screenshot({ path: shot, fullPage: true, animations: "disabled" });
    await testInfo.attach(`agent-observatory-${width}-${scheme}`, { path: shot, contentType: "image/png" });
  }
});

test("homepage widget leads to the observation page without adding a header item", async ({ page }, testInfo) => {
  await page.goto("/");
  const widget = page.locator(".agent-observatory-widget");
  await expect(widget).toHaveCount(1);
  await expect(page.locator(".site-nav-links > a")).toHaveCount(6);
  for (const [width, scheme] of [[1280, "light"], [390, "dark"]] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.evaluate((color) => document.documentElement.setAttribute("data-color-scheme", color), scheme);
    await widget.scrollIntoViewIfNeeded();
    const shot = testInfo.outputPath(`agent-widget-home-${width}-${scheme}.png`);
    await page.screenshot({ path: shot, animations: "disabled" });
    await testInfo.attach(`agent-widget-home-${width}-${scheme}`, { path: shot, contentType: "image/png" });
  }
  await widget.getByRole("link", { name: /查看 \d+ 条研究证据与记录方法/ }).click();
  await expect(page).toHaveURL(/\/agents\/?$/);
});
