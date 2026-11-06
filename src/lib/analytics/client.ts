import { CONSENT_KEY, PUBLIC_HOSTS, analyticsAllowed, cleanPath, eventPath, outboundKind, parsePublicCount, readingMilestones, sourceLabel } from "./model";

type CountInput = { path: string; title: string; referrer: string; event: boolean };
type GoatCounter = {
  no_onload: boolean; no_events: boolean; endpoint: string;
  count?: (input: CountInput) => void;
  get_data?: (input: CountInput) => Record<string, unknown>;
  url?: (input: CountInput) => string | undefined;
  filter?: () => false | string;
};
declare global { interface Window { goatcounter?: GoatCounter } }

/** Independent shared runtime. No article text, forms, search queries or persistent visitor IDs. */
export function initAnalytics(): () => void {
  const candidate = document.querySelector<HTMLElement>("[data-analytics-config]");
  if (!candidate || candidate.dataset.analyticsReady) return () => {};
  const root = candidate;
  root.dataset.analyticsReady = "true";
  const abort = new AbortController();
  const signal = abort.signal;
  const en = document.documentElement.lang.startsWith("en");
  const pagePath = cleanPath(root.dataset.analyticsPath ?? "");
  const eligible = PUBLIC_HOSTS.has(location.hostname) && root.dataset.analyticsEnabled === "true" && !!pagePath;
  const body = document.querySelector<HTMLElement>("[data-post-body]");
  const events = new Set<string>();
  const pending = new Set<string>();
  const depths = new Set<number>();
  let preference: string | null = null;
  // If the browser cannot persist an opt-out, fail closed rather than silently
  // collecting again after the next page navigation.
  try {
    const probe = CONSENT_KEY + "-storage-check";
    localStorage.setItem(probe, "ok");
    localStorage.removeItem(probe);
    preference = localStorage.getItem(CONSENT_KEY);
  } catch { preference = "off"; }
  let scriptPromise: Promise<boolean> | undefined;
  let pageSent = false;
  let activeSeconds = 0;
  let lastTick = performance.now();
  let lastActivity = performance.now();
  let stopped = false;
  const privacySignal = () => navigator.doNotTrack === "1" || (navigator as Navigator & {globalPrivacyControl?:boolean}).globalPrivacyControl === true;
  const allowed = () => eligible && !stopped && analyticsAllowed({host:location.hostname,preference,dnt:navigator.doNotTrack,gpc:(navigator as Navigator & {globalPrivacyControl?:boolean}).globalPrivacyControl});

  function updateControls() {
    const blocked = privacySignal();
    const text = blocked ? (en ? "Disabled by your browser privacy signal" : "浏览器隐私信号：统计已关闭")
      : preference !== null && preference !== "on" ? (en ? "Anonymous analytics are off on this browser" : "此浏览器已关闭匿名统计")
      : (en ? "Anonymous aggregate analytics are on; you can turn them off here" : "匿名汇总统计已开启，可随时在此关闭");
    document.querySelectorAll<HTMLElement>("[data-analytics-status]").forEach(el => { el.textContent = text; });
    document.querySelectorAll<HTMLButtonElement>("[data-analytics-choice]").forEach(button => {
      button.setAttribute("aria-pressed", String(!blocked && (button.dataset.analyticsChoice === "off" ? preference === "off" : preference === null || preference === "on")));
      button.disabled = blocked && button.dataset.analyticsChoice === "on";
    });
    root.dataset.analyticsConsent = blocked ? "blocked" : preference !== null && preference !== "on" ? "off" : "on";
  }

  function loadTracker(): Promise<boolean> {
    if (scriptPromise) return scriptPromise;
    scriptPromise = new Promise(resolve => {
      window.goatcounter = {no_onload:true,no_events:true,endpoint:"/_analytics/count"};
      const script = document.createElement("script");
      script.src = "/vendor/goatcounter/count.v2.7.0.js";
      script.async = true;
      script.referrerPolicy = "no-referrer";
      const timer = window.setTimeout(() => { script.remove(); resolve(false); }, 6000);
      script.onload = () => {
        clearTimeout(timer);
        const gc = window.goatcounter;
        if (!gc?.get_data || !gc.count) return resolve(false);
        const original = gc.get_data;
        // Upstream 2.7.0 always sets q=location.search and exact screen width.
        // Strip both before the first request, even though auto-onload is off.
        gc.get_data = input => { const data = original(input); data.q = ""; data.s = 0; return data; };
        // sendBeacon cannot set referrerPolicy. A first-party beacon would otherwise
        // leak the current query string in its Referer header despite q being empty.
        // Keep the pinned upstream encoder/filter and use a no-referrer transport.
        gc.count = input => {
          if (gc.filter?.()) return;
          const url = gc.url?.(input);
          if (url) void fetch(url, {method:"POST",keepalive:true,credentials:"omit",referrerPolicy:"no-referrer"}).catch(() => {});
        };
        resolve(true);
      };
      script.onerror = () => { clearTimeout(timer); resolve(false); };
      document.head.append(script);
    });
    return scriptPromise;
  }

  async function send(name?: string) {
    if (!allowed() || document.visibilityState !== "visible" || !pagePath || navigator.webdriver) return;
    const key = name ?? "pageview";
    if ((name ? events.has(name) : pageSent) || pending.has(key)) return;
    pending.add(key);
    try {
      if (!await loadTracker() || !allowed() || document.visibilityState !== "visible") return;
      window.goatcounter?.count?.({
        path:name ? eventPath(name,pagePath) : pagePath,
        title:name ?? document.title.slice(0,200),
        referrer:sourceLabel(location.href,document.referrer) || "(direct)",
        event:!!name
      });
      if (name) events.add(name); else pageSent = true;
    } catch { /* Analytics must never interfere with reading. */ }
    finally { pending.delete(key); }
  }

  function setPreference(value: string | null) {
    preference = value === "on" || value === "off" ? value : null;
    try { if (preference) localStorage.setItem(CONSENT_KEY,preference); } catch { preference = "off"; }
    activeSeconds = 0; lastTick = performance.now(); lastActivity = lastTick;
    updateControls();
    if (allowed()) void send();
  }

  function tick() {
    const now = performance.now();
    if (allowed() && document.visibilityState === "visible" && document.hasFocus() && now-lastActivity < 60_000) {
      activeSeconds += Math.min(Math.max(0,(now-lastTick)/1000),5);
      if (body) {
        const rect = body.getBoundingClientRect();
        const progress = Math.max(0,Math.min(1,(innerHeight-rect.top)/Math.max(1,rect.height)));
        for (const depth of readingMilestones(progress,activeSeconds,depths)) { depths.add(depth); void send(`read_${depth}`); }
        for (const seconds of [30,60,180]) if (activeSeconds >= seconds) void send(`active_${seconds}s`);
      }
    }
    lastTick = now;
  }
  const activity = () => { lastActivity = performance.now(); };
  for (const type of ["scroll","pointerdown","keydown"]) window.addEventListener(type,activity,{passive:true,signal});
  document.addEventListener("visibilitychange",() => { lastTick=performance.now(); if(document.visibilityState==="visible") void send(); },{signal});
  window.addEventListener("storage",event => { if (event.key===CONSENT_KEY) { preference=event.newValue; updateControls(); if(allowed()) void send(); } },{signal});
  document.addEventListener("click",event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const consent = target.closest<HTMLButtonElement>("[data-analytics-choice]");
    if (consent) { setPreference(consent.dataset.analyticsChoice ?? null); return; }
    if (!allowed()) return;
    const bionic = target.closest<HTMLButtonElement>("[data-bionic-reading-toggle]");
    if (bionic) { queueMicrotask(() => void send(bionic.getAttribute("aria-pressed")==="true" ? "bionic_on" : "bionic_off")); return; }
    const link=target.closest<HTMLAnchorElement>("a[href]");
    if (!link) return;
    if (link.hasAttribute("data-language-switch")) { void send("language_switch"); return; }
    const kind=outboundKind(link.href,location.origin);
    if (kind) void send(`outbound_${kind}`);
  },{signal});
  const timer=window.setInterval(tick,5000);
  window.addEventListener("pagehide",() => { stopped=true; },{signal});
  window.addEventListener("pageshow",() => { stopped=false; lastTick=performance.now(); lastActivity=lastTick; void send(); },{signal});
  updateControls();
  void send();

  // Read-only count display, independent of consent and never increments a view.
  // Unknown/unavailable remains an em dash, never a fabricated zero.
  if (eligible) {
    document.querySelectorAll<HTMLElement>("[data-public-visit-count]").forEach(async el => {
      const path=cleanPath(el.dataset.publicVisitCount ?? "");
      if (!path) return;
      try {
        const response=await fetch(`/_analytics/counter/${encodeURIComponent(path)}.json`,{credentials:"omit",referrerPolicy:"no-referrer",signal:AbortSignal.timeout(4500)});
        if (!response.ok) return;
        const count=parsePublicCount(await response.json());
        if (count === null || !el.isConnected) return;
        el.textContent = new Intl.NumberFormat(en ? "en-US":"zh-CN").format(count);
        el.dataset.countState="ready";
      } catch { /* No counts are shown when the backend is unavailable. */ }
    });
  }
  return () => { stopped=true;clearInterval(timer);abort.abort();delete root.dataset.analyticsReady; };
}
