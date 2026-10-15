import { expect, test, type Page } from "@playwright/test";
import { disableSmoothScroll, waitForEntranceAnimations, waitForFontsSettled, waitForScrollSettled } from "./helpers/page-state";

const input = "[data-search-input]";
const dialog = "[data-search-dialog]";
const results = "[data-search-results]";

for (const scheme of ["light", "dark"] as const) {
  test(`mobile selected result summary retains readable contrast in ${scheme}`, async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 700 });
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await mockIndex(page);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-color-scheme", scheme);
    await page.keyboard.press("/");
    await page.locator(input).fill("example");
    const summary = page.locator(`${dialog} [aria-selected=true] .header-search-result-summary`);
    await expect(summary).toBeVisible();
    const ratio = await summary.evaluate((element) => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d")!;
      const rgba = (color: string) => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        return Array.from(context.getImageData(0, 0, 1, 1).data);
      };
      const blend = (foreground: number[], background: number[]) => foreground.slice(0, 3)
        .map((value, index) => value * foreground[3] / 255 + background[index] * (1 - foreground[3] / 255));
      const luminance = (rgb: number[]) => rgb.map((value) => {
        const component = value / 255;
        return component <= 0.04045 ? component / 12.92 : ((component + 0.055) / 1.055) ** 2.4;
      }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
      const ancestors: Element[] = [];
      for (let node: Element | null = element; node; node = node.parentElement) ancestors.unshift(node);
      let background = [255, 255, 255];
      for (const ancestor of ancestors) background = blend(rgba(getComputedStyle(ancestor).backgroundColor), background);
      const foreground = blend(rgba(getComputedStyle(element).color), background);
      const high = Math.max(luminance(foreground), luminance(background));
      const low = Math.min(luminance(foreground), luminance(background));
      return (high + 0.05) / (low + 0.05);
    });
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
}

async function mockIndex(page: Page) {
  await page.route("**/search-index.json", (route) => route.fulfill({
    json: Array.from({ length: 8 }, (_, index) => ({
      type: "post", title: `Search example ${index + 1}`, url: `/posts/example-${index + 1}`,
      summary: "A sufficiently long result summary for checking keyboard navigation in a short viewport.",
      keywords: ["example"],
    })),
  }));
}

test("mobile search occupies an opaque top layer and restores the reading position", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 700 });
  await mockIndex(page);
  await page.goto("/posts/paragraph-anchor-design");
  await disableSmoothScroll(page);
  await waitForFontsSettled(page);
  await waitForEntranceAnimations(page);
  await page.evaluate(() => window.scrollTo(0, 650));
  await waitForScrollSettled(page);
  const scrollY = await page.evaluate(() => window.scrollY);
  await page.keyboard.press("/");
  await expect(page.locator(dialog)).toBeVisible();
  await expect(page.locator(dialog)).toHaveJSProperty("open", true);
  await expect(page.locator(input)).toBeFocused();
  const metrics = await page.locator(dialog).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const close = element.querySelector("[data-search-close]")!.getBoundingClientRect();
    return { modal: element.matches(":modal"), x: rect.x, y: rect.y, width: rect.width,
      height: rect.height, background: getComputedStyle(element).backgroundColor,
      closeWidth: close.width, closeHeight: close.height };
  });
  expect(metrics.modal).toBe(true);
  expect(metrics.x).toBeGreaterThanOrEqual(0);
  expect(metrics.y).toBeGreaterThanOrEqual(0);
  expect(metrics.width).toBeCloseTo(393, 0);
  expect(metrics.height).toBeCloseTo(700, 0);
  expect(metrics.background).not.toBe("rgba(0, 0, 0, 0)");
  expect(metrics.background).not.toMatch(/rgba\([^)]*,\s*0\./);
  expect(metrics.closeWidth).toBeGreaterThanOrEqual(44);
  expect(metrics.closeHeight).toBeGreaterThanOrEqual(44);
  await page.locator(input).fill("example");
  await expect(page.locator(results).locator("li")).toHaveCount(8);
  const inputBox = await page.locator(input).boundingBox();
  const statusBox = await page.locator("[data-search-status]").boundingBox();
  const listBox = await page.locator(results).boundingBox();
  expect(statusBox!.y).toBeGreaterThanOrEqual(inputBox!.y + inputBox!.height);
  expect(listBox!.y).toBeGreaterThanOrEqual(statusBox!.y + statusBox!.height);
  await page.mouse.move(200, 600);
  await page.mouse.wheel(0, 900);
  await page.keyboard.press("Escape");
  await expect(page.locator(dialog)).not.toBeVisible();
  await expect(page.locator("[data-search-trigger]")).toBeFocused();
  await waitForScrollSettled(page);
  expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(scrollY, 0);
});

