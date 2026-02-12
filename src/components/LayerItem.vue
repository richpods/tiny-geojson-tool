<script setup lang="ts">
import { computed, ref } from "vue";
import type { EditorFeature, EditorProperties } from "../types";
import type { EditorLocale } from "../l10n";
import { COMMON_ICONS } from "../utils/icons";

const props = defineProps<{
    feature: EditorFeature;
    label: string;
    expanded: boolean;
    selected: boolean;
    dragging: boolean;
    reorderable: boolean;
    l10n: EditorLocale;
    iconUrls: Map<string, string>;
}>();

const emit = defineEmits<{
    (e: "toggle"): void;
    (e: "update", id: string, properties: Partial<EditorProperties>): void;
    (e: "select"): void;
    (e: "delete", id: string): void;
    (e: "dragstart", event: DragEvent): void;
    (e: "dragend", event: DragEvent): void;
}>();

const geomType = computed(() => props.feature.geometry.type);
const isPolygon = computed(() => geomType.value === "Polygon");
const isLineOrPolygon = computed(
    () => geomType.value === "Polygon" || geomType.value === "LineString"
);
const isCirclePoint = computed(
    () =>
        geomType.value === "Point" &&
        !(props.feature.properties as Record<string, unknown>)["marker-symbol"]
);
const isMarker = computed(
    () =>
        geomType.value === "Point" &&
        !!(props.feature.properties as Record<string, unknown>)["marker-symbol"]
);

const iconColor = computed(() => {
    const p = props.feature.properties as Record<string, unknown>;
    if (geomType.value === "Polygon") return (p["fill"] as string) ?? null;
    if (geomType.value === "LineString") return (p["stroke"] as string) ?? null;
    if (isCirclePoint.value) return (p["fill"] as string) ?? null;
    return (p["marker-color"] as string) ?? null;
});

const iconSearch = ref("");
const showIconPicker = ref(false);

const filteredIcons = computed(() => {
    const q = iconSearch.value.toLowerCase();
    if (!q) return COMMON_ICONS;
    return COMMON_ICONS.filter((name) => name.includes(q));
});

const currentSymbol = computed(
    () =>
        ((props.feature.properties as Record<string, unknown>)?.["marker-symbol"] as string) ?? ""
);

function selectIcon(name: string) {
    updateProp("marker-symbol", name);
    showIconPicker.value = false;
    iconSearch.value = "";
}

function updateProp(key: string, value: unknown) {
    emit("update", props.feature.id, { [key]: value } as Partial<EditorProperties>);
}

function parseNumber(val: string, fallback: number): number {
    const n = parseFloat(val);
    return isNaN(n) ? fallback : n;
}

function onHeaderClick() {
    emit("select");
    emit("toggle");
}
</script>

