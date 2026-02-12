import type { EditorLocale } from "./l10n";

/** GeoJSON RFC 7946 aligned types for the editor */

export type Position = [number, number]; // [lng, lat]
export type PolygonCoordinates = Position[][];
export type LineStringCoordinates = Position[];
export type PointCoordinates = Position;

/** Style properties for polygon fills */
export interface FillStyleProperties {
    "fill"?: string;
    "fill-opacity"?: number;
}

/** Style properties for lines/strokes (shared by polygons and linestrings) */
export interface StrokeStyleProperties {
    "stroke"?: string;
    "stroke-opacity"?: number;
    "stroke-width"?: number;
}

/** Style properties for circle points (extending simplestyle to Points) */
export interface PointStyleProperties {
    "fill"?: string;
    "fill-opacity"?: number;
    "stroke"?: string;
    "stroke-opacity"?: number;
    "stroke-width"?: number;
    "circle-radius"?: number;
}

/** Label properties shared by points and markers */
export interface LabelProperties {
    "marker-label"?: string;
    "marker-label-position"?: "top" | "left" | "right" | "bottom";
}

/** Style properties for markers/points */
export interface MarkerStyleProperties {
    "marker-color"?: string;
    "marker-size"?: "small" | "medium" | "large";
    "marker-symbol"?: string;
    "marker-label"?: string;
    "marker-label-position"?: "top" | "left" | "right" | "bottom";
}

/** Common properties shared by all features */
export interface BaseProperties {
    id?: string;
    title?: string;
    description?: string;
}

export interface EditorPolygonFeature {
    type: "Feature";
    id: string;
    geometry: {
        type: "Polygon";
        coordinates: PolygonCoordinates;
    };
    properties: BaseProperties & FillStyleProperties & StrokeStyleProperties;
}

export interface EditorLineStringFeature {
    type: "Feature";
    id: string;
    geometry: {
        type: "LineString";
        coordinates: LineStringCoordinates;
    };
    properties: BaseProperties & StrokeStyleProperties;
}

export interface EditorPointFeature {
    type: "Feature";
    id: string;
    geometry: {
        type: "Point";
        coordinates: PointCoordinates;
    };
    properties: BaseProperties & PointStyleProperties & LabelProperties;
}

export interface EditorMarkerFeature {
    type: "Feature";
    id: string;
    geometry: {
        type: "Point";
        coordinates: PointCoordinates;
    };
    properties: BaseProperties & MarkerStyleProperties;
}

export type EditorFeature =
    | EditorPolygonFeature
    | EditorLineStringFeature
    | EditorPointFeature
    | EditorMarkerFeature;

export type EditorProperties = BaseProperties &
    FillStyleProperties &
    StrokeStyleProperties &
    MarkerStyleProperties &
    PointStyleProperties &
    LabelProperties;

export interface EditorFeatureCollection {
    type: "FeatureCollection";
    features: EditorFeature[];
}

/** Tool modes */
export type ToolMode = "select" | "draw-point" | "draw-polygon" | "draw-line" | "draw-marker" | "eraser";

/** Editor props */
export interface EditorProps {
    modelValue?: EditorFeatureCollection;
    pmtilesUrl?: string;
    pointRadius?: number;
    center?: Position;
    zoom?: number;
    l10n?: Partial<EditorLocale>;
}

export type { EditorLocale } from "./l10n";

/** Viewer props (read-only map display) */
export interface ViewerProps {
    modelValue?: EditorFeatureCollection;
    pmtilesUrl?: string;
    center?: Position;
    zoom?: number;
}
