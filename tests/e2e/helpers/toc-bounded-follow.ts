import { expect, type Page } from "@playwright/test";
import { disableSmoothScroll, waitForFontsSettled } from "./page-state";

/** One shared browser contract, run in Chromium and WebKit without duplicating tests. */
export async function assertBoundedTocFollow(page: Page, path: string): Promise<void> {
  await page.setViewportSize({ width: 1440, height: 760 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(path);
  await waitForFontsSettled(page);
  await disableSmoothScroll(page);

  const trace = await page.evaluate(async () => {
    const list = document.querySelector<HTMLElement>("[data-toc-sidebar-body]")!;
    const marker = document.querySelector<HTMLElement>("[data-toc-progress]")!;
    const samples = [list.scrollTop];
    let lastChange = performance.now();
    let hidMarker = false;
    const watch = new MutationObserver(() => {
      if (marker.hasAttribute("data-following")) hidMarker = true;
    });
    watch.observe(marker, { attributes: true, attributeFilter: ["data-following"] });
    list.addEventListener("scroll", () => {
      samples.push(list.scrollTop);
      lastChange = performance.now();
    });

    const docTarget = document.documentElement.scrollHeight;
    window.scrollTo({ top: docTarget, behavior: "instant" });
    const immediate = list.scrollTop;
    await new Promise<void>((resolve) => {
      const started = performance.now();
      function check() {
        const maxScroll = list.scrollHeight - list.clientHeight;
        if ((list.scrollTop >= maxScroll - 1 &&
          performance.now() - lastChange >= 160) ||
          performance.now() - started >= 9000) {
          resolve();
        } else {
          window.setTimeout(check, 45);
        }
      }
      window.setTimeout(check, 45);
    });
    watch.disconnect();

    const links = [...document.querySelectorAll<HTMLElement>("[data-toc-sidebar] [data-toc-link]")];
    return {
      samples,
      immediate,
      hidMarker,
      markerVisibleAfter: !marker.hasAttribute("data-following"),
      selected: document.querySelector<HTMLElement>("[data-toc-sidebar] [data-toc-link].is-active")?.dataset.targetId,
      last: links.at(-1)?.dataset.targetId,
      docScroll: window.scrollY,
    };
  });

  const steps = trace.samples.slice(1).map((v, i) => v - trace.samples[i]);
  expect(trace.samples.at(-1)! - trace.samples[0]).toBeGreaterThan(100);
  expect(trace.immediate - trace.samples[0]).toBeLessThan(2);
  expect(Math.max(...steps), "no single rendered scroll step should teleport the list").toBeLessThanOrEqual(26);
  expect(steps.length, "a long jump needs multiple rendered frames").toBeGreaterThan(8);
  expect(trace.hidMarker, "hide the marker instead of teleporting it across the rail").toBe(true);
  expect(trace.markerVisibleAfter).toBe(true);
  expect(trace.selected).toBe(trace.last);
  expect(trace.docScroll).toBeGreaterThan(1000);
}
