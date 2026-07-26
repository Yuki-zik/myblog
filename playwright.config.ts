import { defineConfig } from "@playwright/test";

// Several specs assert mid-transition geometry (cover ghost offsets, TOC
// progress rail position, theme cross-fades). Those are inherently timing
// sensitive under a loaded CI runner, so retry there while keeping local runs
// strict enough to surface real flakiness.
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  retries: isCI ? 2 : 0,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry"
  },
  webServer: {
    command: "pnpm dev --port 4173 --host 127.0.0.1",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    env: {
      PUBLIC_WALINE_SERVER_URL: "https://waline.example",
      SITE_URL: "https://myblog.example"
    }
  }
});
