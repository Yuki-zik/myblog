#!/usr/bin/env python3
"""Maintain APNIC CN allocated IPv4/IPv6 blocks for the blog mirror only.

Run weekly via systemd; on failure retain the previous validated table.
Use --bootstrap only before the nginx site begins including the CIDR file.
Never changes Xray, sshd, DNS, firewall or the Vercel primary site.
"""
import argparse
import fcntl
import ipaddress
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import urllib.request

URL = "https://ftp.apnic.net/stats/apnic/delegated-apnic-latest"
OUTPUT = Path("/etc/nginx/blog-cn-cidrs.conf")
LOCK = Path("/run/lock/a-znk-blog-cn-geo.lock")
MAX_BYTES = 10 * 1024 * 1024
MIN_BYTES = 1 * 1024 * 1024

def fetch_cn_cidrs():
    req = urllib.request.Request(URL, headers={"User-Agent": "a-znk-blog-cn-cidr-maintainer/1.0"})
    with urllib.request.urlopen(req, timeout=25) as response:
        if response.status != 200:
            raise RuntimeError("APNIC HTTP status: %s" % response.status)
        raw = response.read(MAX_BYTES + 1)
    if len(raw) < MIN_BYTES or len(raw) > MAX_BYTES:
        raise RuntimeError("APNIC response size out of safe bounds: %s" % len(raw))
    text = raw.decode("ascii")
    ipv4, ipv6 = [], []
    failures = []
    for lineno, line in enumerate(text.splitlines(), 1):
        if line.startswith("#") or not line.strip():
            continue
        row = line.split("|")
        if len(row) < 7 or row[0].lower() != "apnic" or row[1].upper() != "CN":
            continue
        if row[6].lower() not in ("allocated", "assigned"):
            continue
        try:
            if row[2].lower() == "ipv4":
                start = ipaddress.IPv4Address(row[3])
                count = int(row[4])
                if count < 1 or int(start) + count > (1 << 32):
                    raise ValueError("invalid IPv4 range")
                stop = ipaddress.IPv4Address(int(start) + count - 1)
                ipv4.extend(ipaddress.summarize_address_range(start, stop))
            elif row[2].lower() == "ipv6":
                prefix = int(row[4])
                if not 1 <= prefix <= 128:
                    raise ValueError("invalid IPv6 prefix")
                ipv6.append(ipaddress.IPv6Network("%s/%d" % (row[3], prefix), strict=True))
        except (ValueError, ipaddress.AddressValueError) as exc:
            failures.append("%d:%s" % (lineno, exc))
    if failures:
        raise RuntimeError("Invalid APNIC CN rows: %s" % failures[:4])
    if len(ipv4) < 5000 or len(ipv6) < 1000:
        raise RuntimeError("Unexpectedly small APNIC CN source: %d IPv4, %d IPv6" % (len(ipv4), len(ipv6)))
    v4 = sorted(ipaddress.collapse_addresses(ipv4), key=lambda n: (int(n.network_address), n.prefixlen))
    v6 = sorted(ipaddress.collapse_addresses(ipv6), key=lambda n: (int(n.network_address), n.prefixlen))
    if len(v4) < 3500 or len(v6) < 1000:
        raise RuntimeError("Unexpectedly small merged CN table")
    if not any(ipaddress.IPv4Address("1.0.1.1") in n for n in v4):
        raise RuntimeError("Known CN block missing")
    if any(ipaddress.IPv4Address("8.8.8.8") in n for n in v4):
        raise RuntimeError("Known US block erroneously included")
    data = ("# Generated from APNIC delegated-apnic-latest, allocated/assigned country CN only.\n"
            "# Network allocation country is an approximation of visitor geography.\n"
            "# Manage via /usr/local/sbin/update-blog-cn-cidrs, not by hand.\n")
    data += "".join("%s 1;\n" % n for n in (*v4, *v6))
    return data.encode("ascii"), {"ipv4_cidrs": len(v4), "ipv6_cidrs": len(v6),
                                  "apnic_bytes": len(raw), "country": "CN"}

def save_atomic(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(prefix=".blog-cn-", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as output:
            output.write(payload)
            output.flush()
            os.fsync(output.fileno())
        os.chmod(tmp_name, 0o644)
        os.replace(tmp_name, path)
    finally:
        if os.path.exists(tmp_name):
            os.unlink(tmp_name)

def checked(cmd, timeout=18):
    p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                       text=True, timeout=timeout, check=False)
    if p.returncode:
        raise RuntimeError("%s: %s" % (" ".join(cmd), p.stdout[-1500:]))
    return p.stdout[-500:]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--bootstrap", action="store_true",
                        help="Seed the table before enabling it in Nginx; do not reload")
    args = parser.parse_args()
    if os.geteuid() != 0:
        raise RuntimeError("requires root for /etc/nginx")
    LOCK.parent.mkdir(parents=True, exist_ok=True)
    with LOCK.open("a+") as lockfile:
        fcntl.flock(lockfile, fcntl.LOCK_EX)
        new, metrics = fetch_cn_cidrs()
        old = OUTPUT.read_bytes() if OUTPUT.exists() else None
        if old == new:
            print(json.dumps({"ok": True, "changed": False, **metrics}, sort_keys=True))
            return
        save_atomic(OUTPUT, new)
        if args.bootstrap:
            print(json.dumps({"ok": True, "changed": True, "bootstrap": True, **metrics}, sort_keys=True))
            return
        try:
            checked(["nginx", "-t"])
            checked(["systemctl", "reload", "nginx"])
            checked(["systemctl", "is-active", "nginx"])
        except Exception:
            if old is not None:
                save_atomic(OUTPUT, old)
            else:
                OUTPUT.unlink(missing_ok=True)
            checked(["nginx", "-t"])
            checked(["systemctl", "reload", "nginx"])
            raise
        print(json.dumps({"ok": True, "changed": True, "reloaded": True, **metrics}, sort_keys=True))

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)}), file=sys.stderr)
        sys.exit(1)
