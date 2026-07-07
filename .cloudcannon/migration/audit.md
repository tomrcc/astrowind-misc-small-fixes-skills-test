# Migration Audit — AstroWind

_Phase 1 deliverable. Records what exists before any changes._

## 1. Astro version and dependencies

- **Astro**: `^6.4.2` (Astro 6 — new content-layer API, `glob()` loader, `src/content.config.ts`). No Astro 4→5 upgrade decision needed.
- **CSS**: Tailwind CSS v4 (`@tailwindcss/vite`), `@tailwindcss/typography` installed.
- **Markdown**: MDX (`@astrojs/mdx`), custom remark (`readingTimeRemarkPlugin`) + rehype (`responsiveTablesRehypePlugin`) plugins. `astro-embed` for YouTube/Tweet/Vimeo.
- **Icons**: `astro-icon` with `tabler:*` (all) and a fixed set of `flat-color-icons:*`. ⚠️ **No `src/icons/` directory exists** — see Flags.
- **Integrations**: `@astrojs/sitemap`, `@astrojs/partytown` (disabled via `hasExternalScripts=false`), `astro-compress`, custom `astrowind` vendor integration (`./vendor/integration`) reading `src/config.yaml`.
- **Other**: `sharp` (image processing), `unpic` (remote CDN image rewriting), `astro-seo`, `limax` (slugify), `lodash.merge`, `reading-time`.
- **Package manager**: npm (package-lock present). **Node**: `>=22.12.0`.
- **Output**: `static` (CloudCannon-compatible ✅).

## 2. Content collections

Single collection defined in `src/content.config.ts`:

| Collection | Loader | Base | Structure | Rendered as page? |
| ---------- | ------ | ---- | --------- | ----------------- |
| `post`     | `glob({ pattern: ['*.md','*.mdx'], base: 'src/data/post' })` | `src/data/post` | flat files (6 entries) | Yes — `[...blog]/index.astro` via `SinglePost` + `post.render()` |

**Schema fields**: `publishDate?`, `updateDate?`, `draft?`, `title`, `excerpt?`, `image?` (string), `category?`, `tags?[]`, `author?`, `metadata?` (nested SEO object — title, robots, openGraph, twitter, canonical).

Consumed via `getCollection`/helpers in `src/utils/blog.ts` (`getStaticPathsBlogPost`, `getStaticPathsBlogList`, related-posts, categories, tags). `post.permalink` is **computed** in `utils/blog` from `config.yaml`'s `apps.blog.post.permalink` pattern (`/%slug%`) — the CC `url` must mirror this, not the filename.

**Posts**: 6 (`.md` ×4, `.mdx` ×2).

### Data / config outside collections

- **`src/config.yaml`** — site config: name/site/base/trailingSlash, default SEO metadata, `apps.blog` (postsPerPage, permalink patterns, category/tag pathnames, related-posts), analytics, `ui.theme`. Read by the `astrowind` vendor integration. **Editable-config candidate** (data panel).
- **`src/navigation.ts`** — `headerData` + `footerData` exported TS objects. ⚠️ They call `getPermalink()` / `getBlogPermalink()` / `getAsset()` helpers inline, so they are **not plain data** — cannot be dropped into a YAML/JSON data file without refactoring the helper calls out. Header has nested dropdowns (Homes, Pages, Landing, Blog); footer has 4 link columns + secondary/social links + `footNote` (HTML string).

## 3. Pages and routing

### Static, widget-composed (`.astro`) — page-builder candidates

