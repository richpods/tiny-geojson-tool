<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, type Ref } from "vue";
import maplibregl, {
    type Map as MaplibreMap,
    type MapMouseEvent,
    Popup,
} from "maplibre-gl";
import { Protocol } from "pmtiles";
import { useMapStyle } from "../composables/useMapStyle";
import type {
    EditorFeatureCollection,
    EditorFeature,
    Position,
    ToolMode,
} from "../types";
import { SOURCE_ID, TEMP_SOURCE_ID, TEMP_LINE_SOURCE_ID, TEMP_VERTICES_SOURCE_ID, DEFAULT_CENTER, DEFAULT_ZOOM, DEFAULT_POINT_RADIUS } from "../constants";
import {
    getFeatureLayers,
    getVerticesLayer,
    getDrawingLayers,
    getQueryableLayerIds,
    reconcileFeatureLayers,
    type FeatureSummary,
} from "../utils/layers";
import { loadIconsForFeatures } from "../utils/icons";
import { fitMapToFeatures, shouldAutoFitOnLoad } from "../utils/mapView";
import { useDrawing } from "../composables/useDrawing";
import { useGeoJson } from "../composables/useGeoJson";

const props = defineProps<{
    modelValue: EditorFeatureCollection;
    activeTool: ToolMode;
    pmtilesUrl?: string;
    pointRadius?: number;
    center?: Position;
    zoom?: number;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: EditorFeatureCollection): void;
    (e: "featureClick", feature: EditorFeature | null): void;
    (e: "featureDelete", id: string): void;
    (e: "toolDone", featureId: string): void;
}>();

const mapContainer = ref<HTMLElement | null>(null);
let map: MaplibreMap | null = null;
let popup: Popup | null = null;
let protocolRegistered = false;
let mapLoaded = false;

/** Tracks which per-feature layers currently exist on the map. */
let prevFeatureSummaries: FeatureSummary[] = [];
/** Cached queryable layer IDs (excludes labels) for queryRenderedFeatures. */
let queryableLayerIds: string[] = [];
/** Auto-fit only when consumer did not pass explicit map view props. */
const shouldAutoFit = computed(() => shouldAutoFitOnLoad(props.center, props.zoom));

const modelRef = ref(props.modelValue) as Ref<EditorFeatureCollection>;
watch(
    () => props.modelValue,
    (val) => {
        modelRef.value = val;
    }
);

const geoJson = useGeoJson(modelRef);
const drawing = useDrawing();
const radius = () => props.pointRadius ?? DEFAULT_POINT_RADIUS;

let mousePosition: Position | null = null;

// Sync activeTool from parent
watch(
    () => props.activeTool,
    (tool) => {
        drawing.setTool(tool);
        updateCursor();
    }
);

function toSummaries(features: EditorFeature[]): FeatureSummary[] {
    return features.map((f) => ({ id: f.id, geomType: f.geometry.type }));
}

function updateCursor() {
    if (!map) return;
    const canvas = map.getCanvas();
    switch (props.activeTool) {
        case "draw-point":
        case "draw-marker":
        case "draw-line":
        case "draw-polygon":
            canvas.style.cursor = "crosshair";
            break;
        case "eraser":
            canvas.style.cursor = "pointer";
            break;
        default:
            canvas.style.cursor = "";
    }
}

function updateSources() {
    if (!map) return;
    const src = map.getSource(SOURCE_ID);
    if (src && "setData" in src) {
        (src as maplibregl.GeoJSONSource).setData(props.modelValue as GeoJSON.FeatureCollection);
    }
}

function updateTempSources() {
    if (!map) return;

    const tempSrc = map.getSource(TEMP_SOURCE_ID);
    if (tempSrc && "setData" in tempSrc) {
        (tempSrc as maplibregl.GeoJSONSource).setData(drawing.getTempGeoJson());
    }

    const lineSrc = map.getSource(TEMP_LINE_SOURCE_ID);
    if (lineSrc && "setData" in lineSrc) {
        (lineSrc as maplibregl.GeoJSONSource).setData(
            drawing.getTempLineGeoJson(mousePosition ?? undefined)
        );
    }

    const vertSrc = map.getSource(TEMP_VERTICES_SOURCE_ID);
    if (vertSrc && "setData" in vertSrc) {
        (vertSrc as maplibregl.GeoJSONSource).setData(drawing.getTempVerticesGeoJson());
    }
}

