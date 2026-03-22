import {
  TUFTE_RAIL_FOOTNOTE_ID_PREFIX,
  type TufteRailFootnote
} from "../markdown/rehypeTufteFootnotes";
import type { PostTocItem } from "./toc";

export interface PostFigureImage {
  src: any;
  alt: string;
}

export interface PostFigure {
  id: string;
  anchorId?: string;
  title: string;
  kind: "image" | "table";
  caption?: string;
  summary?: string;
  sourceRefIds?: string[];
  image?: PostFigureImage;
}

export type ScholarNoteType = TufteRailFootnote["type"] | "figure";

export type TocRailEntry = { kind: "toc" };
export type FigureRailEntry = {
  kind: "figure";
  figure: PostFigure;
  number?: string;
  noteKey?: string;
  bubbleId?: string;
  noteType: "figure";
  typeLabel: "图表";
};
export type FootnoteRailEntry = {
  kind: "footnote";
  footnote: TufteRailFootnote;
  number?: string;
  noteKey?: string;
  bubbleId?: string;
  noteType: TufteRailFootnote["type"];
  typeLabel: "引用" | "注释";
};
export type InfoRailEntry = FigureRailEntry | FootnoteRailEntry;
export type RailEntry = TocRailEntry | InfoRailEntry;
type AnchoredRailEntry = FigureRailEntry | FootnoteRailEntry;

export type FigureSourceLink = {
  id: string;
  label: string;
  href: string;
  kind: "footnote" | "missing";
};

type BuildPostScholarRailModelInput = {
  tocItems: PostTocItem[];
  figures?: PostFigure[];
  markdownFootnotes?: TufteRailFootnote[];
  showToc?: boolean;
};

export type PostScholarRailModel = {
  railEntries: RailEntry[];
  infoEntries: InfoRailEntry[];
  tocEntry?: TocRailEntry;
  figureSourceLinks: Map<string, FigureSourceLink>;
};

function getAnchorId(entry: AnchoredRailEntry): string | undefined {
  if (entry.kind === "figure") return entry.figure.anchorId;
  return entry.footnote.anchorId;
}

function getAnchoredEntryOrder(entry: AnchoredRailEntry): number {
  if (entry.kind === "footnote") {
    return entry.footnote.referenceOrder ?? Number.POSITIVE_INFINITY;
  }
  return Number.POSITIVE_INFINITY;
}

function parseAnchorLocation(anchorId: string | undefined, sectionOrderBySlug: Map<string, number>) {
  if (!anchorId) return null;
  const [sectionSlugRaw, paragraphRaw, itemRaw] = anchorId.split("::");
  const sectionSlug = sectionSlugRaw?.trim();
  const paragraphIndex = Number(paragraphRaw?.replace(/^p/i, ""));
  const itemIndex =
    typeof itemRaw === "string" && /^li\d+$/i.test(itemRaw) ? Number(itemRaw.replace(/^li/i, "")) : 0;

  if (!sectionSlug || !Number.isFinite(paragraphIndex)) return null;

  return {
    sectionSlug,
    sectionOrder:
      sectionSlug === "root" ? -1 : (sectionOrderBySlug.get(sectionSlug) ?? Number.POSITIVE_INFINITY),
    paragraphIndex,
    itemIndex
  };
}

function getFootnoteDisplayNumber(footnote: TufteRailFootnote): string {
  const parsedLabel = Number.parseInt(footnote.label, 10);
  const displayNumber = footnote.referenceOrder ?? parsedLabel;
  return Number.isFinite(displayNumber) ? String(displayNumber) : footnote.label;
}

function formatBracketLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) {
    return "";
  }
  return /^\[.*\]$/.test(trimmed) ? trimmed : `[${trimmed}]`;
}

function formatFigureDisplayLabel(kind: PostFigure["kind"], index: number): string {
  return `${kind === "image" ? "图" : "表"}${index}`;
}

function getFootnoteTypeLabel(type: TufteRailFootnote["type"]): FootnoteRailEntry["typeLabel"] {
  return type === "reference" ? "引用" : "注释";
}

export function resolveFigureSourceLink(
  figureSourceLinks: Map<string, FigureSourceLink>,
  refId: string
): FigureSourceLink {
  return (
    figureSourceLinks.get(refId) ?? {
      id: refId,
      label: refId,
      href: `#ref-${refId}`,
      kind: "missing"
    }
  );
}

