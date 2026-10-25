/** English companion to the existing Markdown template; measurement semantics match. */
export const englishLogTemplate = `# Agent work log

> One entry per day. Leave unmeasured values blank; enter 0 only for an observed zero. Human time includes setup, review, coordination and rework.

## Date: YYYY-MM-DD

- Reporting timezone:
- Peak concurrent independent tasks:
- Total human effort (minutes):
- Of which rework (minutes, a subset of total effort):
- Task log complete for the day: yes / no
- Models, tools and working practices:
- Cost (amount, currency, actual bill or allocated subscription):

## Tasks

| Stable task ID | Goal / category | Predefined acceptance criteria | Status | Delivery evidence link | Notes |
|---|---|---|---|---|---|
| | | | Active / Accepted / Rejected / Abandoned | | |

Reuse the same ID for one acceptance goal across windows, subagents and retries. Retain failures and abandoned tasks. Count accepted work on its actual acceptance date.

## What did you observe today?

Where did human time go?

Which work advanced, and which work added coordination or rework?

What did you complete that you previously had no time for?

What changed in models or processes?

> This is a personal observation. Productivity comparisons require actual comparisons with similar task types, scope and acceptance criteria.
`;
export const englishLogDownload = `data:text/markdown;charset=utf-8,${encodeURIComponent(englishLogTemplate)}`;
