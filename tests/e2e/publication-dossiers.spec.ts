import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("theme-preference", "light"));
});

test("publication files keep the full record visible and the year ledger intact", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/papers");

  const records = page.locator("[data-paper-card]");
  await expect(records).toHaveCount(2);
  expect(await page.locator("[data-paper-year]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-paper-year")))).toEqual(["2026", "2025"]);
  await expect(records.locator("[data-paper-status]")).toHaveText(["已发表", "已发表"]);
  await expect(records.first().locator(".paper-index-row__authors")).toHaveText("Qianli Ma, Wenjie Zhang, Jiahao Chen, Jiazhen Jia, Rangding Wang, Diqun Yan");
  await expect(records.nth(1).locator(".paper-index-row__authors")).toHaveText("Yihao Zhang, Qianli Ma, Sineng Gao, Xinru Liu, Haoming Xing, Houwen Hu, Linfan Wang, Weihao Li, Ting Zhang, Yafei Hou, Da Chen");

  for (const record of await records.all()) {
    await expect(record.locator("h3")).toBeVisible();
    await expect(record.locator(".paper-index-row__summary")).toBeVisible();
    await expect(record.getByRole("link", { name: "阅读详情", exact: true })).toBeVisible();
    await expect(record.locator("details")).not.toHaveAttribute("open", "");
    const primary = record.locator(".paper-index-row__resources a[target='_blank']").first();
    await expect(primary).toHaveAttribute("href", /^https:\/\/doi\.org\//);
    expect((await primary.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect(await record.locator("h3").evaluate((node) => node.scrollHeight - node.clientHeight)).toBeLessThanOrEqual(1);
    if (await record.locator(".paper-index-row__cover").count() === 0) {
      // An absent optional cover must not leave an empty illustration column.
      const inset = await record.evaluate(el => el.querySelector(".content-dossier__copy")!.getBoundingClientRect().x - el.querySelector(".content-dossier__main")!.getBoundingClientRect().x);
      expect(inset).toBeLessThanOrEqual(1);
    }
  }
});

test("a publication citation opens by keyboard without hiding its authors or resources", async ({ page }) => {
  await page.goto("/papers");
  const record = page.locator("[data-paper-card]").first();
  const citation = record.locator("[data-publication-citation]");
  await expect(citation).toBeHidden();
  const summary = record.locator("details summary");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(citation).toBeVisible();
  await expect(citation).toContainText("21:3703–3718, 2026");
  await expect(record.locator(".paper-index-row__keywords li")).toHaveCount(5);
  await expect(record.getByRole("link", { name: "10.1109/TIFS.2026.3671687", exact: true })).toHaveAttribute("href", "https://doi.org/10.1109/TIFS.2026.3671687");
  await expect(record.locator(".paper-index-row__authors")).toBeVisible();
  await expect(record.getByRole("link", { name: "IEEE Xplore", exact: true })).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(citation).toBeHidden();
  await expect(summary).toBeFocused();
});

for (const width of [320, 390]) {
  test(`publication files retain their long titles and open citations at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/papers");
    const records = page.locator("[data-paper-card]");
    for (const record of await records.all()) {
      await expect(record.locator("h3")).toBeVisible();
      await expect(record.locator(".paper-index-row__authors")).toBeVisible();
      await record.locator("details summary").click();
      await expect(record.locator("[data-publication-citation]")).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
}
