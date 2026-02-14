<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import type { EditorFeature, EditorProperties } from "../types";
import type { EditorLocale } from "../l10n";
import LayerItem from "./LayerItem.vue";

const props = defineProps<{
    features: EditorFeature[];
    selectedFeatureId: string | null;
    l10n: EditorLocale;
    iconUrls: Map<string, string>;
}>();

const emit = defineEmits<{
    (e: "update", id: string, properties: Partial<EditorProperties>): void;
    (e: "select", id: string): void;
    (e: "delete", id: string): void;
    (e: "reorder", featureId: string, newIndex: number): void;
    (e: "close"): void;
}>();

const expandedIds = ref<Set<string>>(new Set());
const dragFeatureId = ref<string | null>(null);
const dropTargetIndex = ref<number | null>(null);

const autoLabels = computed(() => {
    const counters = { Point: 0, Marker: 0, LineString: 0, Polygon: 0 };
    const labels = new Map<string, string>();
    for (const f of props.features) {
        const type = f.geometry.type;
        if (f.properties.title) {
            // Still count for consistent numbering
            if (type === "Point") {
                const hasSymbol = !!(f.properties as Record<string, unknown>)["marker-symbol"];
                if (hasSymbol) counters.Marker++;
                else counters.Point++;
            } else {
                counters[type]++;
            }
            labels.set(f.id, f.properties.title);
        } else if (type === "Point") {
            const hasSymbol = !!(f.properties as Record<string, unknown>)["marker-symbol"];
            if (hasSymbol) {
                counters.Marker++;
                labels.set(f.id, `${props.l10n.layerMarker} #${counters.Marker}`);
            } else {
                counters.Point++;
                labels.set(f.id, `${props.l10n.layerPoint} #${counters.Point}`);
            }
        } else {
            counters[type]++;
            const typeLabel =
                type === "LineString" ? props.l10n.layerLine : props.l10n.layerPolygon;
            labels.set(f.id, `${typeLabel} #${counters[type]}`);
        }
    }
    return labels;
});

// Auto-expand and scroll when a feature is selected on the map
watch(
    () => props.selectedFeatureId,
    async (id) => {
        if (!id) return;
        expandedIds.value = new Set([...expandedIds.value, id]);
        await nextTick();
        const el = document.querySelector(`[data-feature-id="${id}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
);

// Prune expandedIds when features are deleted
watch(
    () => props.features,
    (features) => {
        const ids = new Set(features.map((f) => f.id));
        const pruned = new Set([...expandedIds.value].filter((id) => ids.has(id)));
        if (pruned.size !== expandedIds.value.size) {
            expandedIds.value = pruned;
        }
    }
);

function toggleExpanded(id: string) {
    const next = new Set(expandedIds.value);
    if (next.has(id)) {
        next.delete(id);
    } else {
        next.add(id);
    }
    expandedIds.value = next;
}

function onSelect(id: string) {
    emit("select", id);
}

function onUpdate(id: string, properties: Partial<EditorProperties>) {
    emit("update", id, properties);
}

function onDragStart(featureId: string, event: DragEvent) {
    dragFeatureId.value = featureId;
    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", featureId);
    }
}

function onDragEnd() {
    dragFeatureId.value = null;
    dropTargetIndex.value = null;
}

function onDragOver(event: DragEvent) {
    event.preventDefault();
    if (!dragFeatureId.value) return;

    const list = (event.currentTarget as HTMLElement);
    const items = Array.from(list.querySelectorAll<HTMLElement>("[data-feature-id]"));
    const y = event.clientY;

    let targetIdx = items.length; // default: after last item
    for (let i = 0; i < items.length; i++) {
        const rect = items[i]!.getBoundingClientRect();
        if (y < rect.top + rect.height / 2) {
            targetIdx = i;
            break;
        }
    }

    dropTargetIndex.value = targetIdx;
}

function onDragLeave(event: DragEvent) {
    const list = event.currentTarget as HTMLElement;
    if (!list.contains(event.relatedTarget as Node)) {
        dropTargetIndex.value = null;
    }
}

function onDrop(event: DragEvent) {
    event.preventDefault();
    if (!dragFeatureId.value || dropTargetIndex.value === null) return;

    emit("reorder", dragFeatureId.value, dropTargetIndex.value);
    dragFeatureId.value = null;
    dropTargetIndex.value = null;
}

function collapseAll() {
    if (expandedIds.value.size === 0) return;
    expandedIds.value = new Set();
}
</script>

<template>
    <div class="tge-layer-panel">
        <div class="tge-layer-panel__header">
            <button class="tge-layer-panel__title" type="button" @click="collapseAll">
                {{ l10n.layerPanelTitle }}
            </button>
            <button class="tge-layer-panel__close" type="button" @click="$emit('close')">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                    <path
                        d="M18 6L6 18M6 6l12 12"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round" />
                </svg>
            </button>
        </div>
        <div
            class="tge-layer-panel__list"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop">
            <template v-for="(feature, idx) in features" :key="feature.id">
                <div
                    v-if="dropTargetIndex === idx"
                    class="tge-layer-panel__drop-indicator" />
                <LayerItem
                    :data-feature-id="feature.id"
                    :feature="feature"
                    :label="autoLabels.get(feature.id) ?? ''"
                    :expanded="expandedIds.has(feature.id)"
                    :selected="feature.id === selectedFeatureId"
                    :dragging="dragFeatureId === feature.id"
                    :reorderable="features.length > 1"
                    :l10n="l10n"
                    :iconUrls="iconUrls"
                    @toggle="toggleExpanded(feature.id)"
                    @update="onUpdate"
                    @select="onSelect(feature.id)"
                    @delete="$emit('delete', $event)"
                    @dragstart="onDragStart(feature.id, $event)"
                    @dragend="onDragEnd" />
            </template>
            <div
                v-if="dropTargetIndex === features.length"
                class="tge-layer-panel__drop-indicator" />
        </div>
        <p v-if="features.length === 0" class="tge-layer-panel__empty">
            {{ l10n.layerPanelEmpty }}
        </p>
    </div>
</template>
