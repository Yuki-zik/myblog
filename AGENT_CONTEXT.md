# Agent Context & Handoff (MyBlog)

Last updated: 2026-02-20 (local session)

## 1) Project Goal

Build a theme-first knowledge blog with paragraph-level short comments:

- Topic pages are the main entrypoint.
- Each paragraph (`<p>`) in posts can be commented.
- Comment data is self-hosted in Supabase with RLS.
- Anonymous visitors can comment via Supabase anonymous auth.
- Keep v1 simple and extensible (future: text-selection comments, moderation flow, graph/backlinks).

## 2) Current Implementation Status

### 2.1 Core app (implemented)

- Framework: Astro + React island
- Routes implemented:
  - `/`
  - `/topics`
  - `/topics/[slug]`
  - `/posts/[slug]`
  - `/concepts/[slug]`
- Content collections implemented in `src/content.config.ts`:
  - `posts`
  - `topics`
  - `concepts`

### 2.2 Paragraph anchor system (implemented)

- Rehype plugin: `src/lib/markdown/rehypeParagraphAnchors.ts`
- Rule:
  - `anchor_id = ${sectionSlug}::p${indexInSection}`
  - Injects:
    - `id="c-${anchor_id}"`
    - `data-anchor="${anchor_id}"`
- Excludes paragraphs inside: `blockquote`, `li`, `table`, `details`, `figcaption`.

### 2.3 Comment system (implemented)

- Supabase client: `src/lib/supabaseClient.ts`
- Comment API: `src/lib/comments/api.ts`
  - `ensureAnonymousSession()`
  - `fetchVisibleComments(postSlug)`
  - `createComment(input)`
- UI component: `src/components/comments/ParagraphComments.tsx`
  - scans `p[data-anchor]`
  - shows paragraph comment count (`N`)
  - expandable thread panel
  - quick tags
  - optimistic update + rollback on failure
  - max length validation
  - warmup anonymous session on load

### 2.4 Supabase schema/RLS (implemented in SQL migration)

- Migration file:
  - `supabase/migrations/20260220_000001_comments.sql`
- Includes:
  - enums `comment_status`, `comment_tag`
  - `public.comments` table
  - length constraint (1..200)
  - indexes
  - RLS enabled
  - policies:
    - read only `visible`
    - insert only `authenticated` with `auth.uid() = author_id`

## 3) Cloud/Deployment Progress

Based on this session:

- GitHub repo created and pushed:
  - `https://github.com/Yuki-zik/myblog`
- Vercel project import completed (user screenshots indicate deployment is live).
- Supabase API key setup discussed and applied.
- User confirmed anonymous user records can now be observed in Supabase Auth Users.

## 4) Required Environment Variables

Frontend/public vars:

- `PUBLIC_SUPABASE_URL` = Supabase Project URL
- `PUBLIC_SUPABASE_ANON_KEY` = Supabase Publishable/anon-equivalent key

Optional:

- `PUBLIC_COMMENTS_REQUIRE_APPROVAL` (`true`/`false`)
- `PUBLIC_COMMENTS_MAX_LEN` (default `200`)

Important:

- Do NOT use `sb_secret_*` key in frontend env vars.

## 5) Validation Status

### 5.1 Local checks (passed in this session)

- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

### 5.2 Manual cloud checks

- Anonymous-auth user creation: confirmed by user.
- Remaining recommended manual checks:
  1. On `/posts/paragraph-anchor-design`, submit comment and refresh (persist check).
  2. Set one comment `status = hidden` in Supabase and verify it is not visible in frontend (RLS behavior check).
  3. Confirm env vars exist for both Production and Preview in Vercel.

## 6) Key Files Index (for new agent)

- Project config:
  - `package.json`
  - `astro.config.mjs`
  - `tsconfig.json`
  - `vitest.config.ts`
  - `playwright.config.ts`
- Content model:
  - `src/content.config.ts`
  - `src/content/posts/*`
  - `src/content/topics/*`
  - `src/content/concepts/*`
- Comment domain:
  - `src/lib/supabaseClient.ts`
  - `src/lib/comments/types.ts`
  - `src/lib/comments/constants.ts`
  - `src/lib/comments/validation.ts`
  - `src/lib/comments/api.ts`
  - `src/components/comments/ParagraphComments.tsx`
- Markdown anchor plugin:
  - `src/lib/markdown/rehypeParagraphAnchors.ts`
- DB migration:
  - `supabase/migrations/20260220_000001_comments.sql`
- Tests:
  - `src/lib/markdown/rehypeParagraphAnchors.test.ts`
  - `src/lib/comments/validation.test.ts`
  - `src/components/comments/ParagraphComments.test.tsx`
  - `tests/e2e/paragraph-comments.spec.ts`

## 7) Suggested Next Tasks (Priority Order)

1. Add lightweight admin moderation workflow (optional):
   - switch default to `pending` via env + DB policy strategy.
2. Add rate-limit / anti-spam minimum safeguards (server-side).
3. Add `updated_at` and moderation audit columns if moderation is planned.
4. Add CI workflow (run `pnpm test` + `pnpm build` on PR).
5. Add production monitoring/logging for comment API failures.

## 8) Notes for Next Agent

- Repository is on `main` tracking `origin/main`; current session added `AGENT_CONTEXT.md` and it may still need commit.
- Avoid introducing server-side secret key usage in client code.
- Keep paragraph anchor contract stable; downstream comment data depends on it.