watch(
    () => props.modelValue,
    async () => {
        updateSources();
        if (map && mapLoaded) {
            const nextSummaries = toSummaries(props.modelValue.features);
            reconcileFeatureLayers(map, prevFeatureSummaries, nextSummaries, "drawing-temp-fill");
            prevFeatureSummaries = nextSummaries;
            queryableLayerIds = getQueryableLayerIds(nextSummaries);
            await loadIconsForFeatures(map, props.modelValue.features as any);
        }
    },
    { deep: true }
);

watch(
    () => drawing.drawingCoords.value,
    () => updateTempSources(),
    { deep: true }
);

// --- Map event handlers ---

function onMapClick(e: MapMouseEvent) {
    if (!mapLoaded) return;
    const tool = props.activeTool;

    if (tool === "draw-point") {
        const coord: Position = [e.lngLat.lng, e.lngLat.lat];
        const feature = geoJson.createPoint(coord);
        emit("update:modelValue", {
            ...props.modelValue,
            features: [...props.modelValue.features, feature],
        });
        emit("toolDone", feature.id);
        return;
    }

    if (tool === "draw-marker") {
        const coord: Position = [e.lngLat.lng, e.lngLat.lat];
        const feature = geoJson.createMarker(coord);
        emit("update:modelValue", {
            ...props.modelValue,
            features: [...props.modelValue.features, feature],
        });
        emit("toolDone", feature.id);
        return;
    }

    if (tool === "draw-polygon" || tool === "draw-line") {
        const coord: Position = [e.lngLat.lng, e.lngLat.lat];
        const coords = drawing.drawingCoords.value;

        if (tool === "draw-polygon" && coords.length >= 3) {
            const firstCoord = coords[0];
            // Check if clicking near first vertex to close
            if (firstCoord && map && drawing.distancePx(map, coord, firstCoord) < radius()) {
                const finished = drawing.finishDrawing();
                const first = finished[0];
                if (first) {
                    const closed: Position[] = [...finished, first];
                    const feature = geoJson.createPolygon([closed]);
                    emit("update:modelValue", {
                        ...props.modelValue,
                        features: [...props.modelValue.features, feature],
                    });
                    emit("toolDone", feature.id);
                    return;
                }
            }
        }

        if (tool === "draw-line" && coords.length >= 2) {
            const lastCoord = coords[coords.length - 1];
            // Check if clicking near last vertex to finish
            if (lastCoord && map && drawing.distancePx(map, coord, lastCoord) < radius()) {
                const finished = drawing.finishDrawing();
                const feature = geoJson.createLineString(finished);
                emit("update:modelValue", {
                    ...props.modelValue,
                    features: [...props.modelValue.features, feature],
                });
                emit("toolDone", feature.id);
                return;
            }
        }

        drawing.addDrawingCoord(coord);
        return;
    }

    if (tool === "eraser") {
        const features = map?.queryRenderedFeatures(e.point, { layers: queryableLayerIds });
        const hit = features?.[0];
        if (hit) {
            const id = hit.id as string;
            if (id) {
                emit("featureDelete", id);
            }
        }
        return;
    }

    if (tool === "select") {
        const features = map?.queryRenderedFeatures(e.point, { layers: queryableLayerIds });
        const hit = features?.[0];
        if (hit) {
            const id = hit.id as string;
            if (id) {
                const feature = geoJson.getFeature(id);
                if (feature) {
                    emit("featureClick", feature);
                }
            }
        } else {
            emit("featureClick", null);
        }
        return;
    }
}