| Page | Layout | Widgets / sections |
| ---- | ------ | ------------------ |
| `index.astro` | PageLayout | Hero, Note, Features, Content×3, Steps, Features2, BlogLatestPosts, FAQs, Stats, CallToAction (11) |
| `about.astro` | PageLayout | Hero, Stats, Features3×2, Steps2×2, Features2×2 (7) |
| `services.astro` | PageLayout | Hero, Features2, Content×2, Testimonials, CallToAction (6) |
| `pricing.astro` | PageLayout | HeroText, Pricing, Features3, Steps, FAQs, CallToAction (6) |
| `contact.astro` | PageLayout | HeroText, Contact (form), Features2 (3) |
| `homes/saas.astro` | PageLayout (custom header slot) | Hero2, Features, Steps2, Content, Pricing, FAQs, BlogLatestPosts (7) |
| `homes/startup.astro` | PageLayout | similar mix |
| `homes/personal.astro` | PageLayout | similar mix |
| `homes/mobile-app.astro` | PageLayout | similar mix |
| `landing/product.astro` | LandingLayout | Hero, CallToAction (2) |
| `landing/click-through.astro` | LandingLayout | similar |
| `landing/lead-generation.astro` | LandingLayout | similar (Contact form) |
| `landing/pre-launch.astro` | LandingLayout | similar (Countdown) |
| `landing/sales.astro` | LandingLayout | similar |
| `landing/subscription.astro` | LandingLayout | similar |

### Markdown pages

| Page | Layout | Notes |
| ---- | ------ | ----- |
| `privacy.md` | MarkdownLayout (via `layout:` frontmatter) | title + long prose body |
| `terms.md`   | MarkdownLayout | title + long prose body |

### System / dynamic

- `404.astro` — hardcoded system page (Layout base). **Keep hardcoded.**
- `[...blog]/index.astro` — single post (`prerender`, `getStaticPathsBlogPost`). URL from `post.permalink`.
- `[...blog]/[...page].astro` — blog list + pagination (`paginate()`).
- `[...blog]/[category]/[...page].astro` — category taxonomy (from frontmatter `category`).
- `[...blog]/[tag]/[...page].astro` — tag taxonomy (from frontmatter `tags`).
- `rss.xml`, sitemap (integration). Taxonomy routes are derived from frontmatter, **not** backed by their own collections.

## 4. Layouts and components

- **`Layout.astro`** — base: `<head>` (CommonMeta, Metadata, Favicons, analytics), applies color mode, BasicScripts. Default slot.
- **`PageLayout.astro`** — Announcement + Header (`headerData`) + `<main><slot/></main>` + Footer (`footerData`). All slots overridable.
- **`LandingLayout.astro`** — wraps PageLayout with a minimal Header (single nav group + Download action), no footer nav.
- **`MarkdownLayout.astro`** — PageLayout + `prose` wrapper around `<slot/>`. Used by `privacy.md`/`terms.md`.

**Widgets (`src/components/widgets/`)** — ~22: Hero, Hero2, HeroText, Note, Features, Features2, Features3, Steps, Steps2, Content, CallToAction, FAQs, Stats, Pricing, Testimonials, Brands, Contact, Announcement, BlogLatestPosts, BlogHighlightedPosts, Header, Footer.
**UI (`src/components/ui/`)**: Button, Form, Headline, Timeline, WidgetWrapper.
**Common**: Image (unpic wrapper), Metadata, SocialShare, Toggle*, Analytics, etc. **Blog**: Grid, GridItem, List, ListItem, Pagination, RelatedPosts, SinglePost, Tags, Headline, ToBlogLink.

**Visual-editing candidates** (page-builder blocks): all `widgets/*` composed into pages above.
**Data-panel candidates**: Header/Footer navigation, site config, theme.

**Image handling**: `src/components/common/Image.astro` wraps `unpic` for remote CDN URLs and `astro:assets` `<Image>` for local. Local assets live in `src/assets/images/` (must stay there). Most page images are remote Unsplash URLs passed as strings.

## 5. Build pipeline

- **Build**: `astro build` (netlify.toml: `command = "npm run build"`, `publish = "dist"`). No custom pre-build steps in the `build` script.
- `astro.config.ts`: `output: 'static'`, custom markdown processor (unified + remark/rehype), `image.domains: ['cdn.pixabay.com']`, `~` alias → `./src`.
- `astrowind` integration injects config from `src/config.yaml` at build time — must remain intact for CloudCannon's build.
- `netlify.toml`: `pretty_urls = false`, immutable cache headers for `/_astro/*`.