test("mobile search stays inside the visual viewport when the soft keyboard opens", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 700 });
  await page.addInitScript(() => {
    const viewport = Object.assign(new EventTarget(), {
      width: 393, height: 700, offsetTop: 0, offsetLeft: 0, scale: 1,
    });
    Object.defineProperty(window, "visualViewport", { configurable: true, value: viewport });
  });
  await mockIndex(page);
  await page.goto("/");
  await page.keyboard.press("/");
  await page.locator(input).fill("example");
  await expect(page.locator(results).locator("li")).toHaveCount(8);
  for (let index = 0; index < 7; index++) await page.keyboard.press("ArrowDown");
  await page.evaluate(() => {
    Object.assign(window.visualViewport!, { height: 360, offsetTop: 40 });
    window.visualViewport!.dispatchEvent(new Event("resize"));
  });
  await expect.poll(async () => page.locator(dialog).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const active = element.querySelector("[aria-selected=true]")!.getBoundingClientRect();
    return { y: Math.round(rect.y), height: Math.round(rect.height), visible: active.bottom <= rect.bottom && active.top >= rect.top };
  })).toEqual({ y: 40, height: 360, visible: true });
  await expect(page.locator(input)).toBeFocused();
  await page.evaluate(() => {
    Object.assign(window.visualViewport!, { height: 700, offsetTop: 0 });
    window.visualViewport!.dispatchEvent(new Event("resize"));
  });
  await expect.poll(async () => page.locator(dialog).evaluate((element) => Math.round(element.getBoundingClientRect().height))).toBe(700);
});

test("search switches between desktop dropdown and mobile modal without losing the query", async ({ page }) => {
  await mockIndex(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.keyboard.press("/");
  await page.locator(input).fill("example");
  await expect(page.locator(results).locator("li")).toHaveCount(8);
  expect(await page.locator(dialog).evaluate((element) => element.matches(":modal"))).toBe(false);
  await page.setViewportSize({ width: 393, height: 700 });
  await expect(page.locator(dialog)).toHaveJSProperty("open", true);
  expect(await page.locator(dialog).evaluate((element) => element.matches(":modal"))).toBe(true);
  await expect(page.locator(input)).toHaveValue("example");
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator(input)).toBeVisible();
  expect(await page.locator(dialog).evaluate((element) => element.matches(":modal"))).toBe(false);
  await expect(page.locator(input)).toHaveValue("example");
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-search-trigger]")).toBeFocused();
});

test("keyboard result navigation scrolls only the result list", async ({ page }) => {
  await mockIndex(page);
  await page.setViewportSize({ width: 1440, height: 500 });
  await page.goto("/");
  await page.keyboard.press("/");
  await page.locator(input).fill("example");
  await expect(page.locator(results).locator("li")).toHaveCount(8);
  const before = await page.evaluate(() => window.scrollY);
  for (let index = 0; index < 7; index++) await page.keyboard.press("ArrowDown");
  const bounds = await page.locator(results).evaluate((element) => {
    const active = element.querySelector("[aria-selected=true]")!.getBoundingClientRect();
    const list = element.getBoundingClientRect();
    return { top: active.top, bottom: active.bottom, listTop: list.top, listBottom: list.bottom, scrollTop: element.scrollTop };
  });
  expect(bounds.scrollTop).toBeGreaterThan(0);
  expect(bounds.top).toBeGreaterThanOrEqual(bounds.listTop - 1);
  expect(bounds.bottom).toBeLessThanOrEqual(bounds.listBottom + 1);
  expect(await page.evaluate(() => window.scrollY)).toBe(before);
});

test("IME candidate confirmation does not navigate to a search result", async ({ page }) => {
  await mockIndex(page);
  await page.goto("/");
  await page.keyboard.press("/");
  await page.locator(input).fill("example");
  await expect(page.locator(results).locator("li")).toHaveCount(8);
  const before = page.url();
  const retainsDefaultAction = await page.locator(input).evaluate((element) =>
    element.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Enter", bubbles: true, cancelable: true, isComposing: true,
    })),
  );
  expect(retainsDefaultAction).toBe(true);
  expect(page.url()).toBe(before);
  await expect(page.locator(input)).toBeFocused();
});
