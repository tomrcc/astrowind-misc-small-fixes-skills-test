// Registers every page-builder block for live re-rendering in CloudCannon's
// Visual Editor. This module is imported lazily from the base layout only when
// `window.inEditorMode` is true, so none of this ships in the production bundle.
//
// The keys come straight from `componentMap` — the single source of truth
// shared with BlockRenderer.astro (rendering) — so registration keys always
// match the `_type` discriminators used in content files and can never drift.
import { registerAstroComponent } from '@cloudcannon/editable-regions/astro';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import { componentMap } from './componentMap';

for (const [type, component] of Object.entries(componentMap)) {
  registerAstroComponent(type, component as AstroComponentFactory);
}
