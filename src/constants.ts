import type { ToolMode, Position } from "./types";

export const TOOL_MODES: readonly ToolMode[] = [
    "select",
    "draw-point",
    "draw-marker",
    "draw-line",
    "draw-polygon",
    "eraser",
] as const;

export const DEFAULT_POINT_RADIUS = 10;
export const DEFAULT_CENTER: Position = [0, 20];
export const DEFAULT_ZOOM = 2;

export const DEFAULT_PMTILES_URL =
    "https://storage.googleapis.com/richpod-shortbread-tiles/shortbread-europe.pmtiles";

/** Default style values (simplestyle-spec 1.1.0 defaults) */
export const DEFAULTS = {
    fill: "#555555",
    fillOpacity: 0.6,
    stroke: "#555555",
    strokeOpacity: 1,
    strokeWidth: 2,
    markerColor: "#7e7e7e",
    markerSize: "medium",
    circleRadius: 8,
} as const;

/** Numeric scale factors for marker-size enum */
export const MARKER_SIZE_SCALE: Record<string, number> = {
    small: 0.66,
    medium: 1,
    large: 1.5,
};

/** Layer IDs used for editor features */
export const LAYER_IDS = {
    fill: "editor-fill",
    line: "editor-line",
    points: "editor-points",
    symbols: "editor-symbols",
    labels: "editor-labels",
    vertices: "editor-vertices",
} as const;

export const SOURCE_ID = "editor-geojson";
export const TEMP_SOURCE_ID = "drawing-temp";
export const TEMP_LINE_SOURCE_ID = "drawing-temp-line";
export const TEMP_VERTICES_SOURCE_ID = "drawing-temp-vertices";
