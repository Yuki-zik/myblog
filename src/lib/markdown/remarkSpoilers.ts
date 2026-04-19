type MarkdownNode = {
  type?: string;
  name?: string;
  label?: string | null;
  depth?: number;
  value?: string;
  children?: MarkdownNode[];
  data?: {
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
};

type VFileLike = {
  path?: string;
  fail?: (reason: string, node?: unknown) => never;
};

const DEFAULT_SPOILER_LABEL = "点击揭示剧透";

function normalizePath(path: string | undefined): string {
  return (path ?? "").replace(/\\/g, "/");
}

function getContentSurface(path: string | undefined): "posts" | "topics" | "concepts" | null {
  const normalizedPath = normalizePath(path);

  if (normalizedPath.includes("/src/content/posts/")) return "posts";
  if (normalizedPath.includes("/src/content/topics/")) return "topics";
  if (normalizedPath.includes("/src/content/concepts/")) return "concepts";
  return null;
}

function fail(file: VFileLike, node: MarkdownNode, message: string): never {
  const error = `remarkSpoilers: ${message}`;
  if (typeof file.fail === "function") {
    return file.fail(error, node);
  }

  throw new Error(error);
}

function createText(value: string): MarkdownNode {
  return {
    type: "text",
    value
  };
}

function createSpoilerSummary(label: string | null | undefined): MarkdownNode {
  const trimmedLabel = label?.trim() ?? "";
  return {
    type: "spoilerSummary",
    children: trimmedLabel ? [createText(trimmedLabel)] : [],
    data: {
      hName: "summary",
      hProperties: {
        "data-spoiler-summary": "",
        ...(trimmedLabel ? {} : { "data-spoiler-blank": "" }),
        className: ["post-spoiler__summary"],
        "aria-label": trimmedLabel || DEFAULT_SPOILER_LABEL
      }
    }
  };
}

function createInlineSpoilerHint(): MarkdownNode {
  return {
    type: "spoilerInlineHint",
    children: [createText(DEFAULT_SPOILER_LABEL)],
    data: {
      hName: "span",
      hProperties: {
        className: ["visually-hidden"],
        "data-spoiler-inline-hint": ""
      }
    }
  };
}

function createInlineSpoilerContent(children: MarkdownNode[]): MarkdownNode {
  return {
    type: "spoilerInlineContent",
    children,
    data: {
      hName: "span",
      hProperties: {
        className: ["post-inline-spoiler__content"],
        "data-spoiler-inline-content": "",
        "aria-hidden": "true"
      }
    }
  };
}

function walkDescendants(nodes: MarkdownNode[], visitor: (node: MarkdownNode) => void): void {
  for (const node of nodes) {
    visitor(node);
    if (Array.isArray(node.children) && node.children.length > 0) {
      walkDescendants(node.children, visitor);
    }
  }
}

function validateBlockSpoiler(node: MarkdownNode, file: VFileLike): void {
  walkDescendants(node.children ?? [], (descendant) => {
    if (descendant.name === "spoiler" && /Directive$/.test(descendant.type ?? "")) {
      fail(file, descendant, "spoiler does not allow nested spoilers.");
    }

    if (descendant.type === "heading") {
      fail(file, descendant, "spoiler does not allow markdown headings.");
    }

    if (descendant.type === "footnoteReference" || descendant.type === "footnoteDefinition") {
      fail(file, descendant, "spoiler does not allow footnotes.");
    }
  });
}

function validateInlineSpoiler(node: MarkdownNode, file: VFileLike): void {
  walkDescendants(node.children ?? [], (descendant) => {
    if (descendant.name === "spoiler" && /Directive$/.test(descendant.type ?? "")) {
      fail(file, descendant, "inline spoiler does not allow nested spoilers.");
    }

    if (descendant.type === "footnoteReference" || descendant.type === "footnoteDefinition") {
      fail(file, descendant, "inline spoiler does not allow footnotes.");
    }
  });
}

function transformSpoilerNode(node: MarkdownNode, file: VFileLike): void {
  const surface = getContentSurface(file.path);
  if (surface && surface !== "posts") {
    fail(file, node, "spoiler directives are only supported in posts.");
  }

  if (node.type === "containerDirective") {
    validateBlockSpoiler(node, file);
    node.data = {
      hName: "details",
      hProperties: {
        "data-spoiler": "",
        className: ["post-spoiler"]
      }
    };
    node.children = [createSpoilerSummary(node.label), ...(node.children ?? [])];
    return;
  }

  if (node.type === "textDirective") {
    validateInlineSpoiler(node, file);
    const originalChildren = node.children ?? [];
    node.data = {
      hName: "button",
      hProperties: {
        type: "button",
        "data-spoiler-inline": "",
        className: ["post-inline-spoiler"],
        "aria-pressed": "false",
        "aria-label": DEFAULT_SPOILER_LABEL
      }
    };
    node.children = [createInlineSpoilerHint(), createInlineSpoilerContent(originalChildren)];
    return;
  }

  fail(file, node, "spoiler only supports block (:::) or inline (:) directive syntax.");
}

function visitNodes(nodes: MarkdownNode[], file: VFileLike): void {
  for (const node of nodes) {
    if (node.name === "spoiler" && /Directive$/.test(node.type ?? "")) {
      transformSpoilerNode(node, file);
      continue;
    }

    if (Array.isArray(node.children) && node.children.length > 0) {
      visitNodes(node.children, file);
    }
  }
}

export function remarkSpoilers() {
  return (tree: MarkdownNode, file: VFileLike) => {
    visitNodes(tree.children ?? [], file);
  };
}
