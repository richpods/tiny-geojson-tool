<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import maplibregl, { type Map as MaplibreMap, type MapMouseEvent, Popup } from "maplibre-gl";
import { Protocol } from "pmtiles";
import { useMapStyle } from "../composables/useMapStyle";
import type { EditorFeatureCollection, Position } from "../types";
import { SOURCE_ID, LAYER_IDS, DEFAULT_CENTER, DEFAULT_ZOOM, DEFAULT_PMTILES_URL } from "../constants";
import { getEditorLayers } from "../utils/layers";
import { loadIconsForFeatures } from "../utils/icons";

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
        center: () => DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
    }
);

const mapContainer = ref<HTMLElement | null>(null);
let map: MaplibreMap | null = null;
let popup: Popup | null = null;
let protocolRegistered = false;
let mapLoaded = false;

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
        if (map) {
            await loadIconsForFeatures(map, props.modelValue.features as any);
        }
    },
    { deep: true }
);

function onMouseMove(e: MapMouseEvent) {
    if (!mapLoaded || !map) return;

    const editorLayerIds = [LAYER_IDS.fill, LAYER_IDS.line, LAYER_IDS.points, LAYER_IDS.symbols];
    const features = map.queryRenderedFeatures(e.point, { layers: editorLayerIds });
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

        const layers = getEditorLayers(null);
        for (const layer of layers) {
            map.addLayer(layer);
        }

        await loadIconsForFeatures(map, props.modelValue.features as any);

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
