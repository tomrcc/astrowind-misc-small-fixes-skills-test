# Visual editing — Phase 4 (chunk 3)

Adds CloudCannon Visual Editor support on top of the page-builder architecture
built in chunk 2. Registers all 18 block components for live re-rendering, wires
nested `data-editable` regions inside every widget, patches the scroll-reveal
animation so blocks aren't invisible in the editor, and creates `src/icons/`.

## Infrastructure

| Piece | File | Notes |
| ----- | ---- | ----- |
| Package | `@cloudcannon/editable-regions` (dependency) | Installed via setup script. |
| Astro integration | `astro.config.ts` → `editableRegions()` inside `integrations[]` | Builds the client bundle that re-renders registered components. |
| Component registration | `src/cloudcannon/registerComponents.ts` | Loops over the shared `componentMap` and calls `registerAstroComponent(_type, …)` for all 18 blocks — keys can never drift from `BlockRenderer`. |
| Conditional load | `src/layouts/Layout.astro` `<script>` | `if (window.inEditorMode) import('../cloudcannon/registerComponents')` — kept out of the production bundle. |
| `window.inEditorMode` type | `src/env.d.ts` | `Window.inEditorMode?: boolean`. |
| Icon set dir | `src/icons/.gitkeep` | Prevents `Unable to load the "local" icon set!` on re-render. |
| Scroll-reveal patch | `src/assets/styles/tailwind.css` (`.cms-editor-active`) | Forces `opacity:1` / no-animation on reveal elements inside the editor only. |

### Page-builder wiring (already built in chunk 2, verified for this phase)

