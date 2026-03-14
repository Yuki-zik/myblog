import { expect, test } from "@playwright/test";

test("scholarly reading page keeps rail interactions and mounts waline comments", async ({ page }) => {
  await page.route("https://waline.example/api/comment**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          count: 0,
          data: [],
          pageSize: 10,
          currentPage: 1,
        },
      }),
    });
  });

  await page.goto("/posts/paragraph-anchor-design");

  await expect(page.locator(".post-reading-toc-rail")).toBeVisible();
  await expect(page.locator("[data-post-scholar-rail]")).toBeVisible();
  expect(await page.locator(".post-scholar-item").count()).toBeGreaterThan(0);
  await expect(page.locator(".post-scholar-item--reference").first()).toBeVisible();
  await expect(page.locator(".post-scholar-item--reference .post-scholar-footnote-number").first()).toHaveText(/\d+/);
  await expect(page.locator(".post-scholar-item--footnote").first()).toBeVisible();
  await expect(page.locator("[data-linked-note-key-ref^='annotation:']").first()).toBeVisible();
  await page.locator("[data-linked-note-key-ref^='annotation:']").first().hover();
  await expect(page.locator("[data-note-key^='annotation:']").first()).toHaveClass(/is-linked-hover/);
  await page.locator("[data-note-key^='annotation:'] .post-scholar-footnote-number-button").first().hover();
  await expect(page.locator("[data-linked-note-key-ref^='annotation:']").first()).toHaveClass(/is-linked-hover/);
  await expect(page.locator(".tufte-footnote-ref").first()).toBeVisible();
  await expect(page.locator(".tufte-footnote-ref").first()).toHaveAttribute("href", /#marginalia-footnote-/);
  await expect(page.locator("[data-tufte-footnotes]")).toHaveCount(0);
  await page.locator(".tufte-footnote-ref").first().hover();
  await expect(page.locator(".post-scholar-item--footnote").first()).toHaveClass(/is-linked-hover/);
  await page.locator(".post-scholar-footnote-number-button").first().hover();
  await expect(page.locator(".tufte-footnote-ref").first()).toHaveClass(/is-linked-hover/);
  await page.locator(".tufte-footnote-ref").first().click();
  await expect(page.locator(".post-scholar-item--footnote").first()).toHaveClass(/is-flash/);
  await expect(page.locator(".waline-comments")).toBeVisible();
  await expect(page.locator("[data-waline-mount] .wl-editor")).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".comment-bubble")).toHaveCount(0);
  await expect(page.locator(".article-comments")).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.locator(".post-reading-toc-summary")).toBeVisible();
  await expect(page.locator(".post-scholar-item").first()).toBeVisible();
  await expect(page.locator(".waline-comments")).toBeVisible();
});
