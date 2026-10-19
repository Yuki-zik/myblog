import { expect, test, type Page } from "@playwright/test";
import { waitForEntranceAnimations, waitForFontsSettled } from "./helpers/page-state";

const SECTION_FIRST_POST = "/posts/ant-ai-coding-review";
const PARAGRAPH_FIRST_POST = "/posts/myblog-design-manual";

async function openPost(page: Page, path: string) {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto(path);
  await waitForFontsSettled(page);
  await waitForEntranceAnimations(page);
}

async function entryGap(page: Page) {
  return page.evaluate(() => {
    const titleCard = document.querySelector(".post-title-card");
    const firstBlock = document.querySelector(".post-body--scholarly > :first-child");
    if (!titleCard || !firstBlock) throw new Error("Article entry was not rendered");
    return {
      gap: firstBlock.getBoundingClientRect().top - titleCard.getBoundingClientRect().bottom,
      firstTag: firstBlock.tagName
    };
  });
}

test("the cover is the accessible image-preview trigger without a visible zoom button", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 900 });
  await openPost(page, SECTION_FIRST_POST);

  const cover = page.locator(".post-title-card .post-cover-trigger");
  await expect(cover).toBeVisible();
  await expect(cover).toHaveAttribute("href", /ant-ai-coding-review/);
  await expect(cover).toHaveAttribute("aria-haspopup", "dialog");
  await expect(cover).toHaveAttribute("aria-label", /放大封面/);
  await expect(cover.locator(".post-cover-zoom-hint")).toHaveCount(0);
  expect((await cover.innerText()).trim()).toBe("");

  await cover.click();
  const viewer = page.locator("[data-image-viewer]");
  await expect(viewer).toBeVisible();
  await expect(viewer.locator("[data-image-viewer-image]")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(viewer).toBeHidden();
  await expect(cover).toBeFocused();
});

test("chapter-first articles do not reserve an invisible introduction above their first section", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 900 });
  await openPost(page, SECTION_FIRST_POST);
  const headingFirst = await entryGap(page);
  expect(headingFirst.firstTag).toBe("H2");
  expect(headingFirst.gap).toBeGreaterThanOrEqual(12);
  expect(headingFirst.gap).toBeLessThanOrEqual(48);

  await openPost(page, PARAGRAPH_FIRST_POST);
  const paragraphFirst = await entryGap(page);
  expect(paragraphFirst.firstTag).toBe("P");
  expect(paragraphFirst.gap).toBeGreaterThanOrEqual(44);
  expect(paragraphFirst.gap).toBeLessThanOrEqual(90);
  expect(headingFirst.gap).toBeLessThan(paragraphFirst.gap - 12);
});

test("small screens keep compact section-first spacing and tap-to-preview without a label", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPost(page, SECTION_FIRST_POST);
  const headingFirst = await entryGap(page);
  expect(headingFirst.firstTag).toBe("H2");
  // On mobile, a real collapsible TOC sits between the cover and the body.
  // Preserve that useful content and only eliminate the extra gap after it.
  const gaps = await page.evaluate(() => {
    const title = document.querySelector(".post-title-card")!.getBoundingClientRect();
    const toc = document.querySelector(".post-toc-mobile-container")!.getBoundingClientRect();
    const heading = document.querySelector(".post-body--scholarly > h2:first-child")!.getBoundingClientRect();
    return { headerToToc: toc.top - title.bottom, tocToHeading: heading.top - toc.bottom };
  });
  expect(gaps.headerToToc).toBeGreaterThanOrEqual(8);
  expect(gaps.headerToToc).toBeLessThanOrEqual(40);
  expect(gaps.tocToHeading).toBeGreaterThanOrEqual(0);
  expect(gaps.tocToHeading).toBeLessThanOrEqual(20);
  const cover = page.locator(".post-title-card .post-cover-trigger");
  await expect(cover).toBeVisible();
  await expect(cover.locator(".post-cover-zoom-hint")).toHaveCount(0);
  await cover.click();
  await expect(page.locator("[data-image-viewer]")).toBeVisible();
  await page.getByRole("button", { name: "关闭图片预览" }).click();
  await expect(page.locator("[data-image-viewer]")).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
});
