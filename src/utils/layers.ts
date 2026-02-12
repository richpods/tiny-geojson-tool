import type { LayerSpecification, Map as MaplibreMap } from "maplibre-gl";
import { SOURCE_ID, LAYER_IDS, DEFAULTS, MARKER_SIZE_SCALE } from "../constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Expr = any;

export type GeomType = "Polygon" | "LineString" | "Point";

export interface FeatureSummary {
    id: string;
    geomType: GeomType;
}

const markerSizeExpr: Expr = ["coalesce", ["get", "marker-size"], DEFAULTS.markerSize];

/** Return a match expression that picks an [x, y] offset based on marker-size. */
function sizedOffset(
    small: [number, number],
    medium: [number, number],
    large: [number, number]
): Expr {
    return [
        "match",
        markerSizeExpr,
        "small",
        ["literal", small],
        "large",
        ["literal", large],
        ["literal", medium],
    ];
}

/** Return MapLibre layers for a single feature, ordered bottom-to-top within the feature. */
export function getFeatureLayers(featureId: string, geomType: GeomType): LayerSpecification[] {
    const idFilter: Expr = ["==", ["get", "id"], featureId];

    if (geomType === "Polygon") {
        return [
            {
                id: `editor-fill-${featureId}`,
                type: "fill",
                source: SOURCE_ID,
                filter: idFilter,
                paint: {
                    "fill-color": ["coalesce", ["get", "fill"], DEFAULTS.fill],
                    "fill-opacity": ["coalesce", ["get", "fill-opacity"], DEFAULTS.fillOpacity],
                },
            },
            {
                id: `editor-line-${featureId}`,
                type: "line",
                source: SOURCE_ID,
                filter: idFilter,
                paint: {
                    "line-color": ["coalesce", ["get", "stroke"], DEFAULTS.stroke],
                    "line-opacity": [
                        "coalesce",
                        ["get", "stroke-opacity"],
                        DEFAULTS.strokeOpacity,
                    ],
                    "line-width": ["coalesce", ["get", "stroke-width"], DEFAULTS.strokeWidth],
                },
            },
        ] as LayerSpecification[];
    }

    if (geomType === "LineString") {
        return [
            {
                id: `editor-line-${featureId}`,
                type: "line",
                source: SOURCE_ID,
                filter: idFilter,
                paint: {
                    "line-color": ["coalesce", ["get", "stroke"], DEFAULTS.stroke],
                    "line-opacity": [
                        "coalesce",
                        ["get", "stroke-opacity"],
                        DEFAULTS.strokeOpacity,
                    ],
                    "line-width": ["coalesce", ["get", "stroke-width"], DEFAULTS.strokeWidth],
                },
            },
        ] as LayerSpecification[];
    }

    // Point
    return [
        {
            id: `editor-points-${featureId}`,
            type: "circle",
            source: SOURCE_ID,
            filter: ["all", idFilter, ["!", ["has", "marker-symbol"]]],
            paint: {
                "circle-radius": ["coalesce", ["get", "circle-radius"], DEFAULTS.circleRadius],
                "circle-color": ["coalesce", ["get", "fill"], DEFAULTS.fill],
                "circle-opacity": ["coalesce", ["get", "fill-opacity"], DEFAULTS.fillOpacity],
                "circle-stroke-width": ["coalesce", ["get", "stroke-width"], 2],
                "circle-stroke-color": ["coalesce", ["get", "stroke"], "#ffffff"],
                "circle-stroke-opacity": ["coalesce", ["get", "stroke-opacity"], 1],
            },
        },
        {
            id: `editor-symbols-${featureId}`,
            type: "symbol",
            source: SOURCE_ID,
            filter: ["all", idFilter, ["has", "marker-symbol"]],
            layout: {
                "icon-image": ["get", "marker-symbol"],
                "icon-size": [
                    "match",
                    markerSizeExpr,
                    "small",
                    MARKER_SIZE_SCALE.small,
                    "large",
                    MARKER_SIZE_SCALE.large,
                    MARKER_SIZE_SCALE.medium,
                ],
                "icon-allow-overlap": true,
                "icon-anchor": "bottom",
            },
            paint: {
                "icon-color": ["coalesce", ["get", "marker-color"], DEFAULTS.markerColor],
            },
        },
        {
            id: `editor-labels-${featureId}`,
            type: "symbol",
            source: SOURCE_ID,
            filter: ["all", idFilter, ["has", "marker-label"]],
            layout: {
                "text-field": ["get", "marker-label"],
                "text-size": 13,
                "text-anchor": [
                    "case",
                    ["==", ["get", "marker-label-position"], "bottom"],
                    "top",
                    ["==", ["get", "marker-label-position"], "left"],
                    "right",
                    ["==", ["get", "marker-label-position"], "right"],
                    "left",
                    "bottom",
                ],
                "text-offset": [
                    "case",
                    // top (default) — clear icon or circle above point
                    [
                        "all",
                        [
                            "any",
                            ["!", ["has", "marker-label-position"]],
                            ["==", ["get", "marker-label-position"], "top"],
                        ],
                        ["has", "marker-symbol"],
                    ],
                    sizedOffset([0, -1.65], [0, -2.5], [0, -3.75]),
                    [
                        "any",
                        ["!", ["has", "marker-label-position"]],
                        ["==", ["get", "marker-label-position"], "top"],
                    ],
                    sizedOffset([0, -0.55], [0, -0.8], [0, -1.2]),
                    // bottom — icon anchors at bottom so text is just below
                    [
                        "all",
                        ["==", ["get", "marker-label-position"], "bottom"],
                        ["has", "marker-symbol"],
                    ],
                    sizedOffset([0, 0.25], [0, 0.4], [0, 0.6]),
                    ["==", ["get", "marker-label-position"], "bottom"],
                    sizedOffset([0, 0.55], [0, 0.8], [0, 1.2]),
                    // left — shift horizontally + vertically to center on icon
                    [
                        "all",
                        ["==", ["get", "marker-label-position"], "left"],
                        ["has", "marker-symbol"],
                    ],
                    sizedOffset([-0.3, -0.8], [-0.4, -1.2], [-0.6, -1.8]),
                    ["==", ["get", "marker-label-position"], "left"],
                    sizedOffset([-0.3, 0], [-0.4, 0], [-0.6, 0]),
                    // right
                    [
                        "all",
                        ["==", ["get", "marker-label-position"], "right"],
                        ["has", "marker-symbol"],
                    ],
                    sizedOffset([0.3, -0.8], [0.4, -1.2], [0.6, -1.8]),
                    ["==", ["get", "marker-label-position"], "right"],
                    sizedOffset([0.3, 0], [0.4, 0], [0.6, 0]),
                    // fallback
                    sizedOffset([0, -0.55], [0, -0.8], [0, -1.2]),
                ],
                "text-allow-overlap": true,
            },
            paint: {
                "text-color": "#333333",
                "text-halo-color": "#ffffff",
                "text-halo-width": 1.5,
            },
        },
    ] as LayerSpecification[];
}

