import { test } from "node:test";
import assert from "node:assert/strict";
import { parseBaiduResult, validateBaiduSite } from "./baidu-utils.mjs";

test("preserves Baidu's verified property string", () => {
  assert.equal(validateBaiduSite("https://a-znk.com"), "https://a-znk.com");
  assert.equal(validateBaiduSite("a-znk.com"), "a-znk.com");
  assert.equal(validateBaiduSite("http://a-znk.com"), "http://a-znk.com");
});

test("blocks unrelated, nested, malformed and blank properties", () => {
  for (const site of ["", "https://other.example", "https://sub.a-znk.com",
    "https://a-znk.com/posts", "https://a-znk.com/?x=1", "javascript:alert(1)"]) {
    assert.throws(() => validateBaiduSite(site));
  }
});

test("checks Baidu's JSON accepted count and quota", () => {
  assert.deepEqual(parseBaiduResult({ success: 2, remain: 98 }, 2), { accepted: 2, remaining: 98 });
  assert.throws(() => parseBaiduResult({ error: 401, message: "site is not verified" }, 1));
  assert.throws(() => parseBaiduResult({ success: 1, remain: 0 }, 2));
  assert.throws(() => parseBaiduResult({ success: 1, not_same_site: ["https://wrong.example"] }, 1));
  assert.throws(() => parseBaiduResult("ok", 1));
});
