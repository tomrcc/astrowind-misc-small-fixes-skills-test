# Configuration — Phase 2 (chunk 1: foundational config)

This chunk configured everything that could be made editable **without
restructuring files**. The page-builder conversion of the 15 widget-composed
pages is deferred to the next chunk (see `plan.md`).

## What was done

### Files created / changed

| File | Change |
| ---- | ------ |
| `cloudcannon.config.yml` | Written (replaced the CLI's poor baseline: it had proposed `src`, `source`, `pages=src/pages` junk collections). |
| `.cloudcannon/initial-site-settings.json` | Build settings — `ssg: astro`, `npm i` / `npm run build` / `dist`, node 22. |
| `.cloudcannon/README.md` | Editor-facing site guide. |
| `astro.config.ts` | Added `AutoImport` (before `mdx()`) for the MDX component pipeline. |
| `src/data/post/markdown-elements-demo-post.mdx` | Removed the top-level `import` lines (now auto-injected). Demo code-block examples left untouched. |
| `package.json` | Added `astro-auto-import`. |
| `.gitignore` | Ignore the downloaded CC JSON schemas under `.cloudcannon/migration/`. |

### Collections configured

- **`post`** (blog, `src/data/post`) — the one real content collection. Fully configured:
  - `url: '/[slug]/'` — verified against `dist/`: posts build to `/<slug>/index.html`.
    The slug comes from the **filename** (`cleanSlug(id)` in `utils/blog.ts`, permalink
    pattern `/%slug%`), so `[slug]` (filename) is correct — **not** `{slug}`.
  - `_enabled_editors: [visual, content, data]` (visual default for existing posts).
  - `add_options` with `editor: content` so **new** posts open in the content editor
    (posts have a `draft` field; drafts aren't built, so the visual editor has no page).
  - `_inputs` for every schema field: `title` text, `excerpt` textarea, dates as
    `datetime`, `draft` switch, `image` image, `tags` array, `metadata` object (advanced SEO).
  - `_structures.og_images` linked from `metadata.openGraph.images` (the one nested array).
- **`config`** (`src/config.yaml`) — surfaced in the sidebar under **Site**, data-editor only,
  `disable_url: true`. `file_config` gives its top-level sections (`site`, `metadata`, `apps`,
  `analytics`, `ui`) object previews, and `ui.theme` a `select` input.

### Snippets (MDX)

Full MDX pipeline completed (all 4 steps):
1. `astro-auto-import` installed.
2. Registered in `astro.config.ts` **before** `mdx()`, importing `Logo` (default) and
   `YouTube`/`Tweet`/`Vimeo` (named, from `astro-embed`).
3. Top-level `import` lines removed from the only MDX file that used components.
4. `_snippets` entries (`logo`, `youtube`, `tweet`, `vimeo`) using the built-in
   `mdx_component` template, with `_inputs` for the `id` props.

Component inventory grep (`Logo`, `YouTube`, `Tweet`, `Vimeo`) → every one has a `_snippets` entry. ✅

### Verification run in this session

- `npx @cloudcannon/cli validate` → both files valid. ✅
- `npm run build` → 36 pages built, no errors. ✅
- `markdown-elements-demo-post` renders the embeds (`lite-youtube`, `vimeo`, `tweet`, Logo 🚀)
  with **no leaked imports** — auto-import pipeline confirmed working end-to-end. ✅

## Deferred to later chunks (with reasons)

| Item | Why deferred | Chunk |
| ---- | ------------ | ----- |
| **`pages` page-builder collection** (index, about, services, pricing, contact) | Requires creating `src/content/pages/`, extracting ~11-section widget compositions into YAML block arrays, a `z.union` schema, a catch-all route, a `BlockRenderer`, and ~22 widget structures. This is intertwined config + content + visual-editing work. | 2–3 |
| **`homes` / `landing` collections** | Same page-builder machinery, split by subdirectory URL. | 2–3 |
| **`legal` collection** (privacy/terms) | Moving `privacy.md`/`terms.md` out of `src/pages` into a collection + a render route is a content-phase file move. | 3 |
| **Navigation editability** | `src/navigation.ts` is TypeScript with `getPermalink()` calls — not plain data. Needs refactoring to a data file (resolving permalinks at render) before it can be data-edited. | 3 |

## Open decisions for the next chunk

- **`set:html` fields** — widget titles/subtitles carry inline HTML (`<span class="text-accent">`,
  `<br class="block sm:hidden">`). When these become page-builder fields they need `type: html`
  with a `.cloudcannon/styles/editor.css` for the accent classes, OR the styling moves into the
  component and the field becomes plain text. Decide per-field in the content chunk.
- **`src/icons/` missing** — create it (even empty) before the visual-editing chunk to avoid
  `Unable to load the "local" icon set!` when `editableRegions()` re-renders widgets.
- **Scroll-reveal patch** — `WidgetWrapper.astro`'s `intersect`/`opacity:0` animation must be
  disabled inside the CloudCannon editor before wiring visual editing.

## Handoff readiness (Phase 2 gate)

- `cloudcannon.config.yml` validates against the schema. ✅
- Every collection **configured in this chunk** has a `collections_config` entry, correct `url`
  (or `disable_url`), inputs, and structures. ✅
- Build passes. ✅
- **Not** a complete Phase 2 for the whole site — the page-builder collections are the remaining
  Phase 2 work, folded into the content/visual-editing chunk per `plan.md`.
