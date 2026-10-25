#!/usr/bin/env python3
"""Trusted local translation controller; never execute code fetched from GitHub.

Only public Markdown + the translation manifest enter a temporary workspace.
The pinned local translator receives an empty/read-only, tool-disabled Codex
session. The controller alone can write allowlisted translated files or merge
its own exact PR after all CI gates succeed. No public self-hosted runner.
"""
from __future__ import annotations
import argparse, base64, datetime as dt, fcntl, hashlib, json, os, pathlib
import re, shutil, subprocess, tempfile, time

SOURCE = re.compile(r"^src/content/(posts|papers|topics|concepts)/.+\.md$")
TARGET = re.compile(r"^src/content/en/(posts|papers|topics|concepts)/.+\.md$")
MANIFEST = "src/data/translation-state.json"
REQUIRED_CHECKS = {"Verify (unit / build / waline smoke)", "E2E (Playwright)"}

def allowed_path(value: str) -> bool:
    return bool((TARGET.fullmatch(value) or value == MANIFEST) and ".." not in pathlib.PurePosixPath(value).parts and "\\" not in value)

def input_path(value: str) -> bool:
    return bool((SOURCE.fullmatch(value) or TARGET.fullmatch(value) or value == MANIFEST) and ".." not in pathlib.PurePosixPath(value).parts and "\\" not in value)

def blob_sha(data: bytes) -> str:
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()

def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()

