import { expect, test } from "@playwright/test";

test("reading controls and footnotes expose usable landmarks and descriptions", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("group", { name: "关注领域循环列表" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "首页页脚社交链接" }).getByRole("link")).not.toHaveCount(0);

  await page.goto("/posts/paragraph-anchor-design");
  await expect(page.getByRole("region", { name: "评论", exact: true })).toHaveCount(1);
  const descriptions = await page.locator("[data-post-body] [aria-describedby]").evaluateAll((nodes) =>
    nodes.flatMap((node) => (node.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean))
  );
  expect(descriptions.length).toBeGreaterThan(0);
  for (const id of new Set(descriptions)) {
    await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
    await expect(page.locator(`[id="${id}"]`)).not.toHaveText("");
  }
  await expect.poll(() => page.locator("#reading-progress-bar").evaluate((bar) =>
    !!bar.closest("main, [role='region'], header, footer, aside, nav")
  )).toBe(true);
  await expect(page.locator(".post-reading-toc-rail")).not.toContainText("Footnotes");
});

for (const scheme of ["light", "dark"] as const) {
  test(`small reading labels and footer copy remain legible in system ${scheme}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.addInitScript(() => localStorage.setItem("theme-preference", "system"));
    await page.goto("/posts/paragraph-anchor-design");
    await expect(page.locator("html")).toHaveAttribute("data-color-scheme", scheme);
    const ratios = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext("2d")!;
      const rgba = (color: string) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        return Array.from(ctx.getImageData(0, 0, 1, 1).data);
      };
      const blend = (front: number[], back: number[]) =>
        front.slice(0, 3).map((v, i) => v * front[3] / 255 + back[i] * (1 - front[3] / 255));
      const luminance = (rgb: number[]) => rgb.map((v) => {
        const n = v / 255;
        return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
      }).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
      // Gradient-backed reading pages have a transparent backgroundColor.
      // Start from their paper token, then composite the actual ancestor fills.
      const paper = document.createElement("span");
      paper.style.color = "var(--article-page-bg)";
      document.body.append(paper);
      const pageBackground = rgba(getComputedStyle(paper).color).slice(0, 3);
      paper.remove();
      const selectors = [".post-related-notes-title", ".post-scholar-item-type-tag", ".post-scholar-footnote-body a", ".post-scholar-footnote-number-button", ".post-pager-label", ".home-reference-footer__note", ".home-reference-footer__copy", ".home-reference-footer__quote"];
      return selectors.flatMap((selector) => Array.from(document.querySelectorAll<HTMLElement>(selector)).map((el) => {
        const ancestors: HTMLElement[] = [];
        for (let node: HTMLElement | null = el; node; node = node.parentElement) ancestors.unshift(node);
        let bg = pageBackground;
        for (const node of ancestors) bg = blend(rgba(getComputedStyle(node).backgroundColor), bg);
        const fg = blend(rgba(getComputedStyle(el).color), bg);
        const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
        return { selector, text: el.textContent, ratio: (a + 0.05) / (b + 0.05) };
      }));
    });
    expect(ratios.length).toBeGreaterThan(10);
    for (const entry of ratios) expect(entry.ratio, `${entry.selector}: ${entry.text}`).toBeGreaterThanOrEqual(4.5);
  });
}
