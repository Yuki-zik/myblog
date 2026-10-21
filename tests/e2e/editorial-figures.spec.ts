import { expect, test, type Locator, type Page } from "@playwright/test";
import { waitForEntranceAnimations, waitForFontsSettled } from "./helpers/page-state";

const figureSelector = "[data-editorial-figure]";
const triggerSelector = "[data-image-viewer-trigger]";
const routes = ["/author", "/topics"];

async function openFigures(page: Page, path: string) {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto(path);
  await waitForFontsSettled(page);
  await waitForEntranceAnimations(page);
  const figures = page.locator(figureSelector);
  expect(await figures.count(), "the discovery surface should have more than one real plate").toBeGreaterThanOrEqual(2);
  return figures;
}

async function decodeFigure(figure: Locator) {
  await figure.scrollIntoViewIfNeeded();
  const image = figure.locator("img");
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate(el => {
    const img = el as HTMLImageElement;
    return img.complete && img.naturalWidth > 0;
  })).toBe(true);
  await image.evaluate(el => (el as HTMLImageElement).decode());
  return image;
}

for (const path of routes) {
  test(`editorial plates load with visible independent sources and expandable provenance: ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    const figures = await openFigures(page, path);
    for (const figure of await figures.all()) {
      const image = await decodeFigure(figure);
      await expect(image).toHaveAttribute("alt", /\S+/);
      const source = figure.locator("figcaption a[data-editorial-source]");
      await expect(source).toBeVisible();
      await expect(source).toHaveAttribute("href", /^https:\/\//);
      expect(await source.evaluate(el => el.closest("[data-image-viewer-trigger]") === null)).toBe(true);
      const details = figure.locator("details");
      await expect(details).not.toHaveAttribute("open", "");
      await details.locator("summary").click();
      await expect(details).toHaveAttribute("open", "");
      await expect(details.locator("[data-editorial-note]")).toBeVisible();
      await expect(details.locator("[data-editorial-rights]")).toHaveText(/\S+/);
    }
  });

  test(`successive plates use the correct original and restore keyboard focus and scroll: ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    const figures = await openFigures(page, path);
    const sources: string[] = [];
    await expect(page.locator("[data-image-viewer]")).toHaveCount(1);
    for (const index of [0, 1]) {
      const figure = figures.nth(index);
      await decodeFigure(figure);
      const trigger = figure.locator(triggerSelector);
      await trigger.focus();
      const savedY = await page.evaluate(() => window.scrollY);
      const source = await trigger.evaluate(el => (el as HTMLAnchorElement).href);
      const alt = await trigger.getAttribute("data-image-alt");
      sources.push(source);
      await page.keyboard.press("Enter");
      const viewer = page.locator("[data-image-viewer]");
      await expect(viewer).toBeVisible();
      expect(await viewer.evaluate(el => el.matches(":modal"))).toBe(true);
      const image = viewer.locator("[data-image-viewer-image]");
      await expect(image).toBeVisible();
      await expect(image).toHaveAttribute("src", source);
      await expect(image).toHaveAttribute("alt", alt!);
      await image.evaluate(el => (el as HTMLImageElement).decode());
      await expect(viewer.locator("[data-image-viewer-caption]")).toHaveText(alt!);
      await expect(viewer.locator("[data-image-viewer-original]")).toHaveAttribute("href", source);
      await expect(viewer.getByRole("button", { name: "关闭图片预览" })).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(viewer).toBeHidden();
      await expect(trigger).toBeFocused();
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(savedY, 0);
    }
    expect(new Set(sources).size, "the test must exercise distinct originals").toBe(2);
  });

  test(`plates fit a narrow dark screen, keep original image colours and respect reduced motion: ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    const figures = await openFigures(page, path);
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    for (const figure of await figures.all()) {
      const image = await decodeFigure(figure);
      expect(await image.evaluate(el => getComputedStyle(el).objectFit)).toBe("contain");
      expect(await image.evaluate(el => getComputedStyle(el).filter)).toBe("none");
      const trigger = figure.locator(triggerSelector);
      await trigger.focus();
      expect(await trigger.evaluate(el => getComputedStyle(el).transform)).toBe("none");
      const box = (await figure.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(320);
      await figure.locator("summary").click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
    }
  });

  test(`without JavaScript the plate still links directly to its original image: ${path}`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await context.newPage();
    try {
      await page.goto(path);
      const figure = page.locator(figureSelector).first();
      await decodeFigure(figure);
      const trigger = figure.locator(triggerSelector);
      const source = await trigger.evaluate(el => (el as HTMLAnchorElement).href);
      const responsePromise = page.waitForResponse(response => response.url() === source && response.request().isNavigationRequest());
      await trigger.click();
      const response = await responsePromise;
      expect(response.ok()).toBe(true);
      expect(response.headers()["content-type"]).toMatch(/^image\//);
      await expect(page).toHaveURL(source);
    } finally {
      await context.close();
    }
  });
}
