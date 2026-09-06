import { expect, test } from "@playwright/test";
import { waitForEntranceAnimations } from "./helpers/page-state";

test("desktop reading entry prioritizes title and summary before a compact cover", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/posts/paragraph-anchor-design");
  await page.evaluate(() => document.fonts.ready);
  await waitForEntranceAnimations(page);

  const title = page.locator(".post-header h1");
  const summary = page.locator(".post-header-dek");
  const cover = page.locator(".post-title-card .post-cover-img--main");
  const opening = page.locator("[data-post-body] > p[data-anchor]").first();
  await expect(title).toBeInViewport({ ratio: 1 });
  await expect(summary).toBeInViewport({ ratio: 1 });
  await expect(page.locator(".post-header-meta-row")).toBeInViewport({ ratio: 1 });
  await expect(opening).toBeInViewport({ ratio: 0.5 });
  const titleBox = await title.boundingBox();
  const summaryBox = await summary.boundingBox();
  const coverBox = await cover.boundingBox();
  expect(titleBox).not.toBeNull();
  expect(summaryBox).not.toBeNull();
  expect(coverBox).not.toBeNull();
  expect(coverBox!.y).toBeGreaterThan(summaryBox!.y + summaryBox!.height);
  expect(coverBox!.height).toBeLessThanOrEqual(240);
  await expect(page.locator(".post-title-card .post-cover-img--ghost")).toHaveCount(1);
});

const paperTitles = {
  "duap-multilingual-speech-privacy": "DUAP: Disentanglement-Based Universal Adversarial Perturbations for Robust Multilingual Speech Privacy Protection",
  "oxicams-carbon-dots-machine-learning": "Ratiometric Determination and Discrimination of Oxicams via Dual-Excitation Carbon Dots Assisted by Machine Learning"
};

for (const [slug, fullTitle] of Object.entries(paperTitles)) {
  test(`mobile paper entry keeps its complete title and resources in view: ${slug}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/papers/${slug}`);
    await page.evaluate(() => document.fonts.ready);
    const title = page.locator(".paper-dossier__masthead h1");
    await expect(title).toHaveText(fullTitle);
    await expect(title).toBeInViewport({ ratio: 1 });
    await expect(page.locator(".paper-dossier__authors")).toBeInViewport({ ratio: 1 });
    await expect(page.locator(".paper-primary-actions")).toBeInViewport({ ratio: 1 });
    const metrics = await title.evaluate((node) => ({
      fontSize: Number.parseFloat(getComputedStyle(node).fontSize),
      // Glyph ink may extend outside the line box without being clipped.
      overflowY: getComputedStyle(node).overflowY,
      lineClamp: getComputedStyle(node).webkitLineClamp,
      overflow: document.documentElement.scrollWidth - window.innerWidth
    }));
    expect(metrics.fontSize).toBeGreaterThanOrEqual(28);
    expect(metrics.fontSize).toBeLessThanOrEqual(34);
    expect(metrics.overflowY).toBe("visible");
    expect(metrics.lineClamp).toBe("none");
    expect(metrics.overflow).toBeLessThanOrEqual(1);
  });
}
