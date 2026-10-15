import { expect, test } from "@playwright/test";

test("home prioritizes topics and research with a concise introduction", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator(".home-reference-hero");
  await expect(hero.getByRole("link", { name: "按主题探索", exact: true })).toHaveAttribute("href", "/topics");
  await expect(hero.getByRole("link", { name: "论文与研究成果", exact: true })).toHaveAttribute("href", "/papers");
  const intro = await hero.locator(".home-reference-hero__description").innerText();
  expect(intro.length).toBeLessThanOrEqual(130);
  expect(intro.split(/[。！？]/).filter((part) => part.trim()).length).toBeGreaterThanOrEqual(2);
});

test("mobile research signature is natively expandable without hiding the topic entrance", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const disclosure = page.locator("details[data-home-research-signature]");
  await expect(disclosure).toBeVisible();
  await expect(disclosure).not.toHaveAttribute("open", "");
  await expect(disclosure.locator(".home-reference-terminal__body")).not.toBeVisible();
  const heading = page.getByRole("heading", { name: "关注领域", exact: true });
  expect((await heading.boundingBox())!.y).toBeLessThan(844);
  await disclosure.locator("summary").click();
  await expect(disclosure.locator(".home-reference-terminal__body")).toBeVisible();
  await disclosure.locator("summary").press("Enter");
  await expect(disclosure.locator(".home-reference-terminal__body")).not.toBeVisible();
});

for (const scheme of ["light", "dark"] as const) {
  test(`home signature and footer supporting text retain contrast in system ${scheme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.addInitScript(() => localStorage.setItem("theme-preference", "system"));
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-color-scheme", scheme);
    await expect(page.locator(".home-reference-terminal__body").filter({ visible: true })).toHaveCount(1);
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
      const blend = (front: number[], back: number[]) => front.slice(0, 3).map((v, i) => v * front[3] / 255 + back[i] * (1 - front[3] / 255));
      const luminance = (rgb: number[]) => rgb.map((v) => {
        const n = v / 255;
        return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
      }).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
      return [".home-reference-terminal__filename", ".home-reference-terminal__comment", ".home-reference-terminal__meta", ".home-reference-footer__quote"].map((selector) => {
        const el = Array.from(document.querySelectorAll<HTMLElement>(selector)).find((node) => node.getBoundingClientRect().height > 0)!;
        const ancestors: HTMLElement[] = [];
        for (let node: HTMLElement | null = el; node; node = node.parentElement) ancestors.unshift(node);
        let bg = [255, 255, 255];
        for (const node of ancestors) bg = blend(rgba(getComputedStyle(node).backgroundColor), bg);
        const fg = blend(rgba(getComputedStyle(el).color), bg);
        const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
        return { selector, ratio: (a + 0.05) / (b + 0.05) };
      });
    });
    for (const entry of ratios) expect(entry.ratio, entry.selector).toBeGreaterThanOrEqual(4.5);
  });
}
