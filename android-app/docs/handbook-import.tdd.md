# Complete handbook import evidence

28 November 2026. User request: import the handbook, write a resume note, push to Git, and put the project on hold. Follows the coverage/import work in `content-expansion-research.plan.md` with the existing reader and a backward-compatible content shape.

## What changed and why

- Removed the seven-section allowlist. All **191 structured handbook sections**, **125 prompt blocks**, and **85 glossary entries** now reach the offline app library.
- Added explicit handling for all eight source block types: paragraphs, preformatted text, headings, labels, prompts, checklist items, definition pairs, and tables. Tables are converted to labelled rows, preserving every heading/cell without requiring horizontal scrolling.
- Added chapter context to article/prompt resources, chapter browsing, and full glossary indexing. Project recommendations now include relevant chapters, including the full rescue chapter for repair needs.
- Existing body/prompts fields remain usable; optional chapter metadata is validated. Existing seven article IDs and all course identities are retained. The old frozen fixture remains the compatibility baseline; it was not rewritten to hide removals.
- `npm test` now regenerates content before testing so a clean checkout cannot silently test an old seven-article bundle. EAS already regenerates through its existing post-install hook.

## TDD evidence

- RED checkpoint `046deb8`: `node --test tests/handbook-import.test.mjs` ran four tests and all four failed: 7 rather than 191 sections, missing prompt blocks, omitted content, and missing glossary resources.
- GREEN checkpoint `6f05008`: importer/library/schema changes passed the coverage checks; full app suite initially passed 155 tests, type checking passed, and Android export passed.
- Added one formatter proof for labelled table rows, extra cells, definition pairs, and blank text; final suite passes **156 tests**.
- The existing compatibility removal test now explicitly removes a frozen legacy article rather than popping a newly appended article that did not exist in the legacy baseline.

## Verification

| Check | Result |
|---|---|
| Every source section imported once with ID/title/chapter context | PASS, 191 sections |
| Every source prompt available as a copyable resource | PASS, 125 prompts |
| All source paragraph/code/checklist/definition/table text retained | PASS |
| All 85 source glossary meanings reachable | PASS |
| Chapter filtering retains articles and related prompts | PASS |
| Unknown block types and duplicate section identities fail clearly | PASS |
| Importer formatter coverage | 100% lines, branches, functions |
| Final `npm test` | 156 passed, none failed or skipped |
| `npm run typecheck` | PASS |
| `npm run check:bundle` | PASS, Android export; bundle approximately 3.8 MB |
| `git diff --check` | PASS |

Combined library has **540 entries**: 214 learn resources, 91 glossary resources, 55 build-step troubleshooting resources, 180 prompts. Glossary count includes distinct course definitions; prompt count includes build prompts. The four generated documents total 481,064 UTF-8 bytes when compacted, within the existing 4 MiB content release limit.

## Limits and handoff

This imports the structured repository handbook, not a fresh OCR or independent audit of every PDF. It does not revise dated facts, add the separate web bonus quests or guided help flows, make worksheets editable, publish cloud content, or create a new EAS APK. Native layout/TalkBack/offline-device checks remain pending. See the root `RESUME_HERE.md`; the project is on hold at the user's request.
