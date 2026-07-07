# Content — Phase 2 (rest) + Phase 3 (chunk 2: page-builder + content)

Converts all 15 hardcoded `.astro` pages into a page-builder collection, adds the
`legal` collection, and moves navigation into an editable data file. Build-verified.

## Architecture built

| Piece | File |
| ----- | ---- |
| Page-builder Astro collection | `src/content.config.ts` — `pages` (`z.array(z.any())` blocks) + `legal` collections added |
| Block → component map | `src/cloudcannon/componentMap.ts` (18 `_type`s) |
| Block renderer | `src/components/BlockRenderer.astro` (`data-editable="array-item"` wrapper, spreads block props) |
| Catch-all route | `src/pages/[...slug].astro` — serves `pages` (layout switch `PageLayout`/`LandingLayout` + `content_blocks`) **and** `legal` (prose body). `index` → `/`, nested ids → `/homes/*`, `/landing/*` |
| CC schemas | `.cloudcannon/schemas/page-builder.md`, `.cloudcannon/schemas/landing.md` |
| Block structures | `cloudcannon.config.yml` `_structures.content_blocks` (18 blocks) + shared subs (`actions`, `items`, `stats`, `prices`, `price_items`, `testimonials`, `form_inputs`, `brand_images`) |
| Block field types | global `_inputs` in `cloudcannon.config.yml` (title/subtitle/content = `html`; image = object with `image.src` optimized-path picker; selects for `variant`/`target`; switches; etc.) |

### CC collections added

- **`pages`** (`src/content/pages`, `glob: !homes/** !landing/**`, `url: /[slug]/`) — index, about, services, pricing, contact.
- **`homes`** (`src/content/pages/homes`, `url: /homes/[slug]/`) — saas, startup, personal, mobile-app.
- **`landing`** (`src/content/pages/landing`, `url: /landing/[slug]/`) — 6 pages, `landing` schema.
- **`legal`** (`src/content/legal`, `url: /[slug]/`, content editor) — privacy, terms.

All three page collections use one Astro `pages` collection (nested files); CC splits them by URL prefix per the configuration skill.

## Content converted (15 pages → block YAML)

Every page's widgets were extracted into `content_blocks` arrays. `_type` discriminators
map to widgets via `componentMap`. Slot content (`<Fragment slot="title">`, `slot="content">`)
became `title`/`content` HTML frontmatter fields (widgets already render these via `set:html`).

Verified in `dist/` — block counts: index 12, about 8, services 6, pricing 6, contact 3,
saas 10, startup 9, personal 11, mobile-app 8, each landing 2. **Zero** `undefined`,
`[object Object]`, or `null` image leaks across all 17 routes.

### `set:html` styled fields

All widgets render `title`/`subtitle`/`tagline`/`content`/item `description` via `set:html`,
so inline HTML (`<span class="text-accent">`, `<br class="…">`) was preserved **verbatim** in
frontmatter and those inputs typed `type: html` (`allow_custom_markup: true`). Rendering is
pixel-identical to the original.

> **Chunk-3 refinement (noted, not done):** per `content.md`, Tailwind utility classes inside
> these HTML fields show as uneditable chips in CC's rich-text editor. The polish is to add
> `.cloudcannon/styles/editor.css` semantic classes (e.g. `.highlight`) and strip the Tailwind
> utilities. Deferred to visual editing — fidelity is already correct.

## Legal collection

`privacy.md` / `terms.md` moved `src/pages/ → src/content/legal/`, `layout:` frontmatter
stripped, `_schema: legal` added. The catch-all renders them with the same prose wrapper the
old `MarkdownLayout` used. URLs unchanged (`/privacy`, `/terms`).

## Navigation → editable data file

`src/navigation.ts` was TypeScript with inline `getPermalink()` calls (not editable).
Extracted to **`src/data/navigation.json`** (plain data; special links as `{type,url}` objects
for blog/category/tag/asset). `navigation.ts` now imports the JSON and runs AstroWind's existing
`applyGetPermalinks()` helper to resolve URLs at build time. Header/footer render identically
(verified: `/services`, `/homes/saas`, `/#features`, `/rss.xml`, blog links all resolve).

> **Not yet wired for editing:** `navigation.json` isn't in `collections_config`/`file_config`
> yet, so it's not browsable in the CC sidebar. Adding a `data` collection entry + nested-link
> structures is a small follow-up (recommended for the visual-editing chunk).

## Deliberate fidelity diffs (accept or revisit in visual editing)

Per `page-building.md` ("accept minor visual diffs rather than leak CSS/one-offs into content"):

| Page(s) | Diff | Reason |
| ------- | ---- | ------ |
| All page-builder pages | `bg` slots (blue-tint section backgrounds) dropped | `bg` is presentational slot HTML — excluded from structures. ~3 homepage + several homes sections lose a light-blue background. |
| homes/saas, personal, mobile-app | Custom per-page **header** (Login/Sign Up, custom nav, app links) → standard site header | Header slot override can't live in `content_blocks`; standard `PageLayout` header used. |
| homes/startup | Hero **YouTube video** dropped (hero renders without media) | Video lived in an `image` slot as a component, not an image `{src,alt}`. |
| homes/mobile-app | App Store / Google Play **badge images** → text buttons ("App Store"/"Google Play") | Badge images were `<Button><Image/></Button>` in an actions slot; modeled as text actions. |
| homes/personal | `Skills` Features3 bullet icons gone (`defaultIcon` dropped); block anchor `id`s (`#about` etc.) kept but no longer linked (custom nav dropped) | `defaultIcon`/`classes` are component-level, excluded from structures. |
| pricing, homes/saas | `price` stored as quoted strings (`'29'`, `'0'`) | Bare numbers with a `text` input trigger CC "misconfigured"; strings render identically. |
| FAQs (index) | `classes` width override dropped | CSS customization excluded from content. |

### Minor editor-cleanliness gaps (build/render correct; polish in chunk 3)

- Per-item `callToAction` on `homes/startup` Features3 and `homes/personal` Content items renders correctly but isn't declared in the shared `items` structure (shows as an extra field in CC).
- Anchor `id` on some blocks (blog_latest_posts, content, steps, hero_text) renders but isn't in every structure value (declared on `features`/`contact`).

## Verification run

- `npx @cloudcannon/cli validate` → both files valid. ✅
- `npm run build` → **36 pages, no errors/warnings**. ✅
- All 17 migrated routes present in `dist/` with correct block counts and no `undefined`/`null` leaks. ✅
- Hero optimized image (`~/assets/images/hero-image.png`) resolves to `webp`. ✅
- Navigation links + legal pages render correctly. ✅

## Handoff readiness (Phase 2 + 3 gates)

- Every audit collection now has a `collections_config` entry (`post`, `pages`, `homes`, `landing`, `legal`, `config`). ✅
- All 15 hardcoded pages restructured to content; build passes. ✅
- `cloudcannon.config.yml` validates. ✅

## Next chunk (3 — visual editing)

1. Create `src/icons/` (empty ok) to avoid `Unable to load the "local" icon set!` on re-render.
2. Patch scroll-reveal (`WidgetWrapper.astro` `intersect`/`opacity:0`) so blocks aren't invisible in the editor.
3. `registerComponents.ts` — `registerAstroComponent(_type, …)` for all 18 blocks (map already in `src/cloudcannon/componentMap.ts`).
4. Nested `data-editable` text/image/array regions inside each widget.
5. Optional polish: editor-styles CSS for `set:html` fields; wire `navigation.json` into the sidebar; declare `callToAction`/`id` on remaining structures.
