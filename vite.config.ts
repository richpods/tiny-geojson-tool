import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
    plugins: [vue(), tailwindcss()],
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
        },
    },
    build: {
        lib: {
            entry: resolve(__dirname, "src/index.ts"),
            formats: ["es"],
            fileName: "tiny-geojson-tool",
            cssFileName: "styles/editor",
        },
        cssCodeSplit: false,
        rollupOptions: {
            external: ["vue", "maplibre-gl", "pmtiles"],
            output: {
                globals: { vue: "Vue" },
            },
        },
    },
});
