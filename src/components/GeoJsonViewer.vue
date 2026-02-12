<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from "vue";
import maplibregl, {
    type Map as MaplibreMap,
    type MapMouseEvent,
    Popup,
} from "maplibre-gl";
import { Protocol } from "pmtiles";
import { useMapStyle } from "../composables/useMapStyle";
import type { EditorFeatureCollection, EditorFeature, Position } from "../types";
import { SOURCE_ID, DEFAULT_CENTER, DEFAULT_ZOOM, DEFAULT_PMTILES_URL } from "../constants";
import {
    getFeatureLayers,
    getQueryableLayerIds,
    reconcileFeatureLayers,
    type FeatureSummary,
} from "../utils/layers";
import { loadIconsForFeatures } from "../utils/icons";
import { fitMapToFeatures, shouldAutoFitOnLoad } from "../utils/mapView";

const props = withDefaults(
    defineProps<{
        modelValue?: EditorFeatureCollection;
        pmtilesUrl?: string;
        center?: Position;
        zoom?: number;
    }>(),
    {
        modelValue: () => ({ type: "FeatureCollection" as const, features: [] }),
        pmtilesUrl: DEFAULT_PMTILES_URL,
    }
);

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

function toSummaries(features: EditorFeature[]): FeatureSummary[] {
    return features.map((f) => ({ id: f.id, geomType: f.geometry.type }));
}

function updateSource() {
    if (!map) return;
    const src = map.getSource(SOURCE_ID);
    if (src && "setData" in src) {
        (src as maplibregl.GeoJSONSource).setData(props.modelValue as GeoJSON.FeatureCollection);
    }
}

watch(
    () => props.modelValue,
    async () => {
        updateSource();
        if (map && mapLoaded) {
            const nextSummaries = toSummaries(props.modelValue.features);
            reconcileFeatureLayers(map, prevFeatureSummaries, nextSummaries);
            prevFeatureSummaries = nextSummaries;
            queryableLayerIds = getQueryableLayerIds(nextSummaries);
            await loadIconsForFeatures(map, props.modelValue.features as any);
        }
    },
    { deep: true }
);

function onMouseMove(e: MapMouseEvent) {
    if (!mapLoaded || !map) return;

    const features = map.queryRenderedFeatures(e.point, { layers: queryableLayerIds });
    const feat = features?.[0];

    if (feat) {
        map.getCanvas().style.cursor = "pointer";
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
            popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
        } else {
            popup?.remove();
        }
    } else {
        map.getCanvas().style.cursor = "";
        popup?.remove();
    }
}

function escapeHtml(str: string): string {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

onMounted(() => {
    if (!mapContainer.value) return;

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
            customAttribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
        }),
        "bottom-right"
    );
    map.addControl(new maplibregl.NavigationControl(), "bottom-right");
    map.addControl(
        new maplibregl.GeolocateControl({
            positionOptions: { enableHighAccuracy: false },
            trackUserLocation: false,
            fitBoundsOptions: { maxZoom: 13 },
        }),
        "bottom-right"
    );

    map.on("load", async () => {
        if (!map) return;

        map.addSource(SOURCE_ID, {
            type: "geojson",
            data: props.modelValue as GeoJSON.FeatureCollection,
            promoteId: "id",
        });

        // Add per-feature layers (reverse order so first feature renders on top)
        for (let i = props.modelValue.features.length - 1; i >= 0; i--) {
            const feature = props.modelValue.features[i]!;
            for (const layer of getFeatureLayers(feature.id, feature.geometry.type)) {
                map.addLayer(layer);
            }
        }

        // Track initial state
        prevFeatureSummaries = toSummaries(props.modelValue.features);
        queryableLayerIds = getQueryableLayerIds(prevFeatureSummaries);

        await loadIconsForFeatures(map, props.modelValue.features as any);

        if (shouldAutoFit.value) {
            map.once("idle", () => {
                if (map) {
                    fitMapToFeatures(map, props.modelValue.features);
                }
            });
        }
        mapLoaded = true;
    });

    map.on("mousemove", onMouseMove);
});

onUnmounted(() => {
    popup?.remove();
    map?.remove();
    map = null;
});
</script>

<template>
    <div class="tge-viewer">
        <div ref="mapContainer" class="tge-map"></div>
    </div>
</template>
