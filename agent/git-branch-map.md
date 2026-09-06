# Git Branch Map

Last updated: 2026-06-03 16:20

## Current Snapshot

- Current worktree: `/Users/a-znk/code/myblog`
- Current branch: `review-fixes`
- Current HEAD: `ffb0cf8 Add smoke test for standalone Waline server`
- Remote: `origin -> https://github.com/Yuki-zik/myblog.git`
- Working tree: dirty; many product, test, config, Waline, and `agent/` files have uncommitted changes.

## Branch Tree

```text
ffb0cf8 (HEAD -> review-fixes, main, origin/main, origin/HEAD)
└─ 6385c30 (origin/review-fixes)
   └─ 4418bb9
      └─ ...
```

## Local Branches

| Branch | Commit | Upstream | Status | Meaning |
|---|---|---|---|---|
| `main` | `ffb0cf8` | `origin/main` | aligned | Local stable branch, now fast-forwarded to remote main. |
| `review-fixes` | `ffb0cf8` | `origin/main` | aligned | Active staged work branch. Its committed base equals `origin/main`; current changes are staged but not committed. |

## Remote Branches

| Remote branch | Commit | Relation |
|---|---|---|
| `origin/main` | `ffb0cf8` | canonical latest remote main |
| `origin/review-fixes` | `6385c30` | behind `origin/main` by 1 commit |

## Ahead / Behind Counts

```text
main...origin/main                 0 ahead / 0 behind
review-fixes...origin/main         0 ahead / 0 behind
review-fixes...origin/review-fixes 1 ahead / 0 behind
origin/review-fixes...origin/main  0 ahead / 1 behind
```

## Practical Rules

- Do not treat `origin/review-fixes` as current; it is stale relative to `origin/main`.
- Do not use plain `git push` until the intended target is clear. `review-fixes` now tracks `origin/main`; with Git's default `push.default=simple`, a plain push from a differently named branch should fail instead of silently updating the old review branch.
- Keep current staged work on `review-fixes` unless intentionally splitting it into smaller branches.
- If the current dirty work should become the review-fixes branch, commit it on `review-fixes`, run verification, then push explicitly:

```bash
git push origin review-fixes:review-fixes
```

- If a new clean feature branch is needed, first commit or stash the dirty work, then branch from `main`.

## Commands Used For Cleanup

```bash
git fetch --prune origin
git branch -f main origin/main
git branch --set-upstream-to=origin/main main
git branch --set-upstream-to=origin/main review-fixes
```
