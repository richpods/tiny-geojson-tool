<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { EditorFeature, EditorProperties } from "../types";
import type { EditorLocale } from "../l10n";
import { COMMON_ICONS, getIconUrl } from "../utils/icons";

const props = defineProps<{
    feature: EditorFeature | null;
    l10n: EditorLocale;
}>();

const emit = defineEmits<{
    (e: "update", id: string, properties: Partial<EditorProperties>): void;
    (e: "close"): void;
}>();

const geomType = computed(() => props.feature?.geometry.type ?? null);

const isPolygon = computed(() => geomType.value === "Polygon");
const isLineOrPolygon = computed(
    () => geomType.value === "Polygon" || geomType.value === "LineString"
);

const isPoint = computed(() => geomType.value === "Point");

const iconSearch = ref("");
const showIconPicker = ref(false);
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

const filteredIcons = computed(() => {
    const q = iconSearch.value.toLowerCase();
    if (!q) return COMMON_ICONS;
    return COMMON_ICONS.filter((name) => name.includes(q));
});

const currentSymbol = computed(
    () => ((props.feature?.properties as Record<string, unknown>)?.["marker-symbol"] as string) ?? ""
);

function selectIcon(name: string) {
    updateProp("marker-symbol", name);
    showIconPicker.value = false;
    iconSearch.value = "";
}

function clearIcon() {
    updateProp("marker-symbol", "");
    showIconPicker.value = false;
    iconSearch.value = "";
}

function updateProp(key: string, value: unknown) {
    if (!props.feature) return;
    emit("update", props.feature.id, { [key]: value } as Partial<EditorProperties>);
}

function parseNumber(val: string, fallback: number): number {
    const n = parseFloat(val);
    return isNaN(n) ? fallback : n;
}
</script>

<template>
    <div v-if="feature" class="tge-property-editor">
        <div class="tge-property-editor__header">
            <span class="tge-property-editor__type">{{ geomType }}</span>
            <button class="tge-property-editor__close" @click="$emit('close')">&times;</button>
        </div>

        <div class="tge-property-editor__body">
            <!-- Common properties -->
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

            <!-- Point / Marker properties -->
            <template v-if="isPoint">
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
                        <button
                            v-if="currentSymbol"
                            class="tge-icon-picker__clear"
                            type="button"
                            :title="l10n.propIconRemove"
                            @click="clearIcon">
                            &times;
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
        </div>
    </div>
</template>