def atomic_json(path: pathlib.Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(".tmp")
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")
    temp.chmod(0o600)
    temp.replace(path)

class Worker:
    def __init__(self, config: dict, state_dir: pathlib.Path):
        self.config = config
        self.state_dir = state_dir
        self.state_file = state_dir / "state.json"
        self.state = json.loads(self.state_file.read_text()) if self.state_file.exists() else {}
        self.repo = config.get("repo", "Yuki-zik/myblog")
        if not re.fullmatch(r"[\w.-]+/[\w.-]+", self.repo):
            raise ValueError("invalid-repository")
        self.gh = config["gh"]

    def gh_command(self, arguments: list[str], *, payload=None, timeout=60, allow_failure=False):
        result = subprocess.run([self.gh, *arguments], input=json.dumps(payload) if payload is not None else None,
            capture_output=True, text=True, timeout=timeout, check=False)
        if result.returncode and not allow_failure:
            raise RuntimeError("github-command-failed:" + arguments[0])
        return result

    def api(self, endpoint: str, payload=None, method=None):
        arguments = ["api", f"repos/{self.repo}/{endpoint}"]
        if payload is not None:
            arguments += ["--method", method or "POST", "--input", "-"]
        elif method:
            arguments += ["--method", method]
        result = self.gh_command(arguments, payload=payload)
        return json.loads(result.stdout) if result.stdout.strip() else {}

    def save(self):
        self.state["checkedAt"] = utc_now()
        atomic_json(self.state_file, self.state)

    def notify_failure(self, code: str, keys=()):
        # One issue per unresolved incident; no article body, provider output or credentials.
        signature = hashlib.sha256((code + json.dumps(list(keys))).encode()).hexdigest()
        if signature == self.state.get("alertSignature"):
            return
        body = ("自动英文同步暂未完成，中文页面继续发布，已有英文保留并标记待同步。\n\n"
                f"错误分类：`{code}`\n涉及内容：" + ", ".join(f"`{key}`" for key in keys) +
                "\n\n本机状态记录：`~/Library/Application Support/A-Znk/blog-english-sync/state.json`。"
                "该通知不代表原文或已发布译文被覆盖。")
        issue = self.state.get("alertIssue")
        if issue:
            try:
                self.api(f"issues/{issue}", {"body": body, "state": "open"}, "PATCH")
            except Exception:
                issue = None
        if not issue:
            issue = self.api("issues", {"title": "[自动翻译] 英文同步需要检查", "body": body})["number"]
        self.state.update(alertSignature=signature, alertIssue=issue)

    def clear_alert(self):
        if self.state.get("alertIssue"):
            self.api(f"issues/{self.state['alertIssue']}", {"state": "closed", "state_reason": "completed"}, "PATCH")
            self.state.pop("alertIssue", None)
            self.state.pop("alertSignature", None)

    def pending(self, current_main: str) -> bool:
        pending = self.state.get("pending")
        if not pending:
            return False
        pr = self.api(f"pulls/{pending['pr']}")
        if pr.get("merged"):
            self.state["lastMerged"] = {"pr": pending["pr"], "sha": pr.get("merge_commit_sha"), "at": utc_now()}
            self.state.pop("pending", None)
            self.state.pop("lastSeen", None)
            self.clear_alert()
            return False
        if pr["state"] != "open":
            self.state.pop("pending", None)
            self.state["pausedSource"] = pending["sourceSha"]
            self.state["status"] = "pr-closed-without-merge"
            return True
        if pr.get("base", {}).get("ref") != "main" or pr.get("base", {}).get("repo", {}).get("full_name", "").lower() != self.repo.lower():
            self.state["status"] = "manual-pr-retarget"
            self.notify_failure("manual-pr-retarget")
            return True
        if pr["head"]["sha"] != pending["headSha"]:
            self.state["status"] = "manual-pr-takeover"
            self.notify_failure("manual-pr-takeover")
            return True
        if current_main != pending["sourceSha"]:
            # Regenerate against the new reviewed main; never overwrite unrelated changes.
            self.api(f"pulls/{pending['pr']}", {"state": "closed"}, "PATCH")
            self.state.pop("pending", None)
            self.state.pop("lastSeen", None)
            self.state["status"] = "source-advanced-requeue"
            return False
        runs = self.api(f"commits/{pending['headSha']}/check-runs?per_page=100").get("check_runs", [])
        by_name = {}
        for check in runs:
            if check["name"] not in by_name or check["id"] > by_name[check["name"]]["id"]:
                by_name[check["name"]] = check
        failed = [check["name"] for check in by_name.values() if check["conclusion"] in ["failure", "cancelled", "timed_out", "action_required"]]
        if failed:
            self.state["status"] = "ci-failed"
            self.notify_failure("translation-ci-failed", failed)
            return True
        if not all(by_name.get(name, {}).get("conclusion") == "success" and by_name.get(name, {}).get("app", {}).get("slug") == "github-actions" for name in REQUIRED_CHECKS):
            self.state["status"] = "awaiting-ci"
            return True
        checks = self.api(f"commits/{pending['headSha']}/status").get("statuses", [])
        latest = {}
        for check in checks:
            latest.setdefault(check["context"], check)
        if latest.get("Vercel – myblog", {}).get("state") != "success":
            self.state["status"] = "awaiting-preview"
            return True
        changed = self.api(f"pulls/{pending['pr']}/files?per_page=100")
        if len(changed) >= 100 or not changed or not all(allowed_path(file["filename"]) for file in changed):
            self.notify_failure("unexpected-pr-files")
            self.state["status"] = "publication-blocked"
            return True
        fresh = self.api(f"pulls/{pending['pr']}")
        if (fresh["head"]["sha"] != pending["headSha"] or fresh.get("base", {}).get("ref") != "main"
                or fresh.get("base", {}).get("sha") != pending["sourceSha"]
                or fresh.get("base", {}).get("repo", {}).get("full_name", "").lower() != self.repo.lower()
                or self.api("commits/main")["sha"] != pending["sourceSha"]):
            self.state["status"] = "publication-state-changed"
            return True
        self.gh_command(["pr", "merge", str(pending["pr"]), "--repo", self.repo, "--squash", "--match-head-commit", pending["headSha"]])
        self.state["status"] = "merge-requested"
        return True

    def snapshot(self, sha: str, directory: pathlib.Path):
        tree = self.api(f"git/trees/{sha}?recursive=1")
        if tree.get("truncated"):
            raise RuntimeError("truncated-source-tree")
        selected = [item for item in tree["tree"] if item["type"] == "blob" and input_path(item["path"])]
        if any(item["mode"] != "100644" or item.get("size", 0) > 2_000_000 for item in selected):
            raise RuntimeError("invalid-content-file")
        if sum(item.get("size", 0) for item in selected) > 50_000_000:
            raise RuntimeError("source-size-limit")
        cache = self.state_dir / "blobs"
        cache.mkdir(exist_ok=True)
        for item in selected:
            cached = cache / item["sha"]
            if cached.exists():
                data = cached.read_bytes()
            else:
                blob = self.api(f"git/blobs/{item['sha']}")
                data = base64.b64decode(blob["content"], validate=False)
                if blob_sha(data) != item["sha"]:
                    raise RuntimeError("source-hash-mismatch")
                cached.write_bytes(data)
            dest = directory / item["path"]
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
        return {item["path"]: item["sha"] for item in selected}, tree["sha"]

    def translator(self, root: pathlib.Path, *, status=False):
        command = [self.config["node"], self.config["translator"]]
        command += ["--status", "--semantic-review"] if status else ["--semantic-review"]
        env = {key: value for key, value in os.environ.items() if key in ["PATH", "HOME", "TMPDIR", "LANG", "LC_ALL", "HTTPS_PROXY", "HTTP_PROXY", "ALL_PROXY", "NO_PROXY", "SSL_CERT_FILE", "SSL_CERT_DIR"]}
        env.update(TRANSLATION_PROVIDER="codex-cli", TRANSLATION_CODEX_BIN=self.config["codex"],
                   TRANSLATION_MODEL=self.config.get("model", "gpt-6-astra"),
                   TRANSLATION_MAX_REQUESTS=str(self.config.get("maxRequests", 24)))
        run = subprocess.run(command, cwd=root, env=env, capture_output=True, text=True,
                             timeout=self.config.get("translationTimeoutSeconds", 1200), check=False)
        try:
            return json.loads(run.stdout)
        except (ValueError, TypeError):
            raise RuntimeError("translator-failed") from None

    def tick(self, *, force=False, dry_run=False):
        commit = self.api("commits/main")
        sha = commit["sha"]
        if not dry_run and self.pending(sha):
            return
        if self.state.get("pausedSource") == sha and not force:
            return
        if self.state.get("lastSeen") == sha and not force:
            self.state["status"] = "current"
            return
        if self.state.get("failedSource") == sha and time.time() < self.state.get("retryAt", 0) and not force:
            self.state["status"] = "retry-deferred"
            return
        with tempfile.TemporaryDirectory(prefix="blog-english-sync-") as temporary:
            root = pathlib.Path(temporary)
            before, tree_sha = self.snapshot(sha, root)
            inspection = self.translator(root, status=True)
            work = [item for item in inspection.get("results", []) if item.get("state") != "current" and (item.get("state") not in ["draft", "removed"] or (root / "src/content/en" / item["key"]).exists())]
            self.state["sourceSha"] = sha
            self.state["pendingItems"] = [{"key": item["key"], "state": item["state"]} for item in work]
            if dry_run:
                self.state["status"] = "dry-run"
                return
            if not work:
                self.state.update(lastSeen=sha, status="current")
                self.clear_alert()
                return
            # Bounded paid/quota work; never spin on the same invalid text.
            today = dt.datetime.now(dt.timezone.utc).date().isoformat()
            if self.state.get("budgetDate") != today:
                self.state.update(budgetDate=today, translationRuns=0)
            if self.state.get("translationRuns", 0) >= self.config.get("maxRunsPerDay", 6):
                self.state["status"] = "daily-budget-reached"
                self.notify_failure("daily-translation-budget-reached", [item["key"] for item in work])
                return
            self.state["translationRuns"] = self.state.get("translationRuns", 0) + 1
            self.save()
            translated = self.translator(root)
            archive = root / ".translation-retired"
            if archive.exists():
                # Preserve manual translations outside disposable snapshots; Git history
                # also retains their previous committed version. Never auto-replace them.
                for record in archive.rglob("*.txt"):
                    relative = record.relative_to(archive)
                    destination = self.state_dir / "retired" / relative
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(record, destination)
                    destination.chmod(0o600)
            failures = [item for item in translated.get("results", []) if item.get("state") not in ["current", "removed", "draft"]]
            if failures:
                self.state.update(failedSource=sha, retryAt=time.time()+3600, status="translation-blocked")
                self.notify_failure("translation-validation-or-provider-failed", [item["key"] for item in failures])
            candidates = {str(file.relative_to(root)): file.read_bytes() for file in (root / "src/content/en").rglob("*.md")} if (root / "src/content/en").exists() else {}
            if (root / MANIFEST).exists():
                candidates[MANIFEST] = (root / MANIFEST).read_bytes()
            changes = []
            for filename, data in candidates.items():
                if not allowed_path(filename):
                    raise RuntimeError("unexpected-generated-path")
                if before.get(filename) != blob_sha(data):
                    changes.append({"path": filename, "mode": "100644", "type": "blob", "content": data.decode("utf8")})
            for filename in before:
                if TARGET.fullmatch(filename) and filename not in candidates:
                    changes.append({"path": filename, "mode": "100644", "type": "blob", "sha": None})
            content_changes = [change for change in changes if change["path"] != MANIFEST]
            if not changes or (not content_changes and not any(item.get("action") in ["translated", "retired"] for item in translated.get("results", []))):
                if not failures:
                    self.state.update(lastSeen=sha, status="current")
                return
            if self.api("commits/main")["sha"] != sha:
                self.state["status"] = "source-advanced-requeue"
                return
            if len(changes) >= 100:
                raise RuntimeError("translation-change-budget")
            new_tree = self.api("git/trees", {"base_tree": tree_sha, "tree": changes})
            new_commit = self.api("git/commits", {"message": "chore(i18n): synchronize English from Chinese source", "tree": new_tree["sha"], "parents": [sha]})
            branch = f"automation/english-sync-{sha[:10]}-{int(time.time())}"
            self.api("git/refs", {"ref": "refs/heads/"+branch, "sha": new_commit["sha"]})
            body = ("中文唯一编辑源自动同步。只修改英文内容和译文状态清单；原文、代码、公式、引用与数值由结构检查保护。\n\n"
                    f"源版本：`{sha}`\n翻译后校验及语义复核已运行。文件数：{len(content_changes)}。\n\n"
                    "本机控制器只会在此精确版本的单元/构建/完整浏览器CI及预览成功、源版本未变化后合并。"
                    "译文仍属于模型生成内容，语义复核不构成零错误保证。")
            pr = self.api("pulls", {"title": "chore: 自动同步中文内容的英文版本", "head": branch, "base": "main", "body": body})
            self.state["pending"] = {"pr": pr["number"], "url": pr["html_url"], "headSha": new_commit["sha"], "sourceSha": sha, "branch": branch}
            self.state["status"] = "awaiting-ci"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    parser.add_argument("--status", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    config_path = pathlib.Path(args.config).expanduser().resolve()
    config = json.loads(config_path.read_text())
    state_dir = pathlib.Path(config.get("stateDir", config_path.parent)).expanduser().resolve()
    state_dir.mkdir(parents=True, exist_ok=True)
    with (state_dir / "worker.lock").open("w") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            print(json.dumps({"status": "already-running"})); return
        worker = Worker(config, state_dir)
        if args.status:
            print(json.dumps(worker.state, ensure_ascii=False, indent=2)); return
        try:
            worker.tick(force=args.force, dry_run=args.dry_run)
        except Exception as exc:
            code = str(exc) if re.fullmatch(r"[a-z][a-z0-9:_-]{0,90}", str(exc)) else type(exc).__name__
            worker.state.update(status="worker-error", errorCode=code)
            if not args.dry_run:
                try: worker.notify_failure(code)
                except Exception: pass
        finally:
            worker.save()
        print(json.dumps({key: worker.state.get(key) for key in ["status", "checkedAt", "sourceSha", "pending", "errorCode"]}, ensure_ascii=False))

if __name__ == "__main__":
    main()
