"use strict";

/**
 * Minimal smoke check for the standalone Waline server unit.
 *
 * This verifies that:
 *  1. `@waline/vercel` is installed and resolvable.
 *  2. `index.cjs` can be required without throwing synchronously.
 *  3. The exported value is a request handler function.
 *  4. The installed PostgreSQL adapter does not log connection URIs or SQL.
 *  5. Anonymous comment query validation accepts valid input and rejects invalid input.
 *
 * It intentionally does NOT touch the Postgres database; the goal is to catch
 * "the deployment unit is structurally broken" issues (bad lockfile, removed
 * dependency, broken entry file) before they reach production.
 *
 * Run with: `node smoke.cjs` from inside `waline-server/`.
 */

const path = require("node:path");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { createRequire } = require("node:module");
const vm = require("node:vm");

async function verifyPrivateDatabaseLogging() {
  let options;
  const sandbox = {
    module: { exports: {} },
    require(name) {
      assert.equal(name, "@waline/vercel");
      return (config) => {
        options = config;
        return () => {};
      };
    },
  };
  vm.runInNewContext(readFileSync(path.join(__dirname, "index.cjs"), "utf8"), sandbox);
  assert.equal(options?.["model.postgresql.logConnect"], false, "disable PostgreSQL DSN logging");
  assert.equal(options?.["model.postgresql.logSql"], false, "disable PostgreSQL SQL-body logging");

  // Exercise the installed config parser and PostgreSQL logger, without loading
  // deployment env or opening a connection. This catches inert config keys.
  const walineRequire = createRequire(require.resolve("@waline/vercel"));
  const thinkRequire = createRequire(walineRequire.resolve("thinkjs"));
  const { getConfigFn } = thinkRequire("think-config");
  const helper = walineRequire("think-helper");
  const Socket = walineRequire("think-model-postgresql/lib/socket");
  const config = getConfigFn({ model: {
    type: "postgresql", common: { logSql: true }, postgresql: {},
  } }, false);
  for (const [key, value] of Object.entries(options)) config(key, value);
  const effective = helper.parseAdapterConfig(config("model"));
  const messages = [];
  const socket = new Socket({
    ...effective,
    host: "127.0.0.1", user: "smoke", password: "smoke-only", database: "smoke",
    logger: (message) => messages.push(message),
  });
  const pool = socket.pool; // pg.Pool is lazy: no connect() call is made.
  try {
    const result = await socket.query({ sql: "SELECT 'smoke-only'", debounce: false }, {
      query(_sql, callback) { callback(null, { rows: [] }); },
      release() {},
    });
    assert.deepEqual(result.rows, []);
    assert.deepEqual(messages, [], "database connection and query must not be logged");
  } finally {
    await pool.end();
  }
}

function verifyCommentQueryValidation() {
  const walineRequire = createRequire(require.resolve("@waline/vercel"));
  const thinkRequire = createRequire(walineRequire.resolve("thinkjs"));
  const logicRequire = createRequire(thinkRequire.resolve("think-logic"));
  const Validator = logicRequire("think-validator");
  const Koa = thinkRequire("koa");
  const context = thinkRequire("./extend/context");
  const sandbox = {
    module: { exports: {} },
    require(name) {
      assert.equal(name, "./base.js");
      return class {};
    },
  };
  vm.runInNewContext(readFileSync(walineRequire.resolve("./src/logic/comment"), "utf8"), sandbox);
  const app = new Koa();
  function validate(changes = {}) {
    const query = new URLSearchParams({
      path: "/posts/paragraph-anchor-design", page: "1", pageSize: "10",
      lang: "zh-CN", sortBy: "insertedAt_desc", ...changes,
    });
    const ctx = app.createContext({ url: `/api/comment?${query}`, method: "GET", headers: {} }, {});
    ctx.param = context.param;
    const logic = new sandbox.module.exports();
    logic.get = () => ctx.param();
    logic.ctx = ctx;
    logic.getAction();
    return new Validator(ctx).validate(logic.rules);
  }
  assert.deepEqual(validate(), {}, "normal anonymous comment query must pass validation");
  for (const [field, value] of [["page", "no"], ["pageSize", "101"], ["sortBy", "unknown"]]) {
    assert.deepEqual(Object.keys(validate({ [field]: value })), [field], `${field} must reject invalid input`);
  }
}

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

async function main() {
  verifyCommentQueryValidation();
  await verifyPrivateDatabaseLogging();
  let entry;
  const capturedErrors = [];
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  const originalStderrWrite = process.stderr.write.bind(process.stderr);

  try {
    console.log = (...args) => {
      capturedErrors.push(args.map((arg) => (arg instanceof Error ? arg.stack || arg.message : String(arg))).join(" "));
      originalConsoleLog(...args);
    };
    console.warn = (...args) => {
      capturedErrors.push(args.map((arg) => (arg instanceof Error ? arg.stack || arg.message : String(arg))).join(" "));
      originalConsoleWarn(...args);
    };
    console.error = (...args) => {
      capturedErrors.push(args.map((arg) => (arg instanceof Error ? arg.stack || arg.message : String(arg))).join(" "));
      originalConsoleError(...args);
    };
    process.stderr.write = (chunk, encoding, callback) => {
      capturedErrors.push(Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk));
      return originalStderrWrite(chunk, encoding, callback);
    };

    entry = require(path.resolve(__dirname, "index.cjs"));
    await new Promise((resolve) => setTimeout(resolve, 500));
  } catch (error) {
    fail("could not require ./index.cjs", error);
  } finally {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    process.stderr.write = originalStderrWrite;
  }

  const runtimeError = capturedErrors.find((message) =>
    /could not locate the bindings file|native binding|error:/i.test(message)
  );
  if (runtimeError) {
    fail("Waline emitted a runtime dependency error while loading ./index.cjs", runtimeError);
  }

  if (typeof entry !== "function") {
    fail(`index.cjs export is not a request handler (got ${typeof entry})`);
  }

  // eslint-disable-next-line no-console
  console.log("[waline-server smoke] OK: handler loads; comment query validation works; PostgreSQL connection/SQL logging is disabled.");
}

void main();
