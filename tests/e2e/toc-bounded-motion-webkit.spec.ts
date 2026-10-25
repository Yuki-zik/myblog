import { test } from "@playwright/test";
import { assertBoundedTocFollow } from "./helpers/toc-bounded-follow";

test.use({ browserName: "webkit" });

for (const path of ["/posts/myblog-design-manual", "/en/posts/myblog-design-manual"]) {
  test(`bounded TOC follow (webkit): ${path}`, async ({ page }) => {
    await assertBoundedTocFollow(page, path);
  });
}
