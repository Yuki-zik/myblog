import { expect, test } from "@playwright/test";

test("English posts can toggle bionic reading without changing article content or links", async ({ page }) => {
  await page.goto("/en/posts/myblog-design-manual");
  const toggle = page.getByRole("button", { name: "Bionic reading" });
  const article = page.locator("[data-post-body]");

  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");

  await page.evaluate(() => {
    const fixture = document.createElement("p");
    fixture.id = "bionic-test-fixture";
    fixture.innerHTML = 'Reading technical research articles with <code>int main()</code> and <a href="#bionic-test-fixture">working links</a>.';
    document.querySelector("[data-post-body]")?.prepend(fixture);
  });

  const textBefore = await article.textContent();
  const codeBefore = await page.locator("#bionic-test-fixture code").textContent();
  const linkBefore = await page.locator("#bionic-test-fixture a").getAttribute("href");
  const idsBefore = await article.locator("[id]").evaluateAll((nodes) => nodes.map((node) => node.id));

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#bionic-test-fixture .bionic-reading__prefix").first()).toBeVisible();
  await expect(page.locator("#bionic-test-fixture code .bionic-reading__prefix")).toHaveCount(0);
  await expect(page.locator("#bionic-test-fixture a .bionic-reading__prefix")).toHaveCount(0);
  expect(await article.textContent()).toBe(textBefore);
  expect(await page.locator("#bionic-test-fixture code").textContent()).toBe(codeBefore);
  expect(await page.locator("#bionic-test-fixture a").getAttribute("href")).toBe(linkBefore);
  expect(await article.locator("[id]").evaluateAll((nodes) => nodes.map((node) => node.id))).toEqual(idsBefore);

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(article.locator("[data-bionic-fragment]")).toHaveCount(0);
  expect(await article.textContent()).toBe(textBefore);
});

test("English bionic setting persists on reload and is not offered on Chinese articles", async ({ page }) => {
  await page.goto("/en/posts/myblog-design-manual");
  const toggle = page.getByRole("button", { name: "Bionic reading" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-post-body] .bionic-reading__prefix").first()).toBeVisible();

  await page.goto("/posts/myblog-design-manual");
  await expect(page.getByRole("button", { name: "Bionic reading" })).toHaveCount(0);
  await expect(page.locator("[data-post-body] [data-bionic-fragment]")).toHaveCount(0);
});

test("Bionic reading control fits a narrow English article viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/posts/myblog-design-manual");
  const toggle = page.getByRole("button", { name: "Bionic reading" });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
