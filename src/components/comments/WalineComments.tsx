import { createTranslator, localizeData, type Locale } from "../../lib/i18n/index";
import React, { useEffect, useRef, useState } from "react";
import { init, type WalineInstance } from "@waline/client";
import { resolveWalineServerURL } from "./walineServerURL";

interface WalineCommentsProps {
  heading?: string;
  locale?: Locale;
  path: string;
}

export default function WalineComments({
  heading,
  locale = "zh-CN",
  path,
}: WalineCommentsProps) {
  const t = createTranslator(locale);
  const resolvedHeading = heading ?? t("评论");
  const containerRef = useRef<HTMLDivElement>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const serverURL = resolveWalineServerURL(
    import.meta.env.PUBLIC_WALINE_SERVER_URL,
    typeof window === "undefined" ? undefined : window.location.origin,
  );

  useEffect(() => {
    const container = containerRef.current;

    if (!serverURL || !container) {
      setRuntimeError(null);
      return;
    }

    container.dataset.walineReady = "initializing";
    setRuntimeError(null);

    let waline: WalineInstance | null = null;
    try {
      waline = init({
        el: container,
        serverURL,
        path,
        lang: locale === "en" ? "en-US" : "zh-CN",
        dark: 'html[data-color-scheme="dark"]',
        login: "disable",
        meta: ["nick", "mail", "link"],
        requiredMeta: ["nick"],
        emoji: false,
        reaction: false,
        search: false,
        pageview: false,
        locale: {
          placeholder: t("写下你的评论，支持 Markdown。"),
          sofa: t("还没有评论，来留下第一条。"),
          submit: t("发送评论"),
        },
      });
    } catch (error) {
      delete container.dataset.walineReady;
      console.error("[WalineComments] init failed:", error);
      setRuntimeError(t("评论服务初始化失败，请稍后重试。"));
      return;
    }
    container.dataset.walineReady = "true";

    return () => {
      waline?.destroy();
      delete container.dataset.walineReady;
    };
  }, [path, serverURL, locale]);

  return (
    <section className="waline-comments" aria-label={resolvedHeading}>
      <div className="waline-comments__header">
        <h2 className="waline-comments__title">{resolvedHeading}</h2>
        <p className="waline-comments__hint">
          {t("围绕整篇文章留下想法，补充阅读线索，或提出还想继续追问的问题。")}</p>
      </div>

      {serverURL ? (
        <>
          <div
            ref={containerRef}
            className="waline-comments__mount"
            data-waline-mount
          />
          {runtimeError ? (
            <p
              className="waline-comments__config"
              data-testid="waline-runtime-error"
              role="status"
            >
              {runtimeError}
            </p>
          ) : null}
        </>
      ) : (
        <p className="waline-comments__config">
          {t("缺少 `PUBLIC_WALINE_SERVER_URL`，当前未启用评论服务。")}</p>
      )}
    </section>
  );
}