/** Return layer IDs for a single feature (all sub-layers). */
export function getFeatureLayerIds(featureId: string, geomType: GeomType): string[] {
    if (geomType === "Polygon") {
        return [`editor-fill-${featureId}`, `editor-line-${featureId}`];
    }
    if (geomType === "LineString") {
        return [`editor-line-${featureId}`];
    }
    // Point
    return [
        `editor-points-${featureId}`,
        `editor-symbols-${featureId}`,
        `editor-labels-${featureId}`,
    ];
}

/** Return layer IDs suitable for queryRenderedFeatures (excludes labels). */
export function getQueryableLayerIds(features: FeatureSummary[]): string[] {
    const ids: string[] = [];
    for (const f of features) {
        if (f.geomType === "Polygon") {
            ids.push(`editor-fill-${f.id}`, `editor-line-${f.id}`);
        } else if (f.geomType === "LineString") {
            ids.push(`editor-line-${f.id}`);
        } else {
            ids.push(`editor-points-${f.id}`, `editor-symbols-${f.id}`);
        }
    }
    return ids;
}

/** Return the vertices overlay layer (always rendered on top). */
export function getVerticesLayer(selectedFeatureId: string | null): LayerSpecification {
    return {
        id: LAYER_IDS.vertices,
        type: "circle",
        source: SOURCE_ID,
        filter: ["==", "id", selectedFeatureId ?? ""],
        paint: {
            "circle-radius": 0,
            "circle-color": "transparent",
        },
    } as LayerSpecification;
}

/**
 * Reconcile per-feature layers on the map to match the new features array.
 * Adds/removes layers as needed and reorders to match array position.
 */
export function reconcileFeatureLayers(
    map: MaplibreMap,
    prev: FeatureSummary[],
    next: FeatureSummary[],
    ceilingLayerId?: string
): void {
    const nextIds = new Set(next.map((f) => f.id));
    const prevMap = new Map(prev.map((f) => [f.id, f.geomType]));

    // Remove layers for deleted features
    for (const f of prev) {
        if (!nextIds.has(f.id)) {
            for (const lid of getFeatureLayerIds(f.id, f.geomType)) {
                if (map.getLayer(lid)) map.removeLayer(lid);
            }
        }
    }

    // Add layers for new features (or features whose geomType changed)
    for (const f of next) {
        const prevGeom = prevMap.get(f.id);
        if (prevGeom === undefined) {
            // New feature
            for (const layer of getFeatureLayers(f.id, f.geomType)) {
                map.addLayer(layer, ceilingLayerId);
            }
        } else if (prevGeom !== f.geomType) {
            // Geometry type changed — remove old, add new
            for (const lid of getFeatureLayerIds(f.id, prevGeom)) {
                if (map.getLayer(lid)) map.removeLayer(lid);
            }
            for (const layer of getFeatureLayers(f.id, f.geomType)) {
                map.addLayer(layer, ceilingLayerId);
            }
        }
    }

    // Reorder all feature layers so that features earlier in the array render on top.
    // Iterating in reverse and moving each before the ceiling means the first feature
    // ends up closest to the ceiling (highest z-order).
    for (let i = next.length - 1; i >= 0; i--) {
        const f = next[i]!;
        for (const lid of getFeatureLayerIds(f.id, f.geomType)) {
            map.moveLayer(lid, ceilingLayerId);
        }
    }
}

export function getDrawingLayers(): LayerSpecification[] {
    return [
        {
            id: "drawing-temp-fill",
            type: "fill",
            source: "drawing-temp",
            paint: {
                "fill-color": DEFAULTS.fill,
                "fill-opacity": 0.15,
            },
        },
        {
            id: "drawing-temp-line",
            type: "line",
            source: "drawing-temp-line",
            paint: {
                "line-color": DEFAULTS.stroke,
                "line-width": 2,
                "line-dasharray": [3, 3],
            },
        },
        {
            id: "drawing-temp-vertices",
            type: "circle",
            source: "drawing-temp-vertices",
            paint: {
                "circle-radius": 5,
                "circle-color": "#ffffff",
                "circle-stroke-width": 2,
                "circle-stroke-color": DEFAULTS.stroke,
            },
        },
    ] as LayerSpecification[];
}
