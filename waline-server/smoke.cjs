"use strict";

/**
 * Minimal smoke check for the standalone Waline server unit.
 *
 * This verifies that:
 *  1. `@waline/vercel` is installed and resolvable.
 *  2. `index.cjs` can be required without throwing synchronously.
 *  3. The exported value is a request handler function.
 *
 * It intentionally does NOT touch the Postgres database; the goal is to catch
 * "the deployment unit is structurally broken" issues (bad lockfile, removed
 * dependency, broken entry file) before they reach production.
 *
 * Run with: `node smoke.cjs` from inside `waline-server/`.
 */

const path = require("node:path");

function fail(message, error) {
  // eslint-disable-next-line no-console
  console.error(`[waline-server smoke] FAIL: ${message}`);
  if (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
  process.exit(1);
}

// Provide just enough placeholder env so Waline does not abort at module
// construction time. Real values must come from the deployment environment.
process.env.SITE_NAME ||= "MyBlog (smoke)";
process.env.SITE_URL ||= "https://blog.example";
process.env.SERVER_URL ||= "https://comments.example";
process.env.JWT_TOKEN ||= "smoke-only-not-a-real-secret";
process.env.PG_HOST ||= "127.0.0.1";
process.env.PG_PORT ||= "5432";
process.env.PG_DB ||= "postgres";
process.env.PG_USER ||= "smoke";
process.env.PG_PASSWORD ||= "smoke";
process.env.PG_PREFIX ||= "wl_";
process.env.PG_SSL ||= "false";

let entry;
try {
  entry = require(path.resolve(__dirname, "index.cjs"));
} catch (error) {
  fail("could not require ./index.cjs", error);
}

if (typeof entry !== "function") {
  fail(`index.cjs export is not a request handler (got ${typeof entry})`);
}

// eslint-disable-next-line no-console
console.log("[waline-server smoke] OK: index.cjs exports a Waline handler.");
