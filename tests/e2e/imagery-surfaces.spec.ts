import { expect, test } from "@playwright/test";

for (const path of ["/topics/knowledge-network", "/concepts/anchor-id", "/concepts/optimistic-ui", "/papers"]) {
  test(`reference images preserve content and preview behavior on ${path}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(path);
    await expect(page.locator("[data-image-viewer]")).toHaveCount(1);
    const figure = page.locator("[data-editorial-figure]");
    await expect(figure).toHaveCount(1);
    const image = figure.locator("img");
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(async (el: HTMLImageElement) => { await el.decode(); });
    expect(await image.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
    await figure.locator("[data-image-viewer-trigger]").click();
    await expect(page.locator("[data-image-viewer]")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(figure.locator("[data-image-viewer-trigger]")).toBeFocused();
    if (path === "/papers") {
      await expect(page.locator("[data-paper-card]")).toHaveCount(2);
      await expect(page.locator(".paper-index-row__cover")).toHaveCount(0);
      await expect(page.getByRole("complementary", { name: "把计算过程留在纸上" })).toContainText("历史参考图版");
    }
  });
}

test("topic art and topic navigation are independent accessible links", async ({ page }) => {
  await page.goto("/topics");
  const rows = page.locator(".drawing-topic-row--illustrated");
  await expect(rows).toHaveCount(5);
  await expect(page.locator("a a")).toHaveCount(0);
  for (const row of await rows.all()) {
    await expect(row.locator("[data-editorial-figure]")).toHaveCount(1);
    await expect(row.locator("[data-drawing-topic]")).toHaveAttribute("href", /^\/topics\//);
  }
  await rows.first().locator("[data-drawing-topic]").click();
  await expect(page).toHaveURL(/\/topics\/knowledge-network$/);
});
