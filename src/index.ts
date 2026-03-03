import "maplibre-gl/dist/maplibre-gl.css";
import "./styles/theme-standard.scss";
import "./styles/editor.scss";

// Components
export { default as GeoJsonEditor } from "./components/GeoJsonEditor.vue";
export { default as GeoJsonViewer } from "./components/GeoJsonViewer.vue";

// Composables
export { useGeoJson } from "./composables/useGeoJson";
export { useDrawing } from "./composables/useDrawing";
export { useMapStyle } from "./composables/useMapStyle";
export { usePhotonSearch } from "./composables/usePhotonSearch";
export type { PhotonResult, Viewport } from "./composables/usePhotonSearch";

// Utilities for standalone map integration
export {
    getFeatureLayers,
    getFeatureLayerIds,
    getQueryableLayerIds,
    getVerticesLayer,
    reconcileFeatureLayers,
    getDrawingLayers,
} from "./utils/layers";
export type { GeomType, FeatureSummary } from "./utils/layers";
export { loadIcon, loadIconsForFeatures, getIconUrl, COMMON_ICONS } from "./utils/icons";

// Localization
export { DEFAULT_LOCALE } from "./l10n";
export type { EditorLocale } from "./l10n";

// Constants
export { SOURCE_ID, LAYER_IDS, DEFAULTS, MARKER_SIZE_SCALE, PHOTON_PUBLIC_URL } from "./constants";

// Types
export type {
    EditorFeatureCollection,
    EditorFeature,
    EditorPolygonFeature,
    EditorLineStringFeature,
    EditorPointFeature,
    EditorMarkerFeature,
    EditorProperties,
    BaseProperties,
    FillStyleProperties,
    StrokeStyleProperties,
    MarkerStyleProperties,
    PointStyleProperties,
    LabelProperties,
    Position,
    GeoJsonBbox,
    BboxPadding,
    ToolMode,
    EditorProps,
    ViewerProps,
} from "./types";
