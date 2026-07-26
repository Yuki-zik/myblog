import { defineConfig } from "@playwright/test";

// Retries are enabled on CI only. Locally a failure should surface immediately;
// on a shared/loaded runner the dev server can be slow enough to blow the
// navigation budget, which is an environment symptom rather than a defect.
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  retries: isCI ? 2 : 0,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
    // The dev server compiles routes on first request, so a cold navigation on
    // a busy machine can exceed Playwright's 30s default and fail inside
    // page.goto() rather than at an assertion.
    navigationTimeout: 45_000
  },
  webServer: {
    command: "pnpm dev --port 4173 --host 127.0.0.1",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      PUBLIC_WALINE_SERVER_URL: "https://waline.example",
      SITE_URL: "https://myblog.example"
    }
  }
});