## 6. Flags and special patterns

1. **⚠️ Scroll-reveal / entrance animations (blocks visual editing)** — `src/components/ui/WidgetWrapper.astro` (used by **every** widget) applies `motion-safe:md:opacity-0 motion-safe:md:intersect:animate-fade` plus `intersect-once intersect-quarter intersect-no-queue`. Content stays at `opacity:0` until scrolled into view → invisible / broken in the Visual Editor. Also present in `Timeline.astro`, blog `GridItem`/`SinglePost`, and several widgets. **Must be patched in Phase 4.**
2. **⚠️ `astro-icon` with no `src/icons/`** — 20 components render `<Icon>`. Missing `src/icons/` directory triggers `Unable to load the "local" icon set!` when `editableRegions()` re-renders components. **Create an (empty) `src/icons/` in Phase 2/4** and guard `<Icon>` on truthy name in blueprints.
3. **⚠️ `set:html` throughout** — Hero, Hero2, HeroText, Features2, Features3, Steps, Note, Headline, Button render `title`/`subtitle`/`description` via `set:html`. Page content contains inline HTML fragments (`<span class="text-accent">`, `<br class="block sm:hidden" />`, `&nbsp;`). When these props move into page-builder YAML/frontmatter they become **styled HTML in frontmatter** — uneditable in CC rich-text (red outlines). Needs a resolution strategy in Phase 3 (plain text + component-level styling, or documented rich-text fields).
4. **MDX inline components (snippet candidates)** — `src/data/post/markdown-elements-demo-post.mdx` imports and uses `<Logo/>`, `<YouTube id=…/>`, `<Tweet id=…/>`, `<Vimeo id=…/>`. These need `_snippets` config (see `cloudcannon-snippets` skill) to remain editable. Other 5 posts are plain markdown. No raw `<figure>/<video>/<iframe>/<details>` in `.md` bodies.
5. **Navigation in TS with function calls** — `headerData`/`footerData` are not plain data (see §2). Making nav editable requires either refactoring to a data file (resolving `getPermalink` at render) or leaving it developer-managed.
6. **`config.yaml`** — central site config consumed by a custom integration; expose read-only-ish fields (site name, SEO, theme) via the data panel rather than restructuring.
7. **Computed permalinks** — blog `post.permalink` is derived, not the filename. CC `url` for the `post` collection must mirror `apps.blog.post.permalink` (`/%slug%`).

## 7. Sectioning recommendation

- **Total page routes**: 20 page files (`src/pages`) + 6 posts + derived list/category/tag/pagination routes → **~26 source pages, >30 rendered**.
- **Hardcoded `.astro` → YAML (page-builder) conversions**: **15** (index, about, services, pricing, contact, 4× homes, 6× landing).
- **Distinct collections**: **3** — `post` (existing), new `pages` (page-builder), `legal` (privacy/terms; or keep as source-editable markdown).

Threshold check ({pages>30, conversions>15, collections>5}):

| Signal | Count | Threshold | Tripped? |
| ------ | ----- | --------- | -------- |
| Total pages | ~26 source / >30 rendered | >30 | borderline |
| Conversions | 15 | >15 | borderline (essentially at the line) |
| Collections | 3 | >5 | no |

Numerically this is **~1 of 3 clearly tripped** — under the "any 2" bar for a mandatory split. **However**, AstroWind's shared-widget architecture makes **Phase 4 (visual editing) exceptionally context-heavy**: ~22 widget components each need registering + editable regions, plus the global scroll-reveal patch and the `set:html` handling. This is the textbook "quality drops in later phases" case. → **Recommend chunking anyway** (see `plan.md`); horizontal (per-phase) split, with Phase 4 in its own fresh conversation.
