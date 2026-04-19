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
  await expect(page.locator('[data-footnote-rail-item="ref-supabase-rls"]')).toBeVisible();
  await expect(page.locator('[data-note-type="reference"]').first()).toBeVisible();
  await expect(page.locator('[data-note-type="note"]').first()).toBeVisible();
  await expect(page.locator('[data-note-type="figure"]')).toHaveCount(1);
  const figureReference = page.locator('[data-linked-note-key-ref="figure:anchor-diagram"]').first();
  await expect(figureReference).toBeVisible();
  await figureReference.hover();
  await expect(page.locator('[data-note-key="figure:anchor-diagram"]')).toHaveClass(/is-linked-hover/);
  await page.locator('[data-note-key="figure:anchor-diagram"] .post-scholar-footnote-number-button').hover();
  await expect
    .poll(async () => (await figureReference.getAttribute("class")) ?? "")
    .toContain("is-linked-hover");
  await figureReference.click();
  await expect(page.locator('[data-note-key="figure:anchor-diagram"]')).toHaveClass(/is-flash/);
  await expect(page.locator('a.tufte-footnote-ref[data-footnote-rail-target="ref-supabase-rls"]').first()).toBeVisible();
  await expect(page.locator('a.tufte-footnote-ref[data-footnote-rail-target="ref-supabase-rls"]').first()).toHaveAttribute("href", /#marginalia-footnote-/);
  await expect(page.locator("[data-tufte-footnotes]")).toHaveCount(0);
  const supabaseReference = page.locator('a.tufte-footnote-ref[data-footnote-rail-target="ref-supabase-rls"]').first();
  await supabaseReference.scrollIntoViewIfNeeded();
  await supabaseReference.hover();
  await expect
    .poll(async () => (await page.locator('[data-footnote-rail-item="ref-supabase-rls"]').getAttribute("class")) ?? "")
    .toContain("is-linked-hover");
  await page.locator('[data-footnote-rail-item="ref-supabase-rls"] .post-scholar-footnote-number-button').hover();
  await expect
    .poll(async () => (await supabaseReference.getAttribute("class")) ?? "")
    .toContain("is-linked-hover");
  await supabaseReference.click();
  await expect(page.locator('[data-footnote-rail-item="ref-supabase-rls"]')).toHaveClass(/is-flash/);
  await expect(page.locator(".waline-comments")).toBeVisible();
  await expect(page.locator(".comment-bubble")).toHaveCount(0);
  await expect(page.locator(".article-comments")).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/posts/paragraph-anchor-design");
  await expect(page.locator(".post-toc-mobile-summary")).toBeVisible();
  await expect(page.locator(".post-scholar-item").first()).toBeVisible();
  await expect(page.locator(".waline-comments")).toBeVisible();
});
