"""Offline smoke tests for the APNIC parser: no network, VPS or root needed."""
import importlib.util
import ipaddress
import pathlib
import unittest
from unittest.mock import patch

SCRIPT = pathlib.Path(__file__).resolve().parents[1] / "update-blog-cn-cidrs.py"
spec = importlib.util.spec_from_file_location("blog_cn_updater", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class FeedResponse:
    status = 200
    def __init__(self, raw):
        self.raw = raw
    def __enter__(self):
        return self
    def __exit__(self, *_):
        return False
    def read(self, n):
        return self.raw[:n]


def fake_feed():
    lines = ["# Synthetic test fixture; no real APNIC allocations or client addresses"]
    v4start = int(ipaddress.IPv4Address("1.0.1.0"))
    for i in range(5100):
        ip = ipaddress.IPv4Address(v4start + (i * 512))
        lines.append(f"apnic|CN|ipv4|{ip}|256|20261019|allocated")
    for i in range(1500):
        lines.append(f"apnic|CN|ipv6|2001:0250:{2*i:04x}::|48|20261019|allocated")
    lines.append("apnic|US|ipv4|8.8.8.0|256|20261019|allocated")
    lines.append("# " + "padding" * 160000)
    return ("\n".join(lines)).encode("ascii")


class CidrUpdaterTests(unittest.TestCase):
    def test_parses_cn_ipv4_ipv6_and_ignores_non_cn(self):
        with patch.object(module.urllib.request, "urlopen", return_value=FeedResponse(fake_feed())):
            data, metrics = module.fetch_cn_cidrs()
        self.assertEqual(metrics["country"], "CN")
        self.assertGreaterEqual(metrics["ipv4_cidrs"], 3500)
        self.assertGreaterEqual(metrics["ipv6_cidrs"], 1000)
        self.assertIn(b"1.0.1.0/24 1;", data)
        self.assertNotIn(b"8.8.8.0/24 1;", data)
        self.assertEqual(data.count(b" 1;\n"), metrics["ipv4_cidrs"] + metrics["ipv6_cidrs"])

    def test_fails_closed_on_short_feed(self):
        with patch.object(module.urllib.request, "urlopen", return_value=FeedResponse(b"apnic|CN|ipv4|1.0.1.0|256|20261019|allocated\n")):
            with self.assertRaisesRegex(RuntimeError, "size out of safe bounds"):
                module.fetch_cn_cidrs()


if __name__ == "__main__":
    unittest.main()
