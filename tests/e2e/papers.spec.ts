import { expect, test } from "@playwright/test";

test("papers index exposes a dedicated research collection", async ({ page }) => {
  await page.goto("/papers");

  await expect(page).toHaveTitle(/论文/);
  await expect(page.locator("h1")).toHaveText("论文与研究成果");
  await expect(page.locator("[data-paper-card]")).toHaveCount(2);
  await expect(page.locator('[data-paper-year="2026"]')).toBeVisible();
  await expect(page.locator('[data-paper-year="2025"]')).toBeVisible();
  await expect(page.locator("[data-paper-status]")).toHaveText(["已发表", "已发表"]);
  await expect(page.locator(".paper-index-row__authors .is-self")).toHaveText([
    "Qianli Ma",
    "Qianli Ma"
  ]);
  await expect(page.locator(".paper-index-row__resources")).toContainText([
    "IEEE Xplore",
    "ACS"
  ]);
  await expect(page.locator('header .site-nav a[href="/papers"]')).toHaveAttribute(
    "aria-current",
    "page"
  );
});

test("paper detail presents scholarly metadata without article-only runtime", async ({ page }) => {
  await page.goto("/papers/duap-multilingual-speech-privacy");

  await expect(page).toHaveTitle(/DUAP/);
  await expect(page.locator("[data-paper-detail]")).toBeVisible();
  await expect(page.locator("[data-paper-citation]")).toContainText("Qianli Ma");
  await expect(page.locator("[data-paper-abstract]")).toContainText("Whisper");
  await expect(page.locator(".paper-primary-actions")).toContainText("IEEE Xplore");
  await expect(page.locator(".paper-bibtex summary")).toHaveText("BibTeX");
  await expect(page.locator("[data-waline-comments]")).toHaveCount(0);
  await expect(page.locator("body")).toHaveAttribute("data-runtime", "reading");

  const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
  expect(jsonLd).toContain("ScholarlyArticle");
});

test("paper pages remain readable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/papers/oxicams-carbon-dots-machine-learning");

  await expect(page.locator("[data-paper-detail]")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