- `src/pages/[...slug].astro` — array wrapper: `<div data-editable="array" data-prop="content_blocks" data-component-key="_type">`. `data-id-key`/`data-id` omitted (default to the component key since Dec 2025).
- `src/components/BlockRenderer.astro` — thin dispatcher: `<section data-editable="array-item" data-component={_type} data-id={_type}><Component {...props} /></section>`. No double-nesting (widgets don't emit their own `array-item`).
- `src/cloudcannon/componentMap.ts` — single source of truth, imported by both `BlockRenderer` and `registerComponents`.

## Section census

Data scope for every widget below is the block's own frontmatter object
(`content_blocks[n]`), so all nested `data-prop` paths are **relative** (e.g.
`data-prop="title"` → `content_blocks[n].title`). Sub-array item paths resolve
one level deeper (`items[m].title`). Shared sub-components (`Headline`,
`Timeline`, `Button`, `Form`) carry the editable attributes on behalf of the
widgets that delegate to them — scoping still resolves against the parent block.

### Page-builder blocks (18 `_type`s)

| `_type` | Component | Treatment | Binding plan | Data completeness |
| ------- | --------- | --------- | ------------ | ----------------- |
| `hero` | Hero.astro | text + image + array | `title`/`subtitle`/`tagline`/`content` text; `image` via `<editable-image data-prop="image">`; `actions` array → each `Button` label editable (`data-prop="text"`) | All in frontmatter. `content` block-level (`data-type="block"`). |
| `hero2` | Hero2.astro | text + image + array | identical to `hero` | ✅ |
| `hero_text` | HeroText.astro | text + component-button | `title`/`subtitle`/`tagline`/`content` text; `callToAction`/`callToAction2` labels editable (`callToAction.text`) | Single CTA objects; variant/target/href sidebar. |
| `note` | Note.astro | text | `title` text; `description` text | `icon` sidebar-only (icon name). |
| `features` | Features.astro | text + array | `Headline` title/subtitle/tagline; `items` array → `title`, `description`, per-item `callToAction` label | `icon` per item sidebar-only. |
| `features2` | Features2.astro | text + array | identical to `features` | ✅ |
| `features3` | Features3.astro | text + image + array | `Headline`; `image` editable; `items` array as `features` | `icon` per item sidebar-only. |
| `steps` | Steps.astro | text + image + array | `Headline`; `image` editable; `items` via `Timeline` → `title`, `description` | `icon` per item sidebar-only. `callToAction` in structure but widget doesn't render it (chunk-2 fidelity note). |
| `steps2` | Steps2.astro | text + array + component-button | `Headline`; `items` inline → `title`, `description`; `callToAction` label (`callToAction.text`) | `icon` per item sidebar-only. |
| `content` | Content.astro | text + image + array | `Headline`; `content` text block; `image` editable; `items` array → `title`, `description`, per-item CTA; top-level `callToAction` label | `icon` per item sidebar-only. |
| `call_to_action` | CallToAction.astro | text + array | `Headline`; `actions` array → each `Button` label (`data-prop="text"`) | ✅ |
| `faqs` | FAQs.astro | text + array | `Headline`; `items` array → `title`, `description` | `icon` per item sidebar-only. |
| `stats` | Stats.astro | text + array | `Headline`; `stats` array → `amount`, `title` | `icon` per item sidebar-only. |
| `pricing` | Pricing.astro | text + array (nested) | `Headline`; `prices` array → `title`, `subtitle`, `price`, `period`, nested `items` sub-array → `description`, `callToAction` label | `hasRibbon`/`ribbonTitle`/`icon` sidebar. |
| `testimonials` | Testimonials.astro | text + image + array | `Headline`; `testimonials` array → `title`, `testimonial`, `name`, `job`, `image`; top-level `callToAction` label | ✅ |
| `contact` | Contact.astro / Form.astro | text + array | `Headline`; `inputs` array → `label`; `textarea.label`; `disclaimer.label`; `button`; `description` | Field `type`/`name`/`placeholder`/`autocomplete` sidebar-only (input config, not display text). |
| `brands` | Brands.astro | text + array + image | `Headline`; `icons` array (CRUD, name via sidebar); `images` array → each `<editable-image data-prop-src="src">` | Icon names not inline-editable (render as SVG). |
| `blog_latest_posts` | BlogLatestPosts.astro | text | `title` text; `information` text; `linkText` via `Button` label | Post grid is cross-collection (from `post`); `count`/`linkText URL` sidebar. Posts editable in their own collection. |

### Shared partials

| Section | Where | Treatment | Justification |
| ------- | ----- | --------- | ------------- |
| Header / navigation | `Header.astro` ← `navigation.ts` ← `navigation.json` | `data-file` (Data editor, sidebar-only inline) | **Technical:** hrefs are resolved at build time through `getPermalink()`/`getBlogPermalink()`/`getAsset()` in `navigation.ts`, and special links are `{type,url}` objects. Inline `@data[navigation]` editing would write raw values that bypass the resolver and corrupt the `{type,url}` shape. Wired into the CC **Data** editor (see Polish) so it stays editable there. Matches the reference guidance that nested nav structures belong in the sidebar/data editor. |
| Footer link columns + social/secondary + footNote | `Footer.astro` ← `navigation.json` | `data-file` (Data editor) | Same resolver/`{type,url}` reason as header (RSS social link is `{type:'asset'}`); managed in the Data editor. |
| Announcement bar | `Announcement.astro` | `sidebar-only` (documented exception) | Fully hardcoded promo banner (no props, no data backing) containing an external shields.io stars badge and one-off marketing copy. Not part of the page-builder content model and not in the migration plan's scope; converting to a data file is deferred. Dev-managed. |
| Legal body (privacy/terms) | `[...slug].astro` legal branch | `text` (`@content` + `title`) | `legal` collection uses the **content** editor, not visual; `title` + `@content` editables added for completeness/harmlessness. |

## Implementation

Editable attributes were added on the shared sub-components wherever possible so
the wiring cascades to every widget that delegates to them:

| File | What was added |
| ---- | -------------- |
| `ui/Headline.astro` | `data-editable="text"` on `tagline`/`title`/`subtitle` — covers Features, Features2, Features3, Steps, Steps2, Content, CallToAction, FAQs, Stats, Pricing, Testimonials, Contact, Brands. |
| `ui/Button.astro` | New optional `labelProp` prop. When set, the label renders as an inline `<span data-editable="text" data-prop={labelProp}>`; left undefined for buttons outside an editable scope (Header). Props type extended with `labelProp?`. |
| `ui/Timeline.astro` | `items` array + `title`/`description` text (used by Steps). |
| `ui/Form.astro` | `inputs` array (label editable), `textarea.label`, `disclaimer.label`, submit `button` (via `labelProp`), `description` (used by Contact). |
| `widgets/Hero.astro`, `Hero2.astro`, `HeroText.astro` | Direct text regions (`title`/`subtitle`/`tagline`/`content` block), `actions` array with per-button `labelProp="text"` (Hero/Hero2), single-CTA `labelProp` (HeroText), and `<editable-image data-prop="image">`. |
| `widgets/Note.astro` | `title` + `description` text; guarded `<Icon>` on truthy name. |
| `widgets/Features*.astro`, `FAQs.astro`, `Content.astro` | `items` array (`title`, `description`, per-item CTA `labelProp`); Features3/Content add `<editable-image>`. |
| `widgets/Steps.astro` / `Steps2.astro` | image editable / inline `items` array; CTA `labelProp`. |
| `widgets/Stats.astro` | `stats` array → `amount`, `title`. |
| `widgets/Pricing.astro` | `prices` array → `title`, `subtitle`, `price`, `period`, nested `items` sub-array → `description`, CTA `labelProp`. |
| `widgets/Testimonials.astro` | `testimonials` array → `title`, `testimonial` (wrapped so decorative quotes stay outside), `name`, `job`, `image`; CTA `labelProp`. |
| `widgets/Brands.astro` | Split `icons` / `images` into separate `data-editable="array"` containers (purity); brand images via `<editable-image data-prop-src="src">`; guarded icon render. |
| `widgets/BlogLatestPosts.astro` | `title`, `information`, and `linkText` (`<editable-text>` so the `»` stays outside the region). |
| `pages/[...slug].astro` (legal branch) | `title` + `@content` block editable. |

### Notes / deliberate choices

- **Image binding:** frontmatter images are `{src, alt}` objects, bound with
  `<editable-image data-prop="image">` (object mode). The `Image` branch is
  guarded on `image.src` so an empty object never renders a broken `<img>`
  (add-an-image is done from the sidebar until a src exists). Remote-URL and
  string-slot branches are preserved unchanged.
- **Button labels via `labelProp`:** avoids duplicating markup and keeps the
  shared `Button` reusable in non-editable contexts. `data-prop` is relative to
  the surrounding block/array-item (`text` in an actions array; `callToAction.text`
  for single-CTA widgets).
- **Sub-array item guards:** Pricing `items` and other rows now always render an
  `array-item` (inner text guarded) so array-item count matches data length —
  required for CRUD alignment. No production render change (all real rows are
  populated).
- **Icons stay sidebar-only** (`icon`/`defaultIcon` fields): they render as SVG
  from a name lookup — not inline-editable — but every `<Icon>` is guarded on a
  truthy name so re-renders with a cleared icon don't throw.
- No `<template>` blueprints were needed: the top-level page-builder array is
  handled by the component pipeline, and widget sub-arrays re-render through
  their registered parent widget.

## Verification

- `npx @cloudcannon/cli validate` → ✅ `cloudcannon.config.yml` and
  `.cloudcannon/initial-site-settings.json` valid.
- `npm run build` → ✅ **36 pages, no errors/warnings.**
- `npm run check:astro` → 4 errors, **all pre-existing** in files not touched by
  this chunk: `PageLayout.astro` / `LandingLayout.astro` (chunk-2 navigation
  `{type,url}` href objects don't satisfy the `Link`/`MenuLink` string type) and
  `BlockRenderer.astro` (`as never` cast). Type-only; build is unaffected. **Zero
  new type errors** introduced by chunk 3 (the `labelProp` and `image.src`
  additions are fully typed).
- **Registration:** all 18 content `_type` values map 1:1 to `componentMap`
  keys and to `data-component` values in `dist/` (`hero`, `hero2`, `hero_text`,
  `note`, `features`, `features2`, `features3`, `steps`, `steps2`, `content`,
  `call_to_action`, `faqs`, `stats`, `pricing`, `testimonials`, `contact`,
  `brands`, `blog_latest_posts`).
- **Build grep (`dist/`):** `data-component-key="_type"` (15 pages), 371
  `array-item`, 114 `array`, 712 `text` regions, 51 `<editable-image>`,
  `@content` on both legal pages. No double `array-item` nesting.
- **Production isolation:** `registerAstroComponent`/`cc_components` do **not**
  appear in any `dist/*.html`; registration is emitted as a lazy client chunk
  (`_astro/registerComponents.*.js`) loaded only behind `window.inEditorMode`.
- **Scroll-reveal:** `.cms-editor-active` override compiled into the site CSS;
  reveal elements forced to `opacity:1`/no-animation inside the editor only.

## Pre-handoff sweep

- **Census walk-through** — every page-builder block row is implemented in the
  repo (not merely proposed). Shared-partial rows have written technical
  justifications.
- **Shared-UI table** — Header/Footer navigation is backed by
  `src/data/navigation.json`, now wired into `data_config` + `file_config` with
  nested-link `_structures` (`nav_menu`, `nav_footer_columns`, `nav_sublinks`,
  `nav_actions`, `nav_social`) so it's editable in the **Data** editor. Inline
  visual editing of nav is intentionally sidebar-only (build-time permalink
  resolution + `{type,url}` link objects — see census justification). Announcement
  bar documented as a hardcoded dev-managed exception.
- **Build grep** — footer, nav, cta, and all widget sections resolve editable
  attributes in `dist/`.

## Deferred / out of scope (for a follow-up)

- **Chunk-2 navigation typing:** `Header`/`Footer`/`MenuLink` types (or
  `navigation.ts`) should be widened to accept `{type,url}` hrefs to clear the 4
  `astro check` errors. This is chunk-2 debt, not visual-editing work.
- **Legacy Tailwind utilities inside `set:html` fields:** `editor.css` now ships
  semantic classes (`.highlight`, `.text-accent`), but existing content bodies
  still carry raw Tailwind utilities. Migrating them is presentation polish
  (rendering is already correct) — deferred per `content.md`.
- **Steps `callToAction`:** present in the block structure but the `Steps.astro`
  widget never rendered it (chunk-2 fidelity note); left as-is.
