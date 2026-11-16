from pathlib import Path
import re
import unittest


def extract_map_regexes(conf_text: str, var_name: str) -> list[tuple[re.Pattern[str], str]]:
    block = re.search(rf"map\s+\S+\s+\${re.escape(var_name)}\s*\{{(.*?)\n\}}", conf_text, re.S)
    if not block:
        raise AssertionError(f"Missing map for ${var_name}")
    rules: list[tuple[re.Pattern[str], str]] = []
    for raw_line in block.group(1).splitlines():
        line = raw_line.strip().rstrip(";").strip()
        if not line or line.startswith("#") or line.startswith("default ") or line.startswith('""'):
            continue
        parts = line.rsplit(None, 1)
        pattern_raw, value = parts[0].strip('"'), parts[1]
        flags = 0
        if pattern_raw.startswith("~*"):
            pattern = pattern_raw[2:]
            flags = re.IGNORECASE
        elif pattern_raw.startswith("~"):
            pattern = pattern_raw[1:]
        else:
            continue
        rules.append((re.compile(pattern, flags), value))
    return rules


def eval_regex_map(rules: list[tuple[re.Pattern[str], str]], value: str, default: str = "0") -> str:
    for regex, target in rules:
        if regex.search(value):
            return target
    return default


class NginxGuardRegexTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        maps_path = Path(__file__).resolve().parent / "nginx-maps.conf"
        cls.conf = maps_path.read_text(encoding="utf-8")
        cls.bad_bot = extract_map_regexes(cls.conf, "blog_bad_bot_ua")
        cls.exploit_uri = extract_map_regexes(cls.conf, "blog_exploit_uri")
        cls.hotlink = extract_map_regexes(cls.conf, "blog_hotlink_blocked")
        cls.valid_p = extract_map_regexes(cls.conf, "blog_analytics_valid_p")
        cls.analytics_bot = extract_map_regexes(cls.conf, "blog_analytics_bot_ua")

    def test_blocks_category_c_and_d_bots_while_preserving_a_and_b_ai_agents(self) -> None:
        for allowed in (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36",
            "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
            "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
            "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)",
            "OAI-SearchBot/1.0; +https://openai.com/searchbot",
            "GPTBot/1.2; +https://openai.com/gptbot",
            "Claude-SearchBot/1.0; +https://support.anthropic.com",
            "PerplexityBot/1.0; +https://perplexity.ai/perplexitybot",
            "curl/8.7.1",
        ):
            self.assertEqual(eval_regex_map(self.bad_bot, allowed), "0", allowed)

        for blocked in (
            "Mozilla/5.0 (compatible; SemrushBot/7~bl)",
            "Mozilla/5.0 (compatible; AhrefsBot/7.0)",
            "Mozilla/5.0 (compatible; MJ12bot/v1.4.8)",
            "Scrapy/2.11.0 (+https://scrapy.org)",
            "python-requests/2.32.0",
            "Mozilla/5.0 (compatible; CensysInspect/1.1)",
            "sqlmap/1.8",
            "Nuclei - Open-source project",
        ):
            self.assertEqual(eval_regex_map(self.bad_bot, blocked), "1", blocked)

    def test_blocks_exploit_probe_uris_without_harming_valid_routes(self) -> None:
        for valid in (
            "/",
            "/agents",
            "/papers/duap-multilingual-speech-privacy",
            "/papers/duap-multilingual-speech-privacy.md",
            "/papers/duap-multilingual-speech-privacy.bib",
            "/agents/dataset.csv",
            "/.well-known/security.txt",
            "/.well-known/acme-challenge/token123",
            "/vendor/goatcounter/count.v2.7.0.js",
        ):
            self.assertEqual(eval_regex_map(self.exploit_uri, valid), "0", valid)

        for exploit in (
            "/.env",
            "/.git/config",
            "/wp-login.php",
            "/admin/config.php",
            "/SDK/webLanguage",
            "/setup.cgi",
            "/cgi-bin/luci",
            "/backup.sql",
        ):
            self.assertEqual(eval_regex_map(self.exploit_uri, exploit), "1", exploit)

    def test_validates_encoded_and_literal_analytics_paths_and_blocks_spam(self) -> None:
        for valid in (
            "%2F",
            "/",
            "%2Fen",
            "%2Fagents",
            "%2Fen%2Fagents",
            "%2Fposts%2Fant-ai-coding-review",
            "%2Fen%2Fpapers%2Fduap-multilingual-speech-privacy",
            "read_50%3A%2Fposts%2Fant-ai-coding-review",
            "outbound_github%3A%2Fauthor",
            "language_switch%3A%2F",
        ):
            self.assertEqual(eval_regex_map(self.valid_p, valid), "1", valid)

        for invalid in (
            "",
            "%2Fwp-login.php",
            "%2Fspam-casino-backlink",
            "%2Fposts%2F..%2Fsecret",
            "fake_event%3A%2F",
        ):
            self.assertEqual(eval_regex_map(self.valid_p, invalid), "0", invalid)

    def test_hotlink_guard_allows_first_party_and_search_referers_only(self) -> None:
        self.assertEqual(eval_regex_map(self.hotlink, ""), "0")
        self.assertEqual(eval_regex_map(self.hotlink, "https://a-znk.com/papers/duap-multilingual-speech-privacy"), "0")
        self.assertEqual(eval_regex_map(self.hotlink, "https://vps.a-znk.com:8443/"), "0")
        self.assertEqual(eval_regex_map(self.hotlink, "https://www.google.com/"), "0")
        self.assertEqual(eval_regex_map(self.hotlink, "https://zhuanlan.zhihu.com/p/123"), "0")
        self.assertEqual(eval_regex_map(self.hotlink, "https://content-farm-thief.example.com/stolen-post"), "1")


if __name__ == "__main__":
    unittest.main()
