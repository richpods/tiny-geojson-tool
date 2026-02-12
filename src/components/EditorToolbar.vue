<script setup lang="ts">
import type { ToolMode } from "../types";
import type { EditorLocale } from "../l10n";

const props = defineProps<{
    activeTool: ToolMode;
    l10n: EditorLocale;
}>();

const emit = defineEmits<{
    (e: "update:activeTool", tool: ToolMode): void;
}>();

type ToolDef = { mode: ToolMode; labelKey: keyof EditorLocale; icon: string };

const tools: ToolDef[] = [
    { mode: "select", labelKey: "toolSelect", icon: "cursor" },
    { mode: "draw-marker", labelKey: "toolMarker", icon: "marker" },
    { mode: "draw-line", labelKey: "toolLine", icon: "line" },
    { mode: "draw-polygon", labelKey: "toolPolygon", icon: "polygon" },
    { mode: "eraser", labelKey: "toolEraser", icon: "eraser" },
];

function setTool(mode: ToolMode) {
    emit("update:activeTool", mode);
}
</script>

<template>
    <div class="tge-toolbar">
        <button
            v-for="tool in tools"
            :key="tool.mode"
            class="tge-toolbar__btn"
            :class="{
                'tge-toolbar__btn--active': props.activeTool === tool.mode,
                'tge-toolbar__btn--eraser': tool.mode === 'eraser',
            }"
            :title="props.l10n[tool.labelKey]"
            @click="setTool(tool.mode)">
            <svg class="tge-toolbar__icon" viewBox="0 0 24 24" width="22" height="22">
                <!-- Select / pointer -->
                <template v-if="tool.icon === 'cursor'">
                    <path
                        d="M5 3l14 8-6.5 1.5L11 19z"
                        fill="currentColor"
                        stroke="currentColor"
                        stroke-width="1"
                        stroke-linejoin="round" />
                </template>
                <!-- Marker -->
                <template v-else-if="tool.icon === 'marker'">
                    <path
                        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
                        fill="currentColor" />
                </template>
                <!-- Line -->
                <template v-else-if="tool.icon === 'line'">
                    <path
                        d="M4 20L20 4"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                        stroke-linecap="round" />
                    <circle cx="4" cy="20" r="2.5" fill="currentColor" />
                    <circle cx="20" cy="4" r="2.5" fill="currentColor" />
                </template>
                <!-- Polygon -->
                <template v-else-if="tool.icon === 'polygon'">
                    <polygon
                        points="12,3 21,10 18,20 6,20 3,10"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linejoin="round" />
                    <circle cx="12" cy="3" r="2" fill="currentColor" />
                    <circle cx="21" cy="10" r="2" fill="currentColor" />
                    <circle cx="18" cy="20" r="2" fill="currentColor" />
                    <circle cx="6" cy="20" r="2" fill="currentColor" />
                    <circle cx="3" cy="10" r="2" fill="currentColor" />
                </template>
                <!-- Eraser -->
                <template v-else-if="tool.icon === 'eraser'">
                    <path
                        d="M16.24 3.56l4.2 4.2a2 2 0 010 2.83L11.9 19.14a2 2 0 01-2.83 0L4.56 14.6a2 2 0 010-2.83l8.85-8.85a2 2 0 012.83.64zM4 21h16"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round" />
                </template>
            </svg>
        </button>
    </div>
</template>
