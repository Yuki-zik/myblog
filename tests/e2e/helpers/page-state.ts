import type { Page } from "@playwright/test";

/*
 * Shared waits for measuring a settled page.
 *
 * These live here rather than inside a single spec because more than one suite
 * now measures geometry after a scroll, and a second copy of this logic would
 * drift from the first. Playwright only collects `*.spec.ts`, so this module is
 * not picked up as a test file.
 */

/*
 * Wait until the page has stopped scrolling.
 *
 * Assertions that measure where an element landed after a smooth scroll cannot
 * use a fixed delay: it passes on an idle machine and catches a mid-flight
 * frame on a loaded one. This waits for the actual end state instead, so
 * assertions keep their thresholds without depending on how fast the animation
 * happens to run.
 *
 * Stability is measured in wall-clock time rather than in animation frames, and
 * a minimum wait is enforced before any quiet period counts.
 *
 * `window.scrollTo({ behavior: "smooth" })` does not begin moving on the next
 * frame — measured on this suite it can idle for 120-300ms first, and under
 * load that gap grows past 400ms. Any implementation that only looks for "the
 * position stopped changing" treats that dead time as "the scroll has
 * finished" and reports the position from *before* the scroll, which is what
 * made the TOC click assertions intermittently read a stale offset. Requiring a
 * minimum elapsed time before accepting stillness rules that out; the quiet
 * period on top of it then catches the actual end of the movement.
 */
export const SCROLL_QUIET_MS = 400;
export const SCROLL_MIN_WAIT_MS = 500;

export async function waitForScrollSettled(
  page: Page,
  quietMs = SCROLL_QUIET_MS,
  minWaitMs = SCROLL_MIN_WAIT_MS
): Promise<void> {
  await page.waitForFunction(
    ({ quiet, minWait }) => {
      const w = window as typeof window & {
        __scrollSettle?: { y: number; since: number; started: number };
      };
      const y = window.scrollY;
      const now = performance.now();
      let state = w.__scrollSettle;

      if (!state) {
        state = { y, since: now, started: now };
        w.__scrollSettle = state;
        return false;
      }

      if (Math.abs(state.y - y) > 0.5) {
        state.y = y;
        state.since = now;
        return false;
      }

      return now - state.started >= minWait && now - state.since >= quiet;
    },
    { quiet: quietMs, minWait: minWaitMs },
    { timeout: 15_000, polling: "raf" }
  );
  await page.evaluate(() => {
    delete (window as typeof window & { __scrollSettle?: unknown }).__scrollSettle;
  });
}

/*
 * Make programmatic scrolling instant.
 *
 * The site opts into `scroll-behavior: smooth`, so every `window.scrollTo` in a
 * test animates. Tests that only need the viewport to *be* somewhere — rather
 * than to observe the journey — are far more deterministic without it.
 */
export async function disableSmoothScroll(page: Page): Promise<void> {
  await page.addStyleTag({
    content: "html { scroll-behavior: auto !important; }"
  });
}

/*
 * Wait until webfonts have swapped in and the resulting relayout has been
 * applied.
 *
 * The site loads its reading faces from Google Fonts with the default
 * `font-display: swap`, so the first layout uses fallback metrics and the real
 * faces shift text afterwards. Any assertion about text-dependent geometry —
 * column widths, where a floating marginalia note lands — is measuring a
 * transient if it runs before that swap. Thresholds are unchanged; this only
 * ensures they are evaluated against the settled layout a reader actually sees.
 */
export async function waitForFontsSettled(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  });
}

/*
 * Wait for entrance animations to finish.
 *
 * Covers, cards and page chrome fade in with finite CSS animations. Measuring
 * opacity or geometry while one is mid-flight reads a transient — that is how a
 * cover assertion once saw 0.13 instead of the settled 1. Infinite animations
 * (the ambient background orbs) are excluded, since they never finish by
 * design.
 */
export async function waitForEntranceAnimations(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const finite = document.getAnimations().filter((animation) => {
      const iterations = animation.effect?.getTiming().iterations ?? 1;
      return Number.isFinite(iterations);
    });

    await Promise.all(finite.map((animation) => animation.finished.catch(() => undefined)));
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  });
}
