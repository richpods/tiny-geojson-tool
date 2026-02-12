<script setup lang="ts">
import { ref } from "vue";
import { GeoJsonEditor, GeoJsonViewer } from "../src";
import type { EditorFeatureCollection, Position } from "../src";

const center: Position = [16.39333, 48.22797];
const geojson = ref<EditorFeatureCollection>({
    type: "FeatureCollection",
    features: [],
});

const showJson = ref(false);
const mode = ref<"editor" | "viewer">("editor");
</script>

<template>
    <div class="demo">
        <GeoJsonEditor v-if="mode === 'editor'" v-model="geojson" :center="center" :zoom="15" />
        <GeoJsonViewer v-else :modelValue="geojson" :center="center" :zoom="15" />
        <div class="demo-controls">
            <button
                class="demo-toggle"
                :class="{ active: mode === 'editor' }"
                @click="mode = 'editor'">
                Editor
            </button>
            <button
                class="demo-toggle"
                :class="{ active: mode === 'viewer' }"
                @click="mode = 'viewer'">
                Viewer
            </button>
            <button class="demo-toggle" @click="showJson = !showJson">
                {{ showJson ? "Hide" : "Show" }} JSON
            </button>
        </div>
        <pre v-if="showJson" class="json-output">{{ JSON.stringify(geojson, null, 2) }}</pre>
    </div>
</template>

<style>
.demo {
    height: 100vh;
    width: 100vw;
    position: relative;
    display: flex;
}

.demo-controls {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 10;
    display: flex;
    gap: 4px;
}

.demo-toggle {
    padding: 6px 14px;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
}

.demo-toggle.active {
    background: #3388ff;
    color: #fff;
    border-color: #3388ff;
}

.json-output {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 400px;
    max-height: 50vh;
    overflow: auto;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #e0e0e0;
    border-radius: 6px 0 0 0;
    padding: 12px;
    font-size: 12px;
    z-index: 10;
    margin: 0;
}
</style>
