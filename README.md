# @richpods/tiny-geojson-tool

Vue 3 component library for editing and viewing GeoJSON on a [MapLibre GL JS](https://maplibre.org/) map. Draw polygons, lines, and markers, style them with [simplestyle-spec](https://github.com/mapbox/simplestyle-spec) properties, and bind the result with `v-model`.

## Components

**`GeoJsonEditor`** — Full editing UI with a drawing toolbar, property editor, and interactive map. Supports drawing polygons, lines, and point markers, selecting and deleting features, and editing style properties (fill, stroke, marker color/size/icon).

**`GeoJsonViewer`** — Read-only map display. Renders GeoJSON features with hover popups for title/description.

## Install

```sh
npm install @richpods/tiny-geojson-tool
```

Vue 3.5+ is a peer dependency.

## Usage

```vue
<script setup lang="ts">
import { ref } from "vue";
import { GeoJsonEditor } from "@richpods/tiny-geojson-tool";
import "@richpods/tiny-geojson-tool/styles";
import type { EditorFeatureCollection } from "@richpods/tiny-geojson-tool";

const geojson = ref<EditorFeatureCollection>({
    type: "FeatureCollection",
    features: [],
});
</script>

<template>
    <GeoJsonEditor v-model="geojson" />
</template>
```

For read-only display:

```vue
<GeoJsonViewer :modelValue="geojson" />
```

## Props

Both components accept:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pmtilesUrl` | `string` | Built-in Shortbread tiles | URL to a PMTiles archive for the base map |
| `center` | `[lng, lat]` | `[0, 20]` | Initial map center |
| `zoom` | `number` | `2` | Initial zoom level |

`GeoJsonEditor` additionally accepts:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `EditorFeatureCollection` | Empty collection | GeoJSON feature collection (v-model) |
| `pointRadius` | `number` | `10` | Radius of point features in pixels |
| `l10n` | `Partial<EditorLocale>` | English | Override UI strings for localization |

## Drawing Tools

The editor toolbar provides five modes:

- **Select** — Click features to select and edit properties
- **Draw Marker** — Click to place point markers
- **Draw Line** — Click to add vertices, click near the last vertex to finish
- **Draw Polygon** — Click to add vertices, click near the first vertex to close
- **Eraser** — Click features to delete them

Right-click or press Escape to cancel drawing.

## Style Properties

Features support [simplestyle-spec 1.1.0](https://github.com/mapbox/simplestyle-spec) properties:

- **Polygons** — `fill`, `fill-opacity`, `stroke`, `stroke-opacity`, `stroke-width`
- **Lines** — `stroke`, `stroke-opacity`, `stroke-width`
- **Points** — `marker-color`, `marker-size` (small/medium/large), `marker-symbol`

Extensions: `title`, `description`, `marker-label`, `marker-label-position`.

## Localization

All user-facing strings in the editor can be overridden via the `l10n` prop. Pass a partial object — any keys you omit will use the English defaults.

```vue
<script setup lang="ts">
import { GeoJsonEditor, DEFAULT_LOCALE } from "@richpods/tiny-geojson-tool";
import type { EditorLocale } from "@richpods/tiny-geojson-tool";

const de: Partial<EditorLocale> = {
    toolSelect: "Auswählen",
    toolMarker: "Markierung",
    toolLine: "Linie",
    toolPolygon: "Polygon",
    toolEraser: "Radierer",
    propTitle: "Titel",
    propDescription: "Beschreibung",
};
</script>

<template>
    <GeoJsonEditor v-model="geojson" :l10n="de" />
</template>
```

See `EditorLocale` for the full list of keys and `DEFAULT_LOCALE` for the English defaults.

## Theming

All styles use CSS custom properties prefixed with `--tge-`. Override them to customize the look.

## Base Map

The default base map uses [Shortbread](https://shortbread-tiles.org/) vector tiles served from PMTiles. Pass a custom `pmtilesUrl` prop to use your own tile source.

## Development

```sh
npm install
npm run dev          # Start demo at localhost:5173
npm run build        # Build library to dist/
npm run build:demo   # Build demo app to dist-demo/
npm run preview:demo # Preview built demo locally
npm run typecheck    # Run type checking
```

## Acknowledgements

This project is built with the following open-source libraries:

- **[Vue](https://vuejs.org/)** — JavaScript framework
- **[MapLibre GL JS](https://maplibre.org/)** — Open-source map rendering library 
- **[PMTiles](https://github.com/protomaps/PMTiles)** — Cloud-optimized tile archive format
- **[Ionicons](https://ionic.io/ionicons)** — Open-source icon set
- **[Shortbread](https://shortbread-tiles.org/)** — Vector tile schema for OpenStreetMap data

Map data: [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.

## License

[Blue Oak Model License 1.0.0](https://blueoakcouncil.org/license/1.0.0)
