import type { StyleSpecification } from "maplibre-gl";

export function useMapStyle(pmtilesUrl: string) {
    function getStyle(): StyleSpecification {
        return {
            version: 8,
            name: "Shortbread PMTiles",
            sources: {
                "versatiles-shortbread": {
                    type: "vector",
                    url: `pmtiles://${pmtilesUrl}`,
                },
            },
            layers: [
                {
                    id: "background",
                    type: "background",
                    paint: { "background-color": "#f0ede9" },
                },
                {
                    id: "ocean",
                    type: "fill",
                    source: "versatiles-shortbread",
                    "source-layer": "ocean",
                    paint: { "fill-color": "#c2dae0" },
                },
                {
                    id: "water",
                    type: "fill",
                    source: "versatiles-shortbread",
                    "source-layer": "water_polygons",
                    paint: { "fill-color": "#c2dae0" },
                },
                {
                    id: "land",
                    type: "fill",
                    source: "versatiles-shortbread",
                    "source-layer": "land",
                    paint: { "fill-color": "#f0ede9" },
                },
                {
                    id: "park",
                    type: "fill",
                    source: "versatiles-shortbread",
                    "source-layer": "land",
                    filter: ["in", "kind", "park", "nature_reserve", "national_park"],
                    paint: { "fill-color": "#d4e8d0", "fill-opacity": 0.5 },
                },
                {
                    id: "roads-highway",
                    type: "line",
                    source: "versatiles-shortbread",
                    "source-layer": "streets",
                    filter: ["in", "kind", "motorway", "trunk"],
                    paint: {
                        "line-color": "#f5c97e",
                        "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.5, 14, 4],
                    },
                },
                {
                    id: "roads-major",
                    type: "line",
                    source: "versatiles-shortbread",
                    "source-layer": "streets",
                    filter: ["in", "kind", "primary", "secondary"],
                    minzoom: 7,
                    paint: {
                        "line-color": "#e0d8c8",
                        "line-width": ["interpolate", ["linear"], ["zoom"], 7, 0.3, 14, 3],
                    },
                },
                {
                    id: "roads-minor",
                    type: "line",
                    source: "versatiles-shortbread",
                    "source-layer": "streets",
                    filter: ["in", "kind", "tertiary", "residential", "living_street", "unclassified"],
                    minzoom: 11,
                    paint: {
                        "line-color": "#e8e0d4",
                        "line-width": ["interpolate", ["linear"], ["zoom"], 11, 0.3, 16, 2],
                    },
                },
                {
                    id: "buildings",
                    type: "fill",
                    source: "versatiles-shortbread",
                    "source-layer": "buildings",
                    minzoom: 14,
                    paint: {
                        "fill-color": "#ddd8d0",
                        "fill-opacity": 0.6,
                    },
                },
                {
                    id: "boundaries-country",
                    type: "line",
                    source: "versatiles-shortbread",
                    "source-layer": "boundaries",
                    filter: ["==", "admin_level", 2],
                    paint: {
                        "line-color": "#a08080",
                        "line-width": 1,
                        "line-dasharray": [4, 2],
                    },
                },
                {
                    id: "labels-country",
                    type: "symbol",
                    source: "versatiles-shortbread",
                    "source-layer": "place_labels",
                    filter: ["==", "kind", "country"],
                    layout: {
                        "text-field": "{name}",
                        "text-size": ["interpolate", ["linear"], ["zoom"], 2, 10, 6, 16],
                        "text-max-width": 8,
                    },
                    paint: {
                        "text-color": "#555",
                        "text-halo-color": "#fff",
                        "text-halo-width": 1.5,
                    },
                },
                {
                    id: "labels-city",
                    type: "symbol",
                    source: "versatiles-shortbread",
                    "source-layer": "place_labels",
                    filter: ["in", "kind", "city", "town"],
                    minzoom: 5,
                    layout: {
                        "text-field": "{name}",
                        "text-size": ["interpolate", ["linear"], ["zoom"], 5, 10, 12, 14],
                        "text-max-width": 8,
                    },
                    paint: {
                        "text-color": "#444",
                        "text-halo-color": "#fff",
                        "text-halo-width": 1.5,
                    },
                },
            ] as StyleSpecification["layers"],
        };
    }

    return { getStyle };
}
