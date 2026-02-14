<script setup lang="ts">
import { ref } from "vue";
import { GeoJsonEditor, GeoJsonViewer } from "../src";
import type { EditorFeatureCollection, Position } from "../src";

const PMTILES_URL =
    "https://storage.googleapis.com/richpod-shortbread-tiles/shortbread-europe.pmtiles";
const center: Position = [16.39333, 48.22797];
const geojson = ref<EditorFeatureCollection>({
    type: "FeatureCollection",
    features: [],
});

const showJson = ref(false);
const mode = ref<"editor" | "viewer">("editor");
const copyFeedback = ref(false);
const downloadFeedback = ref(false);

function flash(target: typeof copyFeedback) {
    target.value = true;
    setTimeout(() => (target.value = false), 1500);
}

function copyJson() {
    navigator.clipboard.writeText(JSON.stringify(geojson.value, null, 2));
    flash(copyFeedback);
}

function downloadJson() {
    const blob = new Blob([JSON.stringify(geojson.value, null, 2)], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `richpods-${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
    flash(downloadFeedback);
}
</script>

<template>
    <div class="demo">
        <GeoJsonEditor
            v-if="mode === 'editor'"
            v-model="geojson"
            :pmtilesUrl="PMTILES_URL"
            :center="center"
            :zoom="15" />
        <GeoJsonViewer
            v-else
            :modelValue="geojson"
            :pmtilesUrl="PMTILES_URL"
            :center="center"
            :zoom="15" />
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
        <div v-if="showJson" class="json-panel">
            <pre class="json-output">{{ JSON.stringify(geojson, null, 2) }}</pre>
            <div class="json-actions">
                <button class="demo-toggle json-action-btn" @click="copyJson">
                    <svg viewBox="0 0 512 512" width="14" height="14"><rect x="128" y="128" width="336" height="336" rx="57" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="32"/><path d="M383.5 128l.5-24a56.16 56.16 0 00-56-56H112a64.19 64.19 0 00-64 64v216a56.16 56.16 0 0056 56h24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/></svg>
                    Copy
                    <Transition name="fade"><span v-if="copyFeedback" class="json-feedback">Copied!</span></Transition>
                </button>
                <button class="demo-toggle json-action-btn" @click="downloadJson">
                    <svg viewBox="0 0 512 512" width="14" height="14"><path d="M336 176h40a40 40 0 0140 40v208a40 40 0 01-40 40H136a40 40 0 01-40-40V216a40 40 0 0140-40h40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><polyline points="176 272 256 352 336 272" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><line x1="256" y1="48" x2="256" y2="336" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/></svg>
                    Download
                    <Transition name="fade"><span v-if="downloadFeedback" class="json-feedback">Saved!</span></Transition>
                </button>
            </div>
        </div>
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
    left: 50%;
    transform: translateX(-50%);
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

.json-panel {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    z-index: 10;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
}

.json-output {
    flex: 1;
    overflow: auto;
    padding: 12px;
    font-size: 12px;
    margin: 0;
}

.json-actions {
    display: flex;
    gap: 8px;
    padding: 10px 12px;
    border-top: 1px solid #e0e0e0;
}

.json-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
}

.json-feedback {
    font-size: 11px;
    color: #16a34a;
    margin-left: 2px;
}

.fade-enter-active {
    transition: opacity 0.15s ease;
}
.fade-leave-active {
    transition: opacity 0.6s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
