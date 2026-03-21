export interface SiteAuthorProfile {
  id: string;
  name: string;
  bioShort?: string;
  tagline?: string;
  mission?: string;
  intro?: string;
  homepage?: string;
  avatar?: string;
  email?: string;
  socials?: {
    x?: string;
    github?: string;
  };
  researchTracks?: {
    title: string;
    summary: string;
    bullets: string[];
  }[];
  practiceHighlights?: {
    title: string;
    description: string;
  }[];
  socialNetworks?: {
    id: string;
    label: string;
    href: string;
    description?: string;
    statValue?: number;
    statLabel?: string;
    statValueFallback?: string;
    substats?: {
      source: string;
      key: string;
    };
  }[];
  currentFocus?: string[];
  blogScope?: string[];
  contactReservations?: string[];
}

export const SITE_AUTHOR_PROFILE: SiteAuthorProfile = {
  id: "a-znk",
  name: "A-Znk",
  bioShort: "AI 安全 USTC 硕士｜专注大模型系统与安全",
  tagline: "AI 安全 USTC 硕士｜专注大模型系统与安全",
  mission: "我在做的是：把大模型从“能回答问题”变成“能完成任务的系统”。",
  intro:
    "我专注于大模型系统、模型安全与 Agent 工程化，关注如何将研究能力转化为可执行系统。在多模态大模型（MLLM）与安全方向上，持续围绕对抗攻击、隐私保护、表示空间分析等问题展开工作，并把这些研究问题延伸到评测框架、行为控制与系统原型中。",
  avatar: "/author-avatar.png",
  email: "I.OVE@outlook.com",
  socials: {
    github: "yuki-zik"
  },
  researchTracks: [
    {
      title: "LLM / MLLM 系统",
      summary: "从模型能力到系统能力，关注多模态推理链路、实验 Harness 与评测闭环。",
      bullets: [
        "多模态大模型（MLLM）",
        "推理框架、评测体系、工程化部署",
        "可复现实验流程与系统化验证"
      ]
    },
    {
      title: "模型安全",
      summary: "研究模型在开放环境中的脆弱性，以及安全机制如何具备可迁移性与可控性。",
      bullets: [
        "对抗样本（Adversarial Attack）",
        "安全对齐与拒答行为控制",
        "模型指纹与版权保护"
      ]
    },
    {
      title: "Agent 工程",
      summary: "把 prompt 从一次性技巧推进为可维护、可评估、可迭代的系统工程方法。",
      bullets: [
        "Prompt Engineering → Harness Engineering",
        "多 Agent 协作系统",
        "MVP 快速构建方法论"
      ]
    }
  ],
  practiceHighlights: [
    {
      title: "多模态大模型实验框架",
      description: "基于 Qwen2.5-VL 构建实验 Harness，支持批量评测、安全实验与可复现实验流程。"
    },
    {
      title: "Steering Vector 行为控制",
      description: "设计 Steering Vector 控制方法，用于调节模型行为与输出风格，验证可控生成与拒答边界。"
    },
    {
      title: "博客评论系统集成",
      description: "实现基于 Waline + Supabase 的博客评论系统，并完成前后端接入与内容页集成。"
    },
    {
      title: "Agent 驱动的 MVP 工作流",
      description: "持续探索 Agent 驱动的 MVP 开发流程与 prompt 体系，把需求快速转成可运行原型。"
    }
  ],
  socialNetworks: [
    {
      id: "github",
      label: "GitHub",
      href: "https://github.com/yuki-zik",
      description: "@yuki-zik",
      statValueFallback: "--",
      statLabel: "followers",
      substats: {
        source: "github",
        key: "yuki-zik"
      }
    },
    {
      id: "xiaohongshu",
      label: "小红书",
      href: "https://xhslink.com/m/3CiG4zfolAt",
      description: "一个 CS 学生的成长轨迹与碎碎念 · From zero to hero: A CS student's journey of learning",
      statValue: 652,
      statLabel: "赞与收藏"
    },
    {
      id: "telegram",
      label: "Telegram",
      href: "https://t.me/A_Znkv",
      description: "@A_Znkv",
      statValueFallback: "--",
      statLabel: "subscribers",
      substats: {
        source: "telegram",
        key: "A_Znkv"
      }
    },
    {
      id: "zhihu",
      label: "知乎",
      href: "https://www.zhihu.com/people/A-Znk",
      description: "zhihu.com/people/A-Znk",
      statValueFallback: "--",
      statLabel: "followers",
      substats: {
        source: "zhihu",
        key: "A-Znk"
      }
    }
  ],
  currentFocus: [
    "如何构建可验证、可评估的 Agent 系统",
    "如何在 MLLM 中实现可迁移的安全机制",
    "如何通过工程结构（Harness）替代 prompt 脆弱性"
  ],
  blogScope: [
    "大模型系统与安全研究",
    "Agent 工程实践与工作流设计",
    "AI Coding / Prompt Engineering 方法论",
    "项目复盘与技术思考"
  ],
  contactReservations: ["Twitter / X"]
};

export const DEFAULT_POST_AUTHOR = SITE_AUTHOR_PROFILE.name;
