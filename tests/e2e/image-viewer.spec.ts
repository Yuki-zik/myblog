import { expect, test, type Page } from "@playwright/test";
import { waitForEntranceAnimations, waitForFontsSettled } from "./helpers/page-state";

const triggerSelector = "[data-image-viewer-trigger]";
const dialogSelector = "[data-image-viewer]";

async function openArticle(page: Page, path = "/posts/myblog-design-manual") {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto(path);
  await waitForFontsSettled(page);
  await waitForEntranceAnimations(page);
  await expect(page.locator(triggerSelector)).toHaveCount(1);
}

async function expectLoaded(page: Page) {
  const dialog = page.locator(dialogSelector);
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate(el => el.matches(":modal"))).toBe(true);
  const image = dialog.locator("[data-image-viewer-image]");
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate(el => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0)).toBe(true);
  return { dialog, image };
}

for (const path of ["/posts/myblog-design-manual", "/posts/ant-ai-coding-review"]) {
  test(`cover opens its original image and restores focus and reading position: ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await openArticle(page, path);
    const trigger = page.locator(triggerSelector);
    const href = await trigger.evaluate(el => (el as HTMLAnchorElement).href);
    const thumbWidth = (await trigger.boundingBox())!.width;
    await page.evaluate(() => window.scrollTo({ top: 120, behavior: "instant" }));
    const savedY = await page.evaluate(() => scrollY);
    // The cover's right portion lies over the otherwise empty scholar rail.
    await trigger.click({ position: { x: thumbWidth - 20, y: 100 } });
    const { dialog, image } = await expectLoaded(page);
    await expect(image).toHaveAttribute("src", href);
    expect(await image.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBe(Number(await trigger.getAttribute("data-image-width")));
    expect((await image.boundingBox())!.width).toBeGreaterThan(thumbWidth * 2);
    await expect(dialog.getByRole("button", { name: "关闭图片预览" })).toBeFocused();
    expect(await page.evaluate(() => getComputedStyle(document.body).position)).toBe("fixed");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(savedY, 0);
    expect(await page.evaluate(() => getComputedStyle(document.body).overflowX)).toBe("clip");
    await page.evaluate(() => window.scrollTo({ top: 900, behavior: "instant" }));
    await expect.poll(() => page.locator(".post-reading-toc-rail").evaluate(el => Math.abs(el.getBoundingClientRect().top - parseFloat(getComputedStyle(el).top)))).toBeLessThan(2);
  });
}

test("viewer switches between fit and original size, pans, and resets when reopened", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await openArticle(page);
  await page.locator(triggerSelector).click();
  const { dialog, image } = await expectLoaded(page);
  const viewport = dialog.locator("[data-image-viewer-viewport]");
  const fittedWidth = (await image.boundingBox())!.width;
  await dialog.locator("[data-image-viewer-image-toggle]").click();
  await expect(dialog).toHaveAttribute("data-zoomed", "true");
  await expect(dialog.getByRole("button", { name: "适应窗口", exact: true })).toBeVisible();
  expect((await image.boundingBox())!.width).toBeGreaterThan(fittedWidth);
  expect(await viewport.evaluate(el => el.scrollWidth - el.clientWidth)).toBeGreaterThan(100);
  await expect.poll(() => viewport.evaluate(el => el.scrollLeft)).toBeGreaterThan(100);
  await viewport.evaluate(el => el.scrollTo({ left: 150, top: 40 }));
  await expect.poll(() => viewport.evaluate(el => el.scrollLeft)).toBeGreaterThan(100);
  await dialog.getByRole("button", { name: "适应窗口", exact: true }).click();
  await expect(dialog).toHaveAttribute("data-zoomed", "false");
  expect(await viewport.evaluate(el => el.scrollLeft)).toBe(0);
  await expect(dialog.locator("[data-image-viewer-original]")).toHaveAttribute("target", "_blank");
  await dialog.getByRole("button", { name: "关闭图片预览" }).click();
  await page.locator(triggerSelector).click();
  await expectLoaded(page);
  await expect(dialog).toHaveAttribute("data-zoomed", "false");
  await page.mouse.click(2, 2);
  await expect(dialog).toBeHidden();
});

test("keyboard opening stays modal and does not activate the underlying search shortcut", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await openArticle(page);
  const trigger = page.locator(triggerSelector);
  await trigger.focus();
  await page.keyboard.press("Enter");
  const { dialog } = await expectLoaded(page);
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("/");
  await expect(dialog).toBeVisible();
  await expect(page.locator("[data-header-search]")).not.toHaveClass(/is-open/);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

for (const width of [320, 390]) {
  test(`image viewer fits small screens and rotation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await openArticle(page);
    await page.locator(triggerSelector).click();
    const { dialog, image } = await expectLoaded(page);
    const close = dialog.getByRole("button", { name: "关闭图片预览" });
    await expect(close).toBeInViewport({ ratio: 1 });
    const fits = () => image.evaluate(el => {
      const imageBox = el.getBoundingClientRect();
      const viewportBox = document.querySelector("[data-image-viewer-viewport]")!.getBoundingClientRect();
      return imageBox.width <= viewportBox.width && imageBox.height <= viewportBox.height && imageBox.top >= viewportBox.top && imageBox.left >= viewportBox.left;
    });
    await expect.poll(fits).toBe(true);
    await dialog.locator("[data-image-viewer-toggle]").click();
    await expect.poll(() => dialog.locator("[data-image-viewer-viewport]").evaluate(el => el.scrollLeft)).toBeGreaterThan(100);
    await dialog.locator("[data-image-viewer-toggle]").click();
    await expect.poll(fits).toBe(true);
    await page.setViewportSize({ width: 844, height: 390 });
    await expect.poll(fits).toBe(true);
    await expect(close).toBeInViewport({ ratio: 1 });
    await close.click();
    await expect(dialog).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  });
}

test("image load failure keeps an accessible exit and original-image link", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await openArticle(page);
  const trigger = page.locator(triggerSelector);
  const source = await trigger.evaluate(el => (el as HTMLAnchorElement).href);
  await page.route(source, route => route.abort());
  await trigger.click();
  const dialog = page.locator(dialogSelector);
  await expect(dialog.getByRole("status")).toContainText("加载失败");
  await expect(dialog.locator("[data-image-viewer-original]")).toHaveAttribute("href", source);
  await dialog.getByRole("button", { name: "关闭图片预览" }).click();
  await expect(trigger).toBeFocused();
  await page.unroute(source);
  await trigger.click();
  await expectLoaded(page);
});