function onMapMouseMove(e: MapMouseEvent) {
    if (!mapLoaded) return;
    mousePosition = [e.lngLat.lng, e.lngLat.lat];
    if (drawing.isDrawing.value) {
        updateTempSources();
    }

    // Popup on hover for select mode
    if (props.activeTool === "select" && !drawing.isDrawing.value) {
        const features = map?.queryRenderedFeatures(e.point, { layers: queryableLayerIds });
        const feat = features?.[0];
        if (feat) {
            const title = feat.properties?.title as string | undefined;
            const description = feat.properties?.description as string | undefined;
            if (title || description) {
                if (!popup) {
                    popup = new Popup({
                        closeButton: false,
                        closeOnClick: false,
                        offset: 10,
                        className: "tge-popup-container",
                    });
                }
                let html = "";
                if (title) html += `<h3 class="tge-popup__title">${escapeHtml(title)}</h3>`;
                if (description)
                    html += `<p class="tge-popup__description">${escapeHtml(description)}</p>`;
                popup.setLngLat(e.lngLat).setHTML(html).addTo(map!);
            } else {
                popup?.remove();
            }
        } else {
            popup?.remove();
        }
    }
}

function onContextMenu(e: MapMouseEvent) {
    e.preventDefault();
    if (drawing.isDrawing.value) {
        drawing.cancelDrawing();
        updateTempSources();
    }
}

function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape" && drawing.isDrawing.value) {
        drawing.cancelDrawing();
        updateTempSources();
    }
}

function escapeHtml(str: string): string {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

onMounted(() => {
    if (!mapContainer.value) return;

    // Register PMTiles protocol once
    if (!protocolRegistered) {
        const protocol = new Protocol();
        maplibregl.addProtocol("pmtiles", protocol.tile);
        protocolRegistered = true;
    }

    const { getStyle } = useMapStyle(props.pmtilesUrl);

    map = new maplibregl.Map({
        container: mapContainer.value,
        style: getStyle(),
        center: props.center ?? DEFAULT_CENTER,
        zoom: props.zoom ?? DEFAULT_ZOOM,
        attributionControl: false,
    });

    map.addControl(
        new maplibregl.AttributionControl({
            compact: true,
            customAttribution: 'OpenStreetMap contributors',
        }),
        "bottom-left"
    );
    map.addControl(new maplibregl.NavigationControl(), "bottom-left");
    map.addControl(
        new maplibregl.GeolocateControl({
            positionOptions: { enableHighAccuracy: false },
            trackUserLocation: false,
            fitBoundsOptions: { maxZoom: 13 },
        }),
        "bottom-left"
    );

    map.on("load", async () => {
        if (!map) return;

        // Add GeoJSON source
        map.addSource(SOURCE_ID, {
            type: "geojson",
            data: props.modelValue as GeoJSON.FeatureCollection,
            promoteId: "id",
        });

        // Add drawing temp sources
        map.addSource(TEMP_SOURCE_ID, {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
        });
        map.addSource(TEMP_LINE_SOURCE_ID, {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
        });
        map.addSource(TEMP_VERTICES_SOURCE_ID, {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
        });

        // Add per-feature layers (reverse order so first feature renders on top)
        for (let i = props.modelValue.features.length - 1; i >= 0; i--) {
            const feature = props.modelValue.features[i]!;
            for (const layer of getFeatureLayers(feature.id, feature.geometry.type)) {
                map.addLayer(layer);
            }
        }

        // Add drawing preview layers
        const drawLayers = getDrawingLayers();
        for (const layer of drawLayers) {
            map.addLayer(layer);
        }

        // Add vertices layer on top
        map.addLayer(getVerticesLayer(null));

        // Track initial state
        prevFeatureSummaries = toSummaries(props.modelValue.features);
        queryableLayerIds = getQueryableLayerIds(prevFeatureSummaries);

        // Load any icons from initial data
        await loadIconsForFeatures(map, props.modelValue.features as any);

        if (shouldAutoFit.value) {
            map.once("idle", () => {
                if (map) {
                    fitMapToFeatures(map, props.modelValue.features);
                }
            });
        }
        mapLoaded = true;
        updateCursor();
    });

    map.on("click", onMapClick);
    map.on("mousemove", onMapMouseMove);
    map.on("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
});

onUnmounted(() => {
    document.removeEventListener("keydown", onKeyDown);
    popup?.remove();
    map?.remove();
    map = null;
});
</script>

<template>
    <div ref="mapContainer" class="tge-map"></div>
</template>
