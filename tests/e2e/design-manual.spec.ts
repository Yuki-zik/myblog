import { expect, test } from "@playwright/test";

async function mockWaline(page: import("@playwright/test").Page) {
  await page.route("https://waline.example/api/comment**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          count: 0,
          data: [],
          pageSize: 10,
          currentPage: 1
        }
      })
    });
  });
}

test("design manual article and /design.md stay in sync", async ({ page, request }) => {
  await mockWaline(page);

  await page.goto("/posts/myblog-design-manual");

  await expect(page.locator(".post-header h1")).toHaveText("MyBlog 的设计说明书");
  await expect(page.locator("[data-toc-link]").first()).toContainText("Overview");
  await expect(page.locator(".waline-comments")).toBeVisible();

  const designSource = await request.get("/design.md");
  expect(designSource.ok()).toBe(true);
  expect(designSource.headers()["content-type"]).toContain("text/markdown");

  const designMarkdown = await designSource.text();
  expect(designMarkdown).toContain('title: MyBlog 的设计说明书');
  expect(designMarkdown).toContain("## Overview（概述）");

  const searchIndexResponse = await request.get("/search-index.json");
  expect(searchIndexResponse.ok()).toBe(true);

  const searchIndex = (await searchIndexResponse.json()) as Array<{ title?: string; url?: string }>;
  expect(searchIndex).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        title: "MyBlog 的设计说明书",
        url: "/posts/myblog-design-manual"
      })
    ])
  );
});

test("design manual spoiler examples reveal correctly without leaking into the toc", async ({ page }) => {
  await mockWaline(page);
  await page.goto("/posts/myblog-design-manual");

  const blockSpoiler = page.locator("[data-spoiler]").first();
  const blockSummary = blockSpoiler.locator("[data-spoiler-summary]");
  const hiddenQuote = blockSpoiler.locator("blockquote");
  const inlineSpoiler = page.locator("[data-spoiler-inline]").first();
  const inlineContent = inlineSpoiler.locator("[data-spoiler-inline-content]");

  await expect(blockSpoiler).not.toHaveAttribute("open", "");
  await expect(hiddenQuote).toBeHidden();
  await expect(inlineSpoiler).toHaveAttribute("aria-pressed", "false");
  await expect(inlineContent).toHaveAttribute("aria-hidden", "true");

  await blockSummary.click();
  await expect(blockSpoiler).toHaveAttribute("open", "");
  await expect(hiddenQuote).toBeVisible();

  await blockSummary.click();
  await expect(blockSpoiler).not.toHaveAttribute("open", "");
  await expect(hiddenQuote).toBeHidden();

  await inlineSpoiler.click();
  await expect(inlineSpoiler).toHaveAttribute("aria-pressed", "true");
  await expect(inlineContent).toHaveAttribute("aria-hidden", "false");

  await inlineSpoiler.press("Enter");
  await expect(inlineSpoiler).toHaveAttribute("aria-pressed", "false");
  await expect(inlineContent).toHaveAttribute("aria-hidden", "true");

  const tocTexts = await page.locator("[data-toc-link]").allTextContents();
  expect(tocTexts.some((text) => text.includes("结局剧透"))).toBe(false);
});

test("design manual toc follows the spoiler section before the heading reaches the header line", async ({ page }) => {
  await mockWaline(page);
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/posts/myblog-design-manual");
  await page.addStyleTag({ content: "html { scroll-behavior: auto !important; }" });

  const headingLocator = page.locator("h3").filter({ hasText: "Spoiler（剧透遮罩）" }).first();
  const absoluteTop = await headingLocator.evaluate((node) => {
    const heading = node as HTMLElement;
    return window.scrollY + heading.getBoundingClientRect().top;
  });
  const targetScrollTop = Math.max(absoluteTop - 269, 0);

  await page.evaluate((top) => {
    window.scrollTo(0, top);
    document.documentElement.scrollTop = top;
    document.body.scrollTop = top;
  }, targetScrollTop);
  await expect
    .poll(async () => page.evaluate(() => window.scrollY), { timeout: 2000 })
    .toBeGreaterThanOrEqual(targetScrollTop - 2);
  await page.waitForTimeout(120);

  const metrics = await page.evaluate(() => {
    const heading = Array.from(document.querySelectorAll("h3")).find((node) =>
      node.textContent?.includes("Spoiler（剧透遮罩）")
    ) as HTMLElement | undefined;

    const activeText =
      document.querySelector("[data-toc-sidebar] [data-toc-link].is-active .toc-sidebar__title")?.textContent?.trim() ??
      null;
    const progress = document.querySelector("[data-toc-progress]");
    const progressStyle = progress ? getComputedStyle(progress) : null;

    return {
      headingTop: heading?.getBoundingClientRect().top ?? null,
      activeText,
      transitionDuration: progressStyle?.transitionDuration ?? "",
      transitionTimingFunction: progressStyle?.transitionTimingFunction ?? ""
    };
  });

  expect(metrics).not.toBeNull();
  expect(metrics?.headingTop).toBeGreaterThan(220);
  expect(metrics?.headingTop).toBeLessThan(320);
  expect(metrics?.activeText).toContain("Spoiler（剧透遮罩）");
  expect(metrics?.transitionDuration).toContain("0.32s");
  expect(metrics?.transitionTimingFunction).toContain("cubic-bezier(0.22, 1, 0.36, 1)");
});
