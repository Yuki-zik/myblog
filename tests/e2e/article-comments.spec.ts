import { expect, test } from "@playwright/test";

interface MockParagraphCommentRow {
  id: number;
  post_slug: string;
  anchor_id: string;
  body: string;
  tag: "none" | "correction" | "question" | "addition" | "counterexample" | "agree";
  status: "visible" | "hidden" | "pending";
  author_id: string;
  created_at: string;
}

interface MockArticleCommentRow {
  id: number;
  post_slug: string;
  body_md: string;
  status: "visible" | "hidden" | "pending";
  author_id: string;
  author_name: string;
  author_email: string | null;
  author_website: string | null;
  auth_provider: string;
  created_at: string;
}

test("article comments render and submit while paragraph comments still exist", async ({ page }) => {
  const paragraphComments: MockParagraphCommentRow[] = [];
  const articleComments: MockArticleCommentRow[] = [];
  let nextParagraphId = 1;
  let nextArticleId = 1;
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
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
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
        })
      });
    }

    if (url.pathname === "/rest/v1/comments" && method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(paragraphComments)
      });
    }

    if (url.pathname === "/rest/v1/comments" && method === "POST") {
      const payload = JSON.parse(request.postData() ?? "{}") as Omit<
        MockParagraphCommentRow,
        "id" | "created_at"
      >;
      const row: MockParagraphCommentRow = {
        ...payload,
        id: nextParagraphId++,
        created_at: new Date().toISOString()
      };
      paragraphComments.push(row);
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(row)
      });
    }

    if (url.pathname === "/rest/v1/article_comments" && method === "GET") {
      const postSlugFilter = url.searchParams.get("post_slug") ?? "";
      const statusFilter = url.searchParams.get("status") ?? "";
      const postSlug = postSlugFilter.replace("eq.", "");
      const status = statusFilter.replace("eq.", "");

      const rows = articleComments.filter((item) => {
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

    if (url.pathname === "/rest/v1/article_comments" && method === "POST") {
      const payload = JSON.parse(request.postData() ?? "{}") as Omit<MockArticleCommentRow, "id" | "created_at">;
      const row: MockArticleCommentRow = {
        ...payload,
        id: nextArticleId++,
        created_at: new Date().toISOString()
      };
      articleComments.push(row);

      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(row)
      });
    }

    return route.fulfill({ status: 404, body: "Not Found" });
  });

  await page.goto("/posts/why-topic-first");

  await expect(page.locator(".comment-bubble").first()).toBeVisible({ timeout: 15000 });
  expect(await page.locator(".comment-bubble").count()).toBeGreaterThan(0);
  await expect(page.locator(".post-article-comments-summary")).toBeVisible();
  await page.locator(".post-article-comments-summary").click();
  await expect(page.locator(".article-comments")).toBeVisible();
  await expect(page.getByText("还没有评论")).toBeVisible();

  await page.getByPlaceholder("昵称 *").fill("Playwright");
  await page.getByPlaceholder("写下你的评论... 支持 Markdown").fill("**E2E** article comment");
  await page.getByRole("button", { name: "发表评论" }).click();

  await expect(page.locator(".article-comment-item")).toHaveCount(1);
  await expect(page.locator(".article-comment-item strong")).toContainText("E2E");

  await page.reload();
  await page.locator(".post-article-comments-summary").click();
  await expect(page.locator(".article-comment-item")).toHaveCount(1);
});
