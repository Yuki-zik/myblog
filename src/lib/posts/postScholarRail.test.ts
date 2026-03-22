import { describe, expect, it } from "vitest";
import type { TufteRailFootnote } from "../markdown/rehypeTufteFootnotes";
import type { PostTocItem } from "./toc";
import { buildPostScholarRailModel, resolveFigureSourceLink } from "./postScholarRail";

const tocItems: PostTocItem[] = [
  {
    depth: 2,
    slug: "intro",
    text: "Intro",
    index: 1,
    numberLabel: "1"
  },
  {
    depth: 2,
    slug: "details",
    text: "Details",
    index: 2,
    numberLabel: "2"
  }
];

describe("buildPostScholarRailModel", () => {
  it("merges typed markdown footnotes with figures while preserving original footnote numbers", () => {
    const markdownFootnotes: TufteRailFootnote[] = [
      {
        id: "note-anchor-contract",
        label: "1",
        type: "note",
        html: "<p>Anchor contract.</p>",
        anchorId: "intro::p1",
        referenceOrder: 1
      },
      {
        id: "ref-supabase-rls",
        label: "2",
        type: "reference",
        html: "<p>Supabase Documentation - RLS.</p>",
        anchorId: "details::p1",
        referenceOrder: 2
      },
      {
        id: "note-optimistic-tradeoff",
        label: "3",
        type: "note",
        html: "<p>Optimistic UI needs rollback.</p>",
        anchorId: "details::p3",
        referenceOrder: 3
      }
    ];

    const model = buildPostScholarRailModel({
      tocItems,
      figures: [
        {
          id: "anchor-diagram",
          anchorId: "details::p2",
          title: "Anchor diagram",
          kind: "image",
          sourceRefIds: ["ref-supabase-rls"]
        }
      ],
      markdownFootnotes,
      showToc: false
    });

    expect(
      model.infoEntries.map((entry) => {
        if (entry.kind === "figure") {
          return {
            kind: entry.kind,
            number: entry.number,
            noteKey: entry.noteKey
          };
        }

        return {
          kind: entry.kind,
          number: entry.number,
          noteKey: entry.noteKey,
          footnoteType: entry.footnote.type
        };
      })
    ).toEqual([
      {
        kind: "footnote",
        number: "1",
        noteKey: "footnote:note-anchor-contract",
        footnoteType: "note"
      },
      {
        kind: "footnote",
        number: "2",
        noteKey: "footnote:ref-supabase-rls",
        footnoteType: "reference"
      },
      {
        kind: "figure",
        number: "图1",
        noteKey: "figure:anchor-diagram"
      },
      {
        kind: "footnote",
        number: "3",
        noteKey: "footnote:note-optimistic-tradeoff",
        footnoteType: "note"
      }
    ]);

    expect(model.figureSourceLinks.get("ref-supabase-rls")).toEqual({
      id: "ref-supabase-rls",
      label: "[2]",
      href: "#marginalia-footnote-ref-supabase-rls",
      kind: "footnote"
    });
  });

  it("returns a missing source link fallback for unresolved figure references", () => {
    const model = buildPostScholarRailModel({
      tocItems: [],
      markdownFootnotes: [],
      figures: [
        {
          id: "anchor-diagram",
          title: "Anchor diagram",
          kind: "image",
          sourceRefIds: ["ref-missing"]
        }
      ],
      showToc: false
    });

    expect(resolveFigureSourceLink(model.figureSourceLinks, "ref-missing")).toEqual({
      id: "ref-missing",
      label: "ref-missing",
      href: "#ref-ref-missing",
      kind: "missing"
    });
  });
});