<template>
    <div
        class="tge-layer-item"
        :class="{
            'tge-layer-item--selected': selected,
            'tge-layer-item--dragging': dragging,
        }">
        <div class="tge-layer-item__header">
            <div
                v-if="reorderable"
                class="tge-layer-item__drag-handle"
                draggable="true"
                @dragstart="$emit('dragstart', $event)"
                @dragend="$emit('dragend', $event)">
                <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
                    <circle cx="5" cy="3" r="1.5" />
                    <circle cx="11" cy="3" r="1.5" />
                    <circle cx="5" cy="8" r="1.5" />
                    <circle cx="11" cy="8" r="1.5" />
                    <circle cx="5" cy="13" r="1.5" />
                    <circle cx="11" cy="13" r="1.5" />
                </svg>
            </div>
            <button
                class="tge-layer-item__header-main"
                type="button"
                @click="onHeaderClick">
                <svg
                    v-if="geomType === 'Polygon'"
                    class="tge-layer-item__icon"
                    :style="iconColor ? { color: iconColor } : undefined"
                    viewBox="0 0 24 24"
                    fill="none">
                    <polygon
                        points="12,3 21,10 18,20 6,20 3,10"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linejoin="round"
                        fill="currentColor"
                        fill-opacity="0.2" />
                </svg>
                <svg
                    v-else-if="geomType === 'LineString'"
                    class="tge-layer-item__icon"
                    :style="iconColor ? { color: iconColor } : undefined"
                    viewBox="0 0 16 16"
                    fill="none">
                    <polyline
                        points="2,13 7,5 10,9 14,3"
                        stroke="currentColor"
                        stroke-width="1.5"
                        fill="none"
                        stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
                <svg
                    v-else-if="isCirclePoint"
                    class="tge-layer-item__icon"
                    :style="iconColor ? { color: iconColor } : undefined"
                    viewBox="0 0 16 16"
                    fill="none">
                    <circle cx="8" cy="8" r="4" stroke="currentColor" stroke-width="1.5" fill="currentColor" fill-opacity="0.2" />
                </svg>
                <svg
                    v-else
                    class="tge-layer-item__icon"
                    :style="iconColor ? { color: iconColor } : undefined"
                    viewBox="0 0 24 24"
                    fill="none">
                    <circle cx="12" cy="9" r="1.5" fill="currentColor" />
                    <path
                        d="M12 2C7.86 2 4.5 5.2 4.5 9.18c0 1.88.86 4.39 2.55 7.44 1.36 2.45 2.93 4.67 3.75 5.78a1.49 1.49 0 002.4 0c.82-1.1 2.39-3.33 3.75-5.78 1.69-3.05 2.55-5.56 2.55-7.44C19.5 5.2 16.14 2 12 2zm0 10.5a3 3 0 110-6 3 3 0 010 6z"
                        fill="currentColor" />
                </svg>
                <span class="tge-layer-item__label">{{ label }}</span>
                <svg
                    class="tge-layer-item__chevron"
                    :class="{ 'tge-layer-item__chevron--open': expanded }"
                    viewBox="0 0 16 16"
                    fill="none"
                    width="14"
                    height="14">
                    <polyline
                        points="5,3 11,8 5,13"
                        stroke="currentColor"
                        stroke-width="1.5"
                        fill="none"
                        stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
            </button>
        </div>

        <div v-if="expanded" class="tge-layer-item__body">
            <label class="tge-property-editor__label">
                {{ l10n.propTitle }}
                <input
                    type="text"
                    class="tge-property-editor__input text-sm"
                    :value="feature.properties.title ?? ''"
                    @input="updateProp('title', ($event.target as HTMLInputElement).value)" />
            </label>

            <label class="tge-property-editor__label">
                {{ l10n.propDescription }}
                <textarea
                    class="tge-property-editor__textarea text-sm"
                    rows="3"
                    :value="feature.properties.description ?? ''"
                    @input="
                        updateProp('description', ($event.target as HTMLTextAreaElement).value)
                    "></textarea>
            </label>

            <!-- Polygon fill properties -->
            <template v-if="isPolygon">
                <label class="tge-property-editor__label">
                    {{ l10n.propFillColor }}
                    <input
                        type="color"
                        class="tge-property-editor__color"
                        :value="(feature.properties as any)['fill'] ?? '#555555'"
                        @input="updateProp('fill', ($event.target as HTMLInputElement).value)" />
                </label>

                <label class="tge-property-editor__label">
                    {{ l10n.propFillOpacity }}
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        class="tge-property-editor__range"
                        :value="(feature.properties as any)['fill-opacity'] ?? 0.6"
                        @input="
                            updateProp(
                                'fill-opacity',
                                parseNumber(($event.target as HTMLInputElement).value, 0.6)
                            )
                        " />
                </label>
            </template>

            <!-- Stroke properties -->
            <template v-if="isLineOrPolygon">
                <label class="tge-property-editor__label">
                    {{ l10n.propStrokeColor }}
                    <input
                        type="color"
                        class="tge-property-editor__color"
                        :value="(feature.properties as any)['stroke'] ?? '#555555'"
                        @input="
                            updateProp('stroke', ($event.target as HTMLInputElement).value)
                        " />
                </label>

                <label class="tge-property-editor__label">
                    {{ l10n.propStrokeOpacity }}
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        class="tge-property-editor__range"
                        :value="(feature.properties as any)['stroke-opacity'] ?? 1"
                        @input="
                            updateProp(
                                'stroke-opacity',
                                parseNumber(($event.target as HTMLInputElement).value, 1)
                            )
                        " />
                </label>

                <label class="tge-property-editor__label">
                    {{ l10n.propStrokeWidth }}
                    <input
                        type="number"
                        min="0"
                        max="20"
                        class="tge-property-editor__input tge-property-editor__input--sm text-sm"
                        :value="(feature.properties as any)['stroke-width'] ?? 2"
                        @input="
                            updateProp(
                                'stroke-width',
                                parseNumber(($event.target as HTMLInputElement).value, 2)
                            )
                        " />
                </label>
            </template>

            <!-- Circle Point properties -->
            <template v-if="isCirclePoint">
                <label class="tge-property-editor__label">
                    {{ l10n.propPointColor }}
                    <input
                        type="color"
                        class="tge-property-editor__color"
                        :value="(feature.properties as any)['fill'] ?? '#555555'"
                        @input="updateProp('fill', ($event.target as HTMLInputElement).value)" />
                </label>

                <label class="tge-property-editor__label">
                    {{ l10n.propFillOpacity }}
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        class="tge-property-editor__range"
                        :value="(feature.properties as any)['fill-opacity'] ?? 0.6"
                        @input="
                            updateProp(
                                'fill-opacity',
                                parseNumber(($event.target as HTMLInputElement).value, 0.6)
                            )
                        " />
                </label>

                <label class="tge-property-editor__label">
                    {{ l10n.propStrokeColor }}
                    <input
                        type="color"
                        class="tge-property-editor__color"
                        :value="(feature.properties as any)['stroke'] ?? '#ffffff'"
                        @input="
                            updateProp('stroke', ($event.target as HTMLInputElement).value)
                        " />
                </label>

                <label class="tge-property-editor__label">
                    {{ l10n.propStrokeOpacity }}
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        class="tge-property-editor__range"
                        :value="(feature.properties as any)['stroke-opacity'] ?? 1"
                        @input="
                            updateProp(
                                'stroke-opacity',
                                parseNumber(($event.target as HTMLInputElement).value, 1)
                            )
                        " />
                </label>

                <label class="tge-property-editor__label">
                    {{ l10n.propStrokeWidth }}
                    <input
                        type="number"
                        min="0"
                        max="20"
                        class="tge-property-editor__input tge-property-editor__input--sm text-sm"
                        :value="(feature.properties as any)['stroke-width'] ?? 2"
                        @input="
                            updateProp(
                                'stroke-width',
                                parseNumber(($event.target as HTMLInputElement).value, 2)
                            )
                        " />
                </label>

                <label class="tge-property-editor__label">
                    {{ l10n.propCircleRadius }}
                    <input
                        type="number"
                        min="1"
                        max="50"
                        class="tge-property-editor__input tge-property-editor__input--sm text-sm"
                        :value="(feature.properties as any)['circle-radius'] ?? 8"
                        @input="
                            updateProp(
                                'circle-radius',
                                parseNumber(($event.target as HTMLInputElement).value, 8)
                            )
                        " />
                </label>

                <label class="tge-property-editor__label">
                    {{ l10n.propLabel }}
                    <input
                        type="text"
                        class="tge-property-editor__input text-sm"
                        :value="(feature.properties as any)['marker-label'] ?? ''"
                        @input="
                            updateProp('marker-label', ($event.target as HTMLInputElement).value)
                        " />
                </label>

                <label class="tge-property-editor__label">
                    {{ l10n.propLabelPosition }}
                    <select
                        class="tge-property-editor__select text-sm"
                        :value="(feature.properties as any)['marker-label-position'] ?? 'top'"
                        @change="
                            updateProp(
                                'marker-label-position',
                                ($event.target as HTMLSelectElement).value
                            )
                        ">
                        <option value="top">{{ l10n.propPositionTop }}</option>
                        <option value="bottom">{{ l10n.propPositionBottom }}</option>
                        <option value="left">{{ l10n.propPositionLeft }}</option>
                        <option value="right">{{ l10n.propPositionRight }}</option>
                    </select>
                </label>
            </template>

            <!-- Marker properties -->
            <template v-if="isMarker">
                <div class="tge-property-editor__label">
                    {{ l10n.propIcon }}
                    <div class="tge-icon-picker">
                        <button
                            class="tge-icon-picker__trigger"
                            type="button"
                            @click="showIconPicker = !showIconPicker">
                            <template v-if="currentSymbol">
                                <img
                                    v-if="iconUrls.get(currentSymbol)"
                                    :src="iconUrls.get(currentSymbol)"
                                    class="tge-icon-picker__preview"
                                    alt="" />
                                <span class="tge-icon-picker__current">
                                    {{ currentSymbol }}
                                </span>
                            </template>
                            <span v-else class="tge-icon-picker__placeholder">{{
                                l10n.propIconNone
                            }}</span>
                        </button>
                    </div>
                    <div v-if="showIconPicker" class="tge-icon-picker__dropdown">
                        <input
                            type="text"
                            class="tge-icon-picker__search text-sm"
                            v-model="iconSearch"
                            :placeholder="l10n.propIconSearch" />
                        <div class="tge-icon-picker__grid">
                            <button
                                v-for="icon in filteredIcons"
                                :key="icon"
                                class="tge-icon-picker__item"
                                :class="{
                                    'tge-icon-picker__item--active': icon === currentSymbol,
                                }"
                                type="button"
                                :title="icon"
                                @click="selectIcon(icon)">
                                <img
                                    v-if="iconUrls.get(icon)"
                                    :src="iconUrls.get(icon)"
                                    class="tge-icon-picker__item-icon"
                                    alt="" />
                                <span>{{ icon }}</span>
                            </button>
                        </div>
                        <div
                            v-if="filteredIcons.length === 0"
                            class="tge-icon-picker__empty">
                            {{ l10n.propIconNoResults }}
                        </div>
                    </div>
                </div>

                <label class="tge-property-editor__label">
                    {{ l10n.propMarkerColor }}
                    <input
                        type="color"
                        class="tge-property-editor__color"
                        :value="(feature.properties as any)['marker-color'] ?? '#7e7e7e'"
                        @input="
                            updateProp('marker-color', ($event.target as HTMLInputElement).value)
                        " />
                </label>

                <label class="tge-property-editor__label">
                    {{ l10n.propMarkerSize }}
                    <select
                        class="tge-property-editor__select text-sm"
                        :value="(feature.properties as any)['marker-size'] ?? 'medium'"
                        @change="
                            updateProp(
                                'marker-size',
                                ($event.target as HTMLSelectElement).value
                            )
                        ">
                        <option value="small">{{ l10n.propSizeSmall }}</option>
                        <option value="medium">{{ l10n.propSizeMedium }}</option>
                        <option value="large">{{ l10n.propSizeLarge }}</option>
                    </select>
                </label>

                <label class="tge-property-editor__label">
                    {{ l10n.propLabel }}
                    <input
                        type="text"
                        class="tge-property-editor__input text-sm"
                        :value="(feature.properties as any)['marker-label'] ?? ''"
                        @input="
                            updateProp('marker-label', ($event.target as HTMLInputElement).value)
                        " />
                </label>

                <label class="tge-property-editor__label">
                    {{ l10n.propLabelPosition }}
                    <select
                        class="tge-property-editor__select text-sm"
                        :value="(feature.properties as any)['marker-label-position'] ?? 'top'"
                        @change="
                            updateProp(
                                'marker-label-position',
                                ($event.target as HTMLSelectElement).value
                            )
                        ">
                        <option value="top">{{ l10n.propPositionTop }}</option>
                        <option value="bottom">{{ l10n.propPositionBottom }}</option>
                        <option value="left">{{ l10n.propPositionLeft }}</option>
                        <option value="right">{{ l10n.propPositionRight }}</option>
                    </select>
                </label>
            </template>

            <button
                class="tge-layer-item__delete"
                type="button"
                @click="$emit('delete', feature.id)">
                {{ l10n.layerDelete }}
            </button>
        </div>
    </div>
</template>
