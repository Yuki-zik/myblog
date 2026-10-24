import { test, expect } from "@playwright/test";
import observations from "../../src/data/agent-observatory.json" with { type: "json" };

test("four compact instruments fit the desktop and their controls never replace measured values", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/agents");
  const desk = page.locator("[data-agent-instruments]");
  const instruments = desk.locator("[data-agent-instrument]");
  await expect(instruments).toHaveCount(4);
  await expect(desk).toHaveAttribute("data-ready", "true");
  const box = await desk.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeLessThanOrEqual(620);
  expect(box!.y + box!.height).toBeLessThanOrEqual(900);
  for (const kind of ["parallel", "delivery", "attention", "rework"]) {
    const widget = desk.locator(`[data-agent-instrument="${kind}"]`);
    await expect(widget.locator(".agent-instrument__value")).toHaveCount(1);
    await expect(widget.getByText(/交互示意/).first()).toBeVisible();
  }
  await expect(page.getByText(/示意数值不计入实测/)).toBeVisible();
  const measured = desk.locator(".agent-instrument__value");
  const before = await measured.allTextContents();
  if (!observations.days.length) {
    for (const value of await measured.all()) await expect(value).toContainText("待记录");
  }
  const scrub = desk.locator("[data-parallel-scrub]");
  await expect(scrub).toBeEnabled();
  await scrub.focus();
  await scrub.press("End");
  await expect(desk.locator("[data-parallel-count]")).toHaveText("0");
  await scrub.press("Home");
  await expect(desk.locator("[data-parallel-count]")).toHaveText("1");
  expect(await measured.allTextContents()).toEqual(before);
});
