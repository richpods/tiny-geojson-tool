import { createApp } from "vue";
import App from "./App.vue";
import "maplibre-gl/dist/maplibre-gl.css";
import "../src/styles/theme-standard.scss";
import "../src/styles/editor.scss";
import "./demo.css";

createApp(App).mount("#app");