export function buildPostScholarRailModel({
  tocItems,
  figures = [],
  markdownFootnotes = [],
  showToc = true
}: BuildPostScholarRailModelInput): PostScholarRailModel {
  const sectionOrderBySlug = new Map<string, number>(tocItems.map((item, index) => [item.slug, index]));

  const anchoredEntries: AnchoredRailEntry[] = [
    ...figures.map(
      (figure) =>
        ({
          kind: "figure" as const,
          figure,
          noteType: "figure" as const,
          typeLabel: "图表" as const
        }) satisfies FigureRailEntry
    ),
    ...markdownFootnotes
      .filter((footnote) => Boolean(footnote.anchorId))
      .map(
        (footnote) =>
          ({
            kind: "footnote" as const,
            footnote,
            noteType: footnote.type,
            typeLabel: getFootnoteTypeLabel(footnote.type)
          }) satisfies FootnoteRailEntry
      )
  ].sort((a, b) => {
    const aAnchor = parseAnchorLocation(getAnchorId(a), sectionOrderBySlug);
    const bAnchor = parseAnchorLocation(getAnchorId(b), sectionOrderBySlug);

    const aSection = aAnchor?.sectionOrder ?? Number.POSITIVE_INFINITY;
    const bSection = bAnchor?.sectionOrder ?? Number.POSITIVE_INFINITY;
    if (aSection !== bSection) return aSection - bSection;

    const aParagraph = aAnchor?.paragraphIndex ?? Number.POSITIVE_INFINITY;
    const bParagraph = bAnchor?.paragraphIndex ?? Number.POSITIVE_INFINITY;
    if (aParagraph !== bParagraph) return aParagraph - bParagraph;

    const aItem = aAnchor?.itemIndex ?? 0;
    const bItem = bAnchor?.itemIndex ?? 0;
    if (aItem !== bItem) return aItem - bItem;

    const aOrder = getAnchoredEntryOrder(a);
    const bOrder = getAnchoredEntryOrder(b);
    if (aOrder !== bOrder) return aOrder - bOrder;

    return 0;
  });

  const unanchoredFootnotes: FootnoteRailEntry[] = markdownFootnotes
    .filter((footnote) => !footnote.anchorId)
    .map(
      (footnote) =>
        ({
          kind: "footnote" as const,
          footnote,
          noteType: footnote.type,
          typeLabel: getFootnoteTypeLabel(footnote.type)
        }) satisfies FootnoteRailEntry
    );

  const railEntriesBase: RailEntry[] = [
    ...(showToc && tocItems.length > 0 ? [{ kind: "toc" as const }] : []),
    ...anchoredEntries,
    ...unanchoredFootnotes
  ];

  let imageFigureNumber = 0;
  let tableFigureNumber = 0;
  const railEntries: RailEntry[] = railEntriesBase.map((entry) => {
    if (entry.kind === "toc") {
      return entry;
    }

    if (entry.kind === "figure") {
      if (entry.figure.kind === "image") {
        imageFigureNumber += 1;
      } else {
        tableFigureNumber += 1;
      }

      return {
        ...entry,
        number: formatFigureDisplayLabel(
          entry.figure.kind,
          entry.figure.kind === "image" ? imageFigureNumber : tableFigureNumber
        ),
        noteKey: `figure:${entry.figure.id}`,
        bubbleId: `marginalia-figure-${entry.figure.id}`
      };
    }

    return {
      ...entry,
      number: getFootnoteDisplayNumber(entry.footnote),
      noteKey: `footnote:${entry.footnote.id}`,
      bubbleId: `${TUFTE_RAIL_FOOTNOTE_ID_PREFIX}${entry.footnote.id}`
    };
  });

  const infoEntries = railEntries.filter((entry): entry is InfoRailEntry => entry.kind !== "toc");
  const tocEntry = railEntries.find((entry): entry is TocRailEntry => entry.kind === "toc");
  const figureSourceLinks = new Map<string, FigureSourceLink>();

  for (const entry of infoEntries) {
    if (entry.kind !== "footnote") {
      continue;
    }

    figureSourceLinks.set(entry.footnote.id, {
      id: entry.footnote.id,
      label: formatBracketLabel(entry.number ?? entry.footnote.label),
      href: `#${entry.bubbleId}`,
      kind: "footnote"
    });
  }

  return {
    railEntries,
    infoEntries,
    tocEntry,
    figureSourceLinks
  };
}
