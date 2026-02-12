import type { ComputedRef, DefineComponent, Ref } from "vue";
import type {
    BaseProperties,
    EditorFeature,
    EditorFeatureCollection,
    EditorLineStringFeature,
    EditorPointFeature,
    EditorPolygonFeature,
    EditorProperties,
    EditorProps,
    FillStyleProperties,
    MarkerStyleProperties,
    Position,
    StrokeStyleProperties,
    ToolMode,
    ViewerProps,
} from "./dist/types.d.ts";

type LayerLike = Record<string, unknown>;
type GenericFeatureCollection = {
    type: "FeatureCollection";
    features: Array<{
        type: "Feature";
        properties: Record<string, unknown>;
        geometry: {
            type: string;
            coordinates: unknown;
        };
    }>;
};
type MapLike = {
    hasImage(name: string): boolean;
    addImage(name: string, image: unknown, options?: Record<string, unknown>): unknown;
};

export declare const GeoJsonEditor: DefineComponent<EditorProps>;
export declare const GeoJsonViewer: DefineComponent<ViewerProps>;

export declare function useGeoJson(model: Ref<EditorFeatureCollection>): {
    model: Ref<EditorFeatureCollection>;
    addFeature: (feature: EditorFeature) => void;
    removeFeature: (id: string) => void;
    updateFeature: (id: string, updater: (f: EditorFeature) => EditorFeature) => void;
    updateFeatureProperties: (id: string, props: Partial<EditorProperties>) => void;
    createPolygon: (coordinates: Position[][]) => EditorFeature;
    createLineString: (coordinates: Position[]) => EditorFeature;
    createPoint: (coordinates: Position) => EditorFeature;
    getFeature: (id: string) => EditorFeature | undefined;
};

export declare function useDrawing(): {
    activeTool: Ref<ToolMode>;
    drawingCoords: Ref<Position[]>;
    selectedFeatureId: Ref<string | null>;
    isDrawing: ComputedRef<boolean>;
    setTool: (tool: ToolMode) => void;
    addDrawingCoord: (coord: Position) => void;
    cancelDrawing: () => void;
    finishDrawing: () => Position[];
    selectFeature: (id: string | null) => void;
    distancePx: (
        map: { project: (lngLat: [number, number]) => { x: number; y: number } },
        a: Position,
        b: Position
    ) => number;
    getTempGeoJson: () => GenericFeatureCollection;
    getTempLineGeoJson: (mousePos?: Position) => GenericFeatureCollection;
    getTempVerticesGeoJson: () => GenericFeatureCollection;
};

export declare function useMapStyle(pmtilesUrl?: string): {
    getStyle: () => Record<string, unknown>;
};

export declare function getEditorLayers(selectedFeatureId: string | null): LayerLike[];
export declare function getDrawingLayers(): LayerLike[];

export declare const COMMON_ICONS: readonly [
    "marker-pin",
    "location",
    "pin",
    "flag",
    "star",
    "heart",
    "home",
    "business",
    "cafe",
    "restaurant",
    "car",
    "bus",
    "bicycle",
    "walk",
    "airplane",
    "boat",
    "train",
    "medical",
    "fitness",
    "school",
    "library",
    "cart",
    "basket",
    "gift",
    "camera",
    "musical-notes",
    "football",
    "basketball",
    "golf",
    "tennisball",
    "fish",
    "leaf",
    "flower",
    "paw",
    "water",
    "flame",
    "snow",
    "sunny",
    "moon",
    "cloudy",
    "thunderstorm",
    "warning",
    "information-circle",
    "help-circle",
    "checkmark-circle",
    "close-circle",
    "alert-circle",
    "wifi",
    "cellular",
    "globe",
    "compass",
    "navigate",
    "map",
    "trail-sign",
    "bed",
    "beer",
    "wine",
    "pizza",
    "ice-cream"
];
export declare function getIconUrl(name: string): Promise<string | null>;
export declare function loadIcon(map: MapLike, name: string): Promise<void>;
export declare function loadIconsForFeatures(
    map: MapLike,
    features: Array<{ properties: Record<string, unknown> }>
): Promise<void>;

export declare const SOURCE_ID: "editor-geojson";
export declare const LAYER_IDS: {
    readonly fill: "editor-fill";
    readonly line: "editor-line";
    readonly points: "editor-points";
    readonly symbols: "editor-symbols";
    readonly labels: "editor-labels";
    readonly vertices: "editor-vertices";
};
export declare const DEFAULTS: {
    readonly fill: "#555555";
    readonly fillOpacity: 0.6;
    readonly stroke: "#555555";
    readonly strokeOpacity: 1;
    readonly strokeWidth: 2;
    readonly markerColor: "#7e7e7e";
    readonly markerSize: "medium";
};
export declare const MARKER_SIZE_SCALE: Record<string, number>;
export declare const DEFAULT_PMTILES_URL: "https://storage.googleapis.com/richpod-shortbread-tiles/shortbread-europe.pmtiles";

export type {
    BaseProperties,
    EditorFeature,
    EditorFeatureCollection,
    EditorLineStringFeature,
    EditorPointFeature,
    EditorPolygonFeature,
    EditorProperties,
    EditorProps,
    FillStyleProperties,
    MarkerStyleProperties,
    Position,
    StrokeStyleProperties,
    ToolMode,
    ViewerProps,
} from "./dist/types.d.ts";
