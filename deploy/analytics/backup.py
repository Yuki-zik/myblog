#!/usr/bin/env python3
"""Consistent SQLite backups; no copying a live WAL database as a flat file."""
from __future__ import annotations
import argparse
from datetime import datetime, timedelta, timezone
import os
from pathlib import Path
import sqlite3


def backup(database: Path, directory: Path, *, retention_days: int = 14) -> Path:
    if not 1 <= retention_days <= 365:
        raise ValueError("retention_days must be between 1 and 365")
    if not database.is_file():
        raise FileNotFoundError(database)
    directory.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chmod(directory, 0o700)
    now = datetime.now(timezone.utc)
    target = directory / ("analytics-" + now.strftime("%Y%m%dT%H%M%S%fZ") + ".sqlite3")
    temporary = target.with_suffix(".tmp")
    try:
        fd = os.open(temporary, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        os.close(fd)
        with sqlite3.connect(database.resolve().as_uri() + "?mode=ro", uri=True, timeout=30) as source:
            with sqlite3.connect(temporary) as destination:
                source.backup(destination, pages=128, sleep=0.05)
                if destination.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
                    raise RuntimeError("backup integrity check failed")
        os.replace(temporary, target)
        cutoff = now - timedelta(days=retention_days)
        for old in directory.glob("analytics-*.sqlite3"):
            if old.is_file() and datetime.fromtimestamp(old.stat().st_mtime, timezone.utc) < cutoff:
                old.unlink()
        return target
    finally:
        temporary.unlink(missing_ok=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--database", type=Path, default=Path("/var/lib/blog-analytics/analytics.sqlite3"))
    parser.add_argument("--directory", type=Path, default=Path("/var/backups/blog-analytics"))
    parser.add_argument("--retention-days", type=int, default=14)
    args = parser.parse_args()
    result = backup(args.database, args.directory, retention_days=args.retention_days)
    print("SQLite backup validated:", result.name, "bytes:", result.stat().st_size)
