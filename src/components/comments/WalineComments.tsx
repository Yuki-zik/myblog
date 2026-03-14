import React, { useEffect, useRef } from "react";
import { init, type WalineInstance } from "@waline/client";

interface WalineCommentsProps {
  heading?: string;
  path: string;
}

export default function WalineComments({
  heading = "评论",
  path,
}: WalineCommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const serverURL = import.meta.env.PUBLIC_WALINE_SERVER_URL;

  useEffect(() => {
    if (!serverURL || !containerRef.current) {
      return;
    }

    const waline: WalineInstance | null = init({
      el: containerRef.current,
      serverURL,
      path,
      lang: "zh-CN",
      dark: 'html[data-theme="dark"]',
      login: "disable",
      meta: ["nick", "mail", "link"],
      requiredMeta: ["nick"],
      emoji: false,
      reaction: false,
      search: false,
      pageview: false,
      locale: {
        placeholder: "写下你的评论，支持 Markdown。",
        sofa: "还没有评论，来留下第一条。",
        submit: "发送评论",
      },
    });

    return () => {
      waline?.destroy();
    };
  }, [path, serverURL]);

  return (
    <section className="waline-comments" aria-label={heading}>
      <div className="waline-comments__header">
        <h2 className="waline-comments__title">{heading}</h2>
        <p className="waline-comments__hint">
          使用 Waline 承载站点评论；段落锚点仅继续服务阅读侧栏与注释定位。
        </p>
      </div>

      {serverURL ? (
        <div
          ref={containerRef}
          className="waline-comments__mount"
          data-waline-mount
        />
      ) : (
        <p className="waline-comments__config">
          缺少 `PUBLIC_WALINE_SERVER_URL`，当前未启用评论服务。
        </p>
      )}
    </section>
  );
}
