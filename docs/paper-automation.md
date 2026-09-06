# Paper PDF enrichment

The paper pipeline turns an author-provided or openly accessible PDF into:

1. a local extraction report containing Abstract and Introduction/Overview candidates;
2. ranked method-figure candidates based on captions such as `pipeline`, `workflow`, `architecture`, and `framework`;
3. a 1600×900 PNG cover cropped from the selected PDF page;
4. an auditable manifest containing the source hash, page, caption, score, crop box, and cover hash;
5. a generated `cover` block in the paper Markdown frontmatter.

It never bypasses publisher access controls. A DOI or publisher landing page is not treated as a PDF.

## Requirements

- Node.js `>=22.12`
- project dependencies (`pnpm install`)
- Poppler commands:
  - `pdftotext`
  - `pdftoppm`

On macOS:

```bash
brew install poppler
```

## Supplying a PDF

### Local author copy

Place the PDF at:

```text
.paper-sources/<paper-slug>.pdf
```

`.paper-sources/` is ignored by Git. The filename must match the Markdown filename in `src/content/papers/`.

### Public PDF

Add an explicit PDF resource to the paper frontmatter:

```yaml
resources:
  - type: pdf
    label: PDF
    url: https://example.org/open-paper.pdf
```

Only an HTTP response whose body begins with `%PDF-` is accepted. Downloads are capped at 100 MiB.

## Commands

Analyze one paper without changing published files:

```bash
pnpm papers:enrich --slug duap-multilingual-speech-privacy
```

Analyze all papers:

```bash
pnpm papers:enrich:all
```

Apply a high-confidence candidate:

```bash
pnpm papers:enrich --slug duap-multilingual-speech-privacy --apply
```

Apply all papers that have a legal PDF source and a high-confidence candidate:

```bash
pnpm papers:enrich:apply
```

Use an explicit PDF path:

```bash
pnpm papers:enrich \
  --slug duap-multilingual-speech-privacy \
  --pdf /absolute/path/to/paper.pdf \
  --apply
```

Choose a page manually when automatic ranking is uncertain:

```bash
pnpm papers:enrich \
  --slug duap-multilingual-speech-privacy \
  --pdf /absolute/path/to/paper.pdf \
  --figure-page 3 \
  --apply
```

If the page has no detectable figure caption, the manifest records it as a manual page selection. Pair it with `--crop` for precise output.

Override the normalized crop as `x,y,width,height`:

```bash
pnpm papers:enrich \
  --slug duap-multilingual-speech-privacy \
  --pdf /absolute/path/to/paper.pdf \
  --figure-page 3 \
  --crop 0.05,0.18,0.90,0.46 \
  --apply
```

`--force` only permits applying a low-confidence candidate. It does not overwrite a manually authored `cover` block.

Check committed covers and provenance manifests:

```bash
pnpm papers:check
```

This check is part of `pnpm test:all`.

## Outputs

Local review-only files:

```text
.paper-pipeline/reports/<slug>.json
```

The report contains extracted Abstract/Overview candidates and up to eight ranked figure candidates. It is ignored by Git so publisher text is not accidentally republished.

Committed site files after `--apply`:

```text
src/content/papers/covers/<slug>-pipeline.png
src/content/papers/automation/<slug>.json
src/content/papers/<slug>.md
```

The manifest stores hashes and crop provenance, not the extracted paper text. The generated Markdown block is delimited by:

```yaml
# paper-automation:start
cover:
  # ...
# paper-automation:end
```

## Confidence and review rules

- Captions must start with `Figure`, `Fig.`, or `图`.
- Pipeline terms raise the candidate score.
- Tables and appendix/supplement captions are penalized.
- Automatic apply requires score `>=7`.
- Lower scores produce `review-needed` and do not change the site.
- The crop uses the last large text gap before the caption as the likely figure top boundary.
- `--figure-page` and `--crop` are explicit, auditable overrides.

After generating a real cover, review `/papers` and the paper detail page in both desktop and mobile layouts before publishing.
