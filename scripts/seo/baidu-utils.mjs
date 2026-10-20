const EXPECTED_HOST = "a-znk.com";

/** Preserve the exact site string registered in Baidu Search Resource Platform. */
export function validateBaiduSite(site) {
  if (typeof site !== "string" || !site.trim()) {
    throw new Error("Set BAIDU_SITE to the exact verified property in Baidu Search Resource Platform.");
  }
  const raw = site.trim();
  const candidate = raw.includes("://") ? raw : "https://" + raw;
  let url;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("Invalid BAIDU_SITE property.");
  }
  if (!["http:", "https:"].includes(url.protocol) ||
      url.hostname !== EXPECTED_HOST ||
      (url.pathname !== "/" && url.pathname !== "") ||
      url.search || url.hash || url.username || url.password || url.port) {
    throw new Error("BAIDU_SITE must identify the exact a-znk.com root property.");
  }
  return raw;
}

export function parseBaiduResult(json, count) {
  if (!json || typeof json !== "object") throw new Error("Invalid Baidu API response.");
  if (json.error !== undefined) {
    throw new Error("Baidu API rejected the submission (error code " + String(json.error) + ").");
  }
  if (!Number.isInteger(json.success) || json.success < 0) {
    throw new Error("Baidu API response is missing a valid success count.");
  }
  if ((json.not_same_site?.length ?? 0) > 0 || (json.not_valid?.length ?? 0) > 0) {
    throw new Error("Baidu API rejected one or more URLs as invalid or outside the registered site.");
  }
  if (json.success !== count) {
    throw new Error("Baidu API accepted " + json.success + " of " + count + " URLs. Check quota and property configuration.");
  }
  return { accepted: json.success, remaining: Number.isInteger(json.remain) ? json.remain : null };
}
