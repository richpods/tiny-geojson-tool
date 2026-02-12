import type { LayerSpecification } from "maplibre-gl";
import { SOURCE_ID, LAYER_IDS, DEFAULTS, MARKER_SIZE_SCALE } from "../constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Expr = any;

const markerSizeExpr: Expr = ["coalesce", ["get", "marker-size"], DEFAULTS.markerSize];

/** Return a match expression that picks an [x, y] offset based on marker-size. */
function sizedOffset(
    small: [number, number],
    medium: [number, number],
    large: [number, number]
): Expr {
    return ["match", markerSizeExpr, "small", ["literal", small], "large", ["literal", large], ["literal", medium]];
}

export function getEditorLayers(selectedFeatureId: string | null): LayerSpecification[] {
    return [
        {
            id: LAYER_IDS.fill,
            type: "fill",
            source: SOURCE_ID,
            filter: ["==", ["geometry-type"], "Polygon"],
            paint: {
                "fill-color": ["coalesce", ["get", "fill"], DEFAULTS.fill],
                "fill-opacity": ["coalesce", ["get", "fill-opacity"], DEFAULTS.fillOpacity],
            },
        },
        {
            id: LAYER_IDS.line,
            type: "line",
            source: SOURCE_ID,
            filter: [
                "any",
                ["==", ["geometry-type"], "Polygon"],
                ["==", ["geometry-type"], "LineString"],
            ],
            paint: {
                "line-color": ["coalesce", ["get", "stroke"], DEFAULTS.stroke],
                "line-opacity": ["coalesce", ["get", "stroke-opacity"], DEFAULTS.strokeOpacity],
                "line-width": ["coalesce", ["get", "stroke-width"], DEFAULTS.strokeWidth],
            },
        },
        {
            id: LAYER_IDS.points,
            type: "circle",
            source: SOURCE_ID,
            filter: [
                "all",
                ["==", ["geometry-type"], "Point"],
                ["!", ["has", "marker-symbol"]],
            ],
            paint: {
                "circle-radius": [
                    "*",
                    8,
                    [
                        "match",
                        ["coalesce", ["get", "marker-size"], DEFAULTS.markerSize],
                        "small",
                        MARKER_SIZE_SCALE.small,
                        "large",
                        MARKER_SIZE_SCALE.large,
                        MARKER_SIZE_SCALE.medium,
                    ],
                ],
                "circle-color": ["coalesce", ["get", "marker-color"], DEFAULTS.markerColor],
                "circle-stroke-width": 2,
                "circle-stroke-color": "#ffffff",
            },
        },
        {
            id: LAYER_IDS.symbols,
            type: "symbol",
            source: SOURCE_ID,
            filter: ["all", ["==", ["geometry-type"], "Point"], ["has", "marker-symbol"]],
            layout: {
                "icon-image": ["get", "marker-symbol"],
                "icon-size": [
                    "match",
                    ["coalesce", ["get", "marker-size"], DEFAULTS.markerSize],
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
            id: LAYER_IDS.labels,
            type: "symbol",
            source: SOURCE_ID,
            filter: ["all", ["==", ["geometry-type"], "Point"], ["has", "marker-label"]],
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
                        ["any", ["!", ["has", "marker-label-position"]], ["==", ["get", "marker-label-position"], "top"]],
                        ["has", "marker-symbol"],
                    ],
                    sizedOffset([0, -1.65], [0, -2.5], [0, -3.75]),
                    ["any", ["!", ["has", "marker-label-position"]], ["==", ["get", "marker-label-position"], "top"]],
                    sizedOffset([0, -0.55], [0, -0.8], [0, -1.2]),
                    // bottom — icon anchors at bottom so text is just below
                    ["all", ["==", ["get", "marker-label-position"], "bottom"], ["has", "marker-symbol"]],
                    sizedOffset([0, 0.25], [0, 0.4], [0, 0.6]),
                    ["==", ["get", "marker-label-position"], "bottom"],
                    sizedOffset([0, 0.55], [0, 0.8], [0, 1.2]),
                    // left — shift horizontally + vertically to center on icon
                    ["all", ["==", ["get", "marker-label-position"], "left"], ["has", "marker-symbol"]],
                    sizedOffset([-0.3, -0.8], [-0.4, -1.2], [-0.6, -1.8]),
                    ["==", ["get", "marker-label-position"], "left"],
                    sizedOffset([-0.3, 0], [-0.4, 0], [-0.6, 0]),
                    // right
                    ["all", ["==", ["get", "marker-label-position"], "right"], ["has", "marker-symbol"]],
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
        {
            id: LAYER_IDS.vertices,
            type: "circle",
            source: SOURCE_ID,
            filter: ["==", "id", selectedFeatureId ?? ""],
            paint: {
                "circle-radius": 0,
                "circle-color": "transparent",
            },
        },
    ] as LayerSpecification[];
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
