<script setup lang="ts">
import { ref, computed, onMounted, type ComponentPublicInstance } from "vue";
import type { Map as MaplibreMap } from "maplibre-gl";
import type {
    EditorFeatureCollection,
    EditorFeature,
    EditorProperties,
    ToolMode,
    Position,
    BboxPadding,
} from "../types";
import type { EditorLocale } from "../l10n";
import { DEFAULT_LOCALE } from "../l10n";
import { DEFAULT_POINT_RADIUS } from "../constants";
import { DEFAULT_BBOX_PADDING } from "../utils/mapView";
import type { Viewport } from "../composables/useNominatimSearch";
import EditorMap from "./EditorMap.vue";
import EditorToolbar from "./EditorToolbar.vue";
import LayerPanel from "./LayerPanel.vue";
import { COMMON_ICONS, getIconUrl } from "../utils/icons";

const props = withDefaults(
    defineProps<{
        pmtilesUrl: string;
        pointRadius?: number;
        center?: Position;
        zoom?: number;
        bboxPadding?: BboxPadding;
        l10n?: Partial<EditorLocale>;
        nominatimUrl?: string;
        searchDelay?: number;
        searchBoosting?: boolean;
        searchLanguage?: string;
    }>(),
    {
        pointRadius: DEFAULT_POINT_RADIUS,
        bboxPadding: () => [...DEFAULT_BBOX_PADDING] as BboxPadding,
        l10n: () => ({}),
        searchBoosting: true,
    }
);

const locale = computed<EditorLocale>(() => ({ ...DEFAULT_LOCALE, ...props.l10n }));

const model = defineModel<EditorFeatureCollection>({
    default: () => ({ type: "FeatureCollection", features: [] }),
});

const editorMapRef = ref<ComponentPublicInstance<{
    getMap: () => MaplibreMap | null;
    fitBounds: () => void;
}> | null>(null);
const activeTool = ref<ToolMode>("select");
const selectedFeatureId = ref<string | null>(null);
const iconUrls = ref<Map<string, string>>(new Map());

onMounted(async () => {
    const entries = await Promise.all(
        COMMON_ICONS.map(async (name) => [name, await getIconUrl(name)] as const)
    );
    const map = new Map<string, string>();
    for (const [name, url] of entries) {
        if (url) map.set(name, url);
    }
    iconUrls.value = map;
});

function onFeatureClick(feature: EditorFeature | null) {
    selectedFeatureId.value = feature?.id ?? null;
}

function onFeatureDelete(id: string) {
    model.value = {
        ...model.value,
        features: model.value.features.filter((f) => f.id !== id),
    };
    if (selectedFeatureId.value === id) {
        selectedFeatureId.value = null;
    }
}

function onPropertyUpdate(id: string, properties: Partial<EditorProperties>) {
    model.value = {
        ...model.value,
        features: model.value.features.map((f) =>
            f.id === id ? { ...f, properties: { ...f.properties, ...properties } } : f
        ),
    };
}

function onToolChange(tool: ToolMode) {
    activeTool.value = tool;
    if (tool !== "select") {
        selectedFeatureId.value = null;
    }
}

function onToolDone(featureId: string) {
    activeTool.value = "select";
    selectedFeatureId.value = featureId;
}

function onFeatureSelect(id: string) {
    selectedFeatureId.value = id;
}

function getViewport(): Viewport | null {
    const map = editorMapRef.value?.getMap();
    if (!map) return null;
    const b = map.getBounds();
    return {
        bounds: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()],
        zoom: map.getZoom(),
    };
}

function onLocationSelect(bounds: [[number, number], [number, number]]) {
    const map = editorMapRef.value?.getMap();
    if (map) {
        map.fitBounds(bounds, { padding: 50 });
    }
}

function fitBounds(): void {
    editorMapRef.value?.fitBounds();
}

function getMap(): MaplibreMap | null {
    return editorMapRef.value?.getMap() ?? null;
}

defineExpose({ getMap, fitBounds });

function onFeatureReorder(featureId: string, newIndex: number) {
    const features = [...model.value.features];
    const oldIndex = features.findIndex((f) => f.id === featureId);
    if (oldIndex === -1) return;

    const [item] = features.splice(oldIndex, 1);
    // Adjust insertion index since we removed an item before the target
    const insertAt = oldIndex < newIndex ? newIndex - 1 : newIndex;
    features.splice(insertAt, 0, item!);

    model.value = { ...model.value, features };
}
</script>

<template>
    <div class="tge-editor">
        <EditorToolbar :activeTool="activeTool" :l10n="locale" @update:activeTool="onToolChange" />
        <EditorMap
            ref="editorMapRef"
            :modelValue="model"
            :activeTool="activeTool"
            :pmtilesUrl="props.pmtilesUrl"
            :pointRadius="props.pointRadius"
            :center="props.center"
            :zoom="props.zoom"
            :bboxPadding="props.bboxPadding"
            @update:modelValue="model = $event"
            @featureClick="onFeatureClick"
            @featureDelete="onFeatureDelete"
            @toolDone="onToolDone" />
        <div
            v-if="selectedFeatureId"
            class="tge-editor__backdrop"
            @click="selectedFeatureId = null" />
        <LayerPanel
            :class="{ 'tge-layer-panel--open': selectedFeatureId }"
            :features="model.features"
            :selectedFeatureId="selectedFeatureId"
            :l10n="locale"
            :iconUrls="iconUrls"
            :nominatimUrl="props.nominatimUrl"
            :searchDelay="props.searchDelay"
            :getViewport="props.searchBoosting ? getViewport : undefined"
            :searchLanguage="props.searchLanguage"
            @update="onPropertyUpdate"
            @select="onFeatureSelect"
            @delete="onFeatureDelete"
            @reorder="onFeatureReorder"
            @locationSelect="onLocationSelect"
            @close="selectedFeatureId = null" />
    </div>
</template>
