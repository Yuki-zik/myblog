import { expect, test } from "@playwright/test";

interface MockCommentRow {
  id: number;
  post_slug: string;
  anchor_id: string;
  body: string;
  tag: "none" | "correction" | "question" | "addition" | "counterexample" | "agree";
  status: "visible" | "hidden" | "pending";
  author_id: string;
  created_at: string;
}

test("段落评论核心路径：匿名提交后刷新仍存在", async ({ page }) => {
  const comments: MockCommentRow[] = [];
  let nextId = 1;
  const userId = "00000000-0000-0000-0000-000000000001";

  await page.route("https://example.supabase.co/**", async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());

    if (method === "OPTIONS") {
      return route.fulfill({ status: 204 });
    }

    if (url.pathname.startsWith("/auth/v1/")) {
      const now = Math.floor(Date.now() / 1000);
      const authPayload = {
        access_token: "mock-access-token",
        token_type: "bearer",
        expires_in: 3600,
        expires_at: now + 3600,
        refresh_token: "mock-refresh-token",
        user: {
          id: userId,
          aud: "authenticated",
          role: "authenticated",
          app_metadata: { provider: "anonymous", providers: ["anonymous"] },
          user_metadata: { is_anonymous: true },
          created_at: new Date().toISOString()
        }
      };

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(authPayload)
      });
    }

    if (url.pathname === "/rest/v1/comments" && method === "GET") {
      const postSlugFilter = url.searchParams.get("post_slug") ?? "";
      const statusFilter = url.searchParams.get("status") ?? "";
      const postSlug = postSlugFilter.replace("eq.", "");
      const status = statusFilter.replace("eq.", "");

      const rows = comments.filter((item) => {
        const postMatches = postSlug ? item.post_slug === postSlug : true;
        const statusMatches = status ? item.status === status : true;
        return postMatches && statusMatches;
      });

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(rows)
      });
    }

    if (url.pathname === "/rest/v1/comments" && method === "POST") {
      const payload = JSON.parse(request.postData() ?? "{}") as Omit<MockCommentRow, "id" | "created_at">;
      const row: MockCommentRow = {
        ...payload,
        id: nextId++,
        created_at: new Date().toISOString()
      };
      comments.push(row);

      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(row)
      });
    }

    return route.fulfill({ status: 404, body: "Not Found" });
  });

  await page.goto("/posts/paragraph-anchor-design");

  const bubbles = page.locator(".comment-bubble");
  await expect(bubbles).toHaveCount(5);
  await expect(bubbles.first()).toContainText("💬 0");

  await bubbles.first().click();
  await page.getByPlaceholder("写下你的短评（最多 200 字）").fill("E2E 评论：段落反馈");
  await page.getByRole("button", { name: "提交短评" }).click();

  await expect(bubbles.first()).toContainText("💬 1");
  await page.reload();
  await expect(bubbles.first()).toContainText("💬 1");
});
