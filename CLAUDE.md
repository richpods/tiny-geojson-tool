# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start Vite dev server (serves demo at localhost:5173)
- `npm run build` — Library build (ESM output to `dist/`)
- `npm run typecheck` — `vue-tsc --noEmit` (strict: noUnusedLocals, noUnusedParameters, noUncheckedIndexedAccess)

No test framework is configured.

## Architecture

Vue 3 component library (`@richpods/tiny-geojson-tool`) for editing and viewing GeoJSON on a MapLibre map. Published as ESM-only; Vue is a peer dependency, maplibre-gl/pmtiles/ionicons are bundled. Exports two main components: `GeoJsonEditor` (full editing UI) and `GeoJsonViewer` (read-only display with hover popups).

### Data Flow

`GeoJsonEditor.vue` is the public editor component. It accepts `v-model` (EditorFeatureCollection) via `defineModel()`. `GeoJsonViewer.vue` is the read-only viewer — accepts `modelValue` as a prop, renders the map with feature layers and hover popups, but no toolbar/drawing/editing. Child components communicate upward through events only — no provide/inject.

```
GeoJsonEditor (v-model, tool state, selection state)
├── EditorToolbar     → emits update:activeTool
├── EditorMap         → emits update:modelValue, featureClick, featureDelete, toolDone
└── PropertyEditor    → emits update(id, props), close

GeoJsonViewer (modelValue prop, read-only)
└── MapLibre map with display layers + hover popups
```

State mutations are immutable — always spread into new objects to trigger Vue reactivity and MapLibre source updates.

### MapLibre Integration

- **PMTiles protocol** registered once in `EditorMap.vue` onMounted
- **Base map style** built in `useMapStyle.ts` — Shortbread-schema vector tiles from a configurable PMTiles URL
- **Four GeoJSON sources**: `editor-geojson` (features), `drawing-temp` / `drawing-temp-line` / `drawing-temp-vertices` (live drawing preview)
- **Editor layers** defined in `utils/layers.ts`: fill, line, points (circles), symbols (icons), labels, vertices — all use data-driven styling via `["coalesce", ["get", "prop"], default]`
- Feature IDs must exist in both the feature root `id` AND `properties.id` (required by `promoteId: "id"` for `queryRenderedFeatures` to return correct IDs)

### Drawing State Machine

`useDrawing.ts` manages tool mode (`select | draw-polygon | draw-line | draw-marker | eraser`), temporary coordinates, and preview GeoJSON generation. Polygon closes when clicking near first vertex; line finishes when clicking near last vertex. Right-click or Escape cancels.

### Icon System

`utils/icons.ts` loads icons from two sources: built-in SVGs (`marker-pin`) and Ionicons (dynamic import from node_modules). All icons are loaded as SDF images (`sdf: true`) so they can be tinted with `marker-color` via MapLibre's `icon-color` paint property. Rasterized at `32 * 5 * devicePixelRatio` to stay sharp up to scale 5 on retina.

### Styling

SCSS with BEM naming (`tge-toolbar__btn--active`). All values use CSS custom properties defined in `theme-standard.scss` (prefix `--tge-`). Both theme and editor styles are imported in `src/index.ts` and extracted to `dist/styles/editor.css` during build.

## Key Types (src/types.ts)

- `EditorFeature` = union of Polygon, LineString, Point features (GeoJSON RFC 7946 aligned)
- `Position = [lng, lat]` (number tuple)
- Style properties follow [simplestyle-spec 1.1.0](https://github.com/mapbox/simplestyle-spec): `fill`, `fill-opacity`, `stroke`, `stroke-opacity`, `stroke-width`, `marker-color`, `marker-size` (small/medium/large), `marker-symbol`. Extensions: `marker-label`, `marker-label-position`

## Localization (l10n)

`GeoJsonEditor` accepts an optional `l10n` prop (`Partial<EditorLocale>`) to override UI strings. Defaults are English, defined in `src/l10n.ts` as `DEFAULT_LOCALE`. The resolved locale is passed as a required `l10n: EditorLocale` prop to `EditorToolbar` and `PropertyEditor`. All user-facing strings in the editor come from this object — no hardcoded strings in component templates.

## Formatting

Prettier config: 4-space indent, trailing commas (es5), 100 char print width, bracket same line for HTML.
