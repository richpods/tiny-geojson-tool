<script setup lang="ts">
import { ref, computed } from "vue";
import type {
    EditorFeatureCollection,
    EditorFeature,
    EditorProperties,
    ToolMode,
    Position,
} from "../types";
import type { EditorLocale } from "../l10n";
import { DEFAULT_LOCALE } from "../l10n";
import { DEFAULT_PMTILES_URL, DEFAULT_CENTER, DEFAULT_ZOOM, DEFAULT_POINT_RADIUS } from "../constants";
import EditorMap from "./EditorMap.vue";
import EditorToolbar from "./EditorToolbar.vue";
import PropertyEditor from "./PropertyEditor.vue";

const props = withDefaults(
    defineProps<{
        pmtilesUrl?: string;
        pointRadius?: number;
        center?: Position;
        zoom?: number;
        l10n?: Partial<EditorLocale>;
    }>(),
    {
        pmtilesUrl: DEFAULT_PMTILES_URL,
        pointRadius: DEFAULT_POINT_RADIUS,
        center: () => DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        l10n: () => ({}),
    }
);

const locale = computed<EditorLocale>(() => ({ ...DEFAULT_LOCALE, ...props.l10n }));

const model = defineModel<EditorFeatureCollection>({
    default: () => ({ type: "FeatureCollection", features: [] }),
});

const activeTool = ref<ToolMode>("select");
const selectedFeatureId = ref<string | null>(null);

const selectedFeature = computed<EditorFeature | null>(() => {
    if (!selectedFeatureId.value) return null;
    return model.value.features.find((f) => f.id === selectedFeatureId.value) ?? null;
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
</script>

<template>
    <div class="tge-editor">
        <EditorToolbar :activeTool="activeTool" :l10n="locale" @update:activeTool="onToolChange" />
        <EditorMap
            :modelValue="model"
            :activeTool="activeTool"
            :pmtilesUrl="props.pmtilesUrl"
            :pointRadius="props.pointRadius"
            :center="props.center"
            :zoom="props.zoom"
            @update:modelValue="model = $event"
            @featureClick="onFeatureClick"
            @featureDelete="onFeatureDelete"
            @toolDone="onToolDone" />
        <PropertyEditor
            :feature="selectedFeature"
            :l10n="locale"
            @update="onPropertyUpdate"
            @close="selectedFeatureId = null" />
    </div>
</template>
