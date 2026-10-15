import { defineConfig } from "@playwright/test";

// Retries are enabled on CI only. Locally a failure should surface immediately;
// on a shared/loaded runner a navigation can be slow enough to blow the
// budget, which is an environment symptom rather than a defect.
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  workers: 1,
  retries: isCI ? 2 : 0,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
    // Generous because this machine is often heavily loaded; a cold navigation
    // there can exceed Playwright's 30s default and fail inside page.goto()
    // rather than at an assertion.
    navigationTimeout: 45_000
  },
  webServer: {
    /*
     * Serve the production build, not the dev server.
     *
     * These two disagree. On 2026-07-26 the same commit reported 55/55 against
     * `pnpm dev` and 53/55 against `pnpm build` + `pnpm preview`, and the build
     * was right: the dev server compiles routes on demand and serves unbundled
     * CSS, which hides real layout and timing failures. Always build and own
     * this server so a stale preview cannot silently replace the tested build.
     */
    command: "pnpm build && pnpm preview --port 4173 --host 127.0.0.1",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      // Astro 7.2 detects coding agents and otherwise detaches preview. Use
      // its child-process mode so Playwright owns the foreground lifecycle.
      ASTRO_PREVIEW_BACKGROUND: "1",
      PUBLIC_WALINE_SERVER_URL: "https://waline.example",
      SITE_URL: "https://myblog.example"
    }
  }
});
