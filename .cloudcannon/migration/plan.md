# Migration plan

## Sizing

- Total pages: ~26 source / >30 rendered (threshold >30: borderline)
- Hardcoded → YAML conversions: 15 (threshold >15: borderline — at the line)
- Distinct collections: 3 (threshold >5: ok)
- Tripped: ~1/3 strictly → single-pass is _permitted_, but Phase 4 is heavy enough that chunking is recommended.

## Shape (if chunking)

**Horizontal (per-phase)** — because the 15 page-builder pages are highly uniform (all composed from the same ~22 shared widgets). One mental model per phase (all config, then all content, then all visual editing) beats jumping widget-by-widget. Phase 4 is the natural fresh-conversation boundary.

## Chunks

Each chunk is one agent run, ideally a fresh conversation once context is heavy. The agent reads `audit.md` + this file + the listed phase doc, does the scope, writes the artefact, stops.

Revised after chunk 1 to reflect real effort (the page-builder work is intertwined
config + content + visual-editing and is the bulk of the migration):

| #   | Scope | Phase(s) | Inputs | Output artefact | Status |
| --- | ----- | -------- | ------ | --------------- | ------ |
| 1   | **Foundational config** (no file restructuring): `post` blog collection, `config` site-settings collection, MDX snippets pipeline, build settings, editor README | 2 (partial) | audit.md | cloudcannon.config.yml + configuration.md | ✅ done |
| 2   | **Page-builder architecture + content**: `src/content/pages/` + schema, catch-all route, `BlockRenderer` + componentMap, 18 widget structures, convert index/about/services/pricing/contact + homes/* + landing/* to block YAML, resolve `set:html` fields, `legal` collection, navigation → data file | 2 (rest) + 3 | audit.md, configuration.md | content.md | ✅ done |
| 3   | **Visual editing**: register components, wire editable regions, create `src/icons/`, patch scroll-reveal animations | 4 | audit.md, configuration.md, content.md | visual-editing.md | ✅ done |
| 4   | **Build & test** end-to-end; hand off for CloudCannon verification | 5 | all above | build.md | ⬜ |

> Chunk 2 is large; consider splitting by page group (top-level pages → homes → landing)
> if context gets heavy. AstroWind's uniform widget set means structures defined for the
> top-level pages are reused by homes/landing, so do those first.

## Global decisions locked in chunk 1 (do not revisit)

- ✅ `post` collection `url: '/[slug]/'` — filename-based, verified against `dist/`.
- ✅ Snippet configs for `<Logo>`, `<YouTube>`, `<Tweet>`, `<Vimeo>` (MDX) — done, build-verified.
- ✅ `config` (`src/config.yaml`) exposed as a data collection.
- One `pages` collection (page-builder) holds homepage, about, services, pricing, contact; split
  `homes/*` and `landing/*` into their own collections by URL prefix — **not** a collection-of-one per page.
- Shared block structures for the ~22 widgets defined once in `_structures` (or co-located files).
- `legal` = fixed-schema markdown collection for privacy/terms (decide vs. source-editable in chunk 2).
- Navigation (`src/navigation.ts`) treatment: refactor to a data file resolving permalinks at render.
- `set:html` widget fields → `type: html` + `.cloudcannon/styles/editor.css`, or plain text + component styling.

**Resumption brief** (paste into a fresh conversation): "Read `.cloudcannon/migration/audit.md`, `.cloudcannon/migration/plan.md`, and the phase doc(s) for chunk N. Work chunk N's scope. Write the output artefact and stop."
