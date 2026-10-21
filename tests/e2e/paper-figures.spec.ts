import { expect, test } from "@playwright/test";
import { waitForFontsSettled } from "./helpers/page-state";

const routes = ["/author", "/papers", "/papers/duap-multilingual-speech-privacy"];

for (const route of routes) {
  test(`DUAP method figure is complete and keyboard-expandable on ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
    await page.goto(route);
    await waitForFontsSettled(page);
    const figure = page.locator("[data-paper-figure]");
    await expect(figure).toHaveCount(1);
    await expect(figure.locator("figcaption")).toContainText("Fig. 3");
    await expect(figure).not.toContainText("undefined");
    if (route === "/author") await expect(page.locator(".publication-illustrated-overview__lede")).toContainText("Whisper");
    const trigger = figure.locator("[data-image-viewer-trigger]");
    await trigger.scrollIntoViewIfNeeded();
    const geometry = await trigger.locator("img").evaluate(async (image: HTMLImageElement) => {
      await image.decode();
      const box = image.getBoundingClientRect();
      return { width: box.width, ratio: box.width / box.height, border: getComputedStyle(image).borderTopWidth, filter: getComputedStyle(image).filter };
    });
    expect(geometry.width).toBeGreaterThanOrEqual(route === "/author" ? 560 : 440);
    expect(Math.abs(geometry.ratio - 2832 / 1292)).toBeLessThan(.01);
    expect(geometry.border).toBe("0px");
    expect(geometry.filter).toBe("none");
    await trigger.focus();
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const beforeY = await page.evaluate(() => scrollY);
    await page.keyboard.press("Enter");
    const dialog = page.locator("[data-image-viewer]");
    await expect(dialog).toHaveAttribute("open");
    await expect.poll(() => dialog.locator("[data-image-viewer-image]").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(2832);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toHaveAttribute("open");
    await expect(trigger).toBeFocused();
    await expect.poll(() => page.evaluate(saved => Math.abs(scrollY - saved), beforeY)).toBeLessThanOrEqual(1);
    await expect(page.locator("[data-image-viewer]")).toHaveCount(1);
  });

  test(`DUAP figure fits the mobile reading flow on ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route);
    const figure = page.locator("[data-paper-figure]");
    await figure.scrollIntoViewIfNeeded();
    const image = figure.locator("img");
    await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
    expect((await image.boundingBox())!.width).toBeGreaterThanOrEqual(250);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    await figure.locator("a").click();
    await expect(page.locator("[data-image-viewer]")).toHaveAttribute("open");
    await page.getByRole("button", { name: "关闭图片预览" }).click();
    await expect(page.locator("[data-image-viewer]")).not.toHaveAttribute("open");
  });
}

test("paper method artwork retains its original color in dark mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/papers/duap-multilingual-speech-privacy");
  await expect(page.locator("html")).toHaveAttribute("data-color-scheme", "dark");
  expect(await page.locator("[data-paper-figure] img").evaluate(el => getComputedStyle(el).filter)).toBe("none");
  await expect(page.locator("[data-paper-figure] figcaption")).toContainText("语言特征解耦");
});

test("paper figure original remains a usable link without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto("/papers/duap-multilingual-speech-privacy");
  const trigger = page.locator("[data-paper-figure] a");
  const original = await trigger.getAttribute("href");
  expect(original).toMatch(/\.png$/);
  await trigger.click();
  expect(new URL(page.url()).pathname).toBe(original);
  await context.close();
});
