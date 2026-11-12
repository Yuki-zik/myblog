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

test("published paper pages expose exact bibliographic tags and concise Chinese discovery metadata", async ({ page, request }) => {
  await page.goto("/papers/duap-multilingual-speech-privacy");
  await expect(page).toHaveTitle(/面向 Whisper.*DUAP/);
  await expect(page.locator("h1")).toContainText("Disentanglement-Based Universal Adversarial Perturbations");
  await expect(page.locator('meta[name="citation_title"]')).toHaveAttribute(
    "content", /^DUAP: Disentanglement-Based Universal Adversarial Perturbations/
  );
  await expect(page.locator('meta[name="citation_author"]')).toHaveCount(6);
  await expect(page.locator('meta[name="citation_publication_date"]')).toHaveAttribute("content", "2026");
  await expect(page.locator('meta[name="citation_journal_title"]')).toHaveAttribute(
    "content", "IEEE Transactions on Information Forensics and Security"
  );
  await expect(page.locator('meta[name="citation_doi"]')).toHaveAttribute("content", "10.1109/TIFS.2026.3671687");
  const og = page.locator('meta[property="og:image"]');
  await expect(og).toHaveAttribute("content", "https://myblog.example/og/papers/duap-multilingual-speech-privacy.png");
  const image = await request.get("/og/papers/duap-multilingual-speech-privacy.png");
  expect(image.ok()).toBe(true);
  expect(image.headers()["content-type"]).toContain("image/png");
});

test("real publication date is retained in the second paper's scholar metadata", async ({ page }) => {
  await page.goto("/papers/oxicams-carbon-dots-machine-learning");
  await expect(page).toHaveTitle(/双激发碳点.*Anal. Chem./);
  await expect(page.locator('meta[name="citation_publication_date"]')).toHaveAttribute("content", "2025/09/25");
  await expect(page.locator('meta[name="citation_author"]')).toHaveCount(11);
  await expect(page.locator('meta[name="citation_doi"]')).toHaveAttribute("content", "10.1021/acs.analchem.5c03226");
});
