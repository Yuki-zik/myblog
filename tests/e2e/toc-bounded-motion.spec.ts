import { expect, test } from "@playwright/test";
import { disableSmoothScroll, waitForFontsSettled } from "./helpers/page-state";
import { assertBoundedTocFollow } from "./helpers/toc-bounded-follow";

for (const path of ["/posts/myblog-design-manual", "/en/posts/myblog-design-manual"]) {
  test(`bounded TOC follow (chromium): ${path}`, async ({ page }) => {
    await assertBoundedTocFollow(page, path);
  });
}

test("reversing article direction cancels stale TOC following", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 760 });
  await page.goto("/posts/myblog-design-manual");
  await waitForFontsSettled(page);
  await disableSmoothScroll(page);

  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await page.waitForFunction(() => document.querySelector("[data-toc-progress]")?.hasAttribute("data-following"));
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForFunction(() => {
    const body = document.querySelector<HTMLElement>("[data-toc-sidebar-body]");
    const marker = document.querySelector<HTMLElement>("[data-toc-progress]");
    const links = document.querySelectorAll<HTMLElement>("[data-toc-sidebar] [data-toc-link]");
    return !!body && !!marker && body.scrollTop <= 1 &&
      !marker.hasAttribute("data-following") &&
      links[0]?.classList.contains("is-active") && window.scrollY === 0;
  }, undefined, { timeout: 9000 });
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});
