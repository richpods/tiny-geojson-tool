<script setup lang="ts">
import { watch, onUnmounted } from "vue";
import {
    usePhotonSearch,
    type PhotonResult,
    type Viewport,
} from "../composables/usePhotonSearch";
import type { EditorLocale } from "../l10n";

const POINT_BBOX_OFFSET = 0.01;

const props = withDefaults(
    defineProps<{
        photonUrl: string;
        l10n: EditorLocale;
        searchDelay?: number;
        getViewport?: () => Viewport | null;
        searchLanguage?: string;
    }>(),
    { searchDelay: 2000 }
);

const emit = defineEmits<{
    (e: "select", bounds: [[number, number], [number, number]]): void;
}>();

const { query, results, loading, error, searched, search, clear } = usePhotonSearch(
    props.photonUrl,
    props.getViewport,
    props.searchLanguage
);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(query, (q) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (q.trim().length < 4) return;
    debounceTimer = setTimeout(() => search(), props.searchDelay);
});

onUnmounted(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
});

function onSubmit() {
    if (debounceTimer) clearTimeout(debounceTimer);
    search();
}

function onSelect(result: PhotonResult) {
    if (result.extent) {
        const [west, south, east, north] = result.extent;
        emit("select", [
            [west, south],
            [east, north],
        ]);
    } else {
        emit("select", [
            [result.lon - POINT_BBOX_OFFSET, result.lat - POINT_BBOX_OFFSET],
            [result.lon + POINT_BBOX_OFFSET, result.lat + POINT_BBOX_OFFSET],
        ]);
    }
    clear();
}
</script>

<template>
    <div class="tge-location-search">
        <form class="tge-location-search__form" @submit.prevent="onSubmit">
            <input
                v-model="query"
                class="tge-location-search__input"
                type="text"
                :placeholder="l10n.locationSearchPlaceholder"
                autocomplete="off" />
            <button class="tge-location-search__btn" type="submit" :disabled="loading">
                {{ l10n.locationSearchAction }}
            </button>
        </form>
        <ul v-if="results.length > 0" class="tge-location-search__results">
            <li v-for="(r, i) in results" :key="i">
                <button
                    class="tge-location-search__result"
                    type="button"
                    @mousedown.prevent
                    @click="onSelect(r)">
                    {{ r.display_name }}
                </button>
            </li>
        </ul>
        <div v-else-if="error" class="tge-location-search__no-results">
            {{ l10n.locationSearchError }}
        </div>
        <div
            v-else-if="searched && results.length === 0"
            class="tge-location-search__no-results">
            {{ l10n.locationSearchNoResults }}
        </div>
    </div>
</template>
