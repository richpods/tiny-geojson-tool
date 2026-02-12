import { ref, computed } from "vue";
import type { ToolMode, Position } from "../types";

export function useDrawing() {
    const activeTool = ref<ToolMode>("select");
    const drawingCoords = ref<Position[]>([]);
    const selectedFeatureId = ref<string | null>(null);

    const isDrawing = computed(
        () =>
            (activeTool.value === "draw-polygon" ||
                activeTool.value === "draw-line") &&
            drawingCoords.value.length > 0
    );

    function setTool(tool: ToolMode) {
        cancelDrawing();
        selectedFeatureId.value = null;
        activeTool.value = tool;
    }

    function addDrawingCoord(coord: Position) {
        drawingCoords.value = [...drawingCoords.value, coord];
    }

    function cancelDrawing() {
        drawingCoords.value = [];
    }

    function finishDrawing(): Position[] {
        const coords = [...drawingCoords.value];
        drawingCoords.value = [];
        return coords;
    }

    function selectFeature(id: string | null) {
        selectedFeatureId.value = id;
    }

    function distancePx(
        map: { project: (lngLat: [number, number]) => { x: number; y: number } },
        a: Position,
        b: Position
    ): number {
        const pa = map.project(a);
        const pb = map.project(b);
        return Math.sqrt((pa.x - pb.x) ** 2 + (pa.y - pb.y) ** 2);
    }

    /** Build temporary GeoJSON for drawing preview */
    function getTempGeoJson(): GeoJSON.FeatureCollection {
        const features: GeoJSON.Feature[] = [];
        const coords = drawingCoords.value;

        const firstCoord = coords[0];
        if (activeTool.value === "draw-polygon" && coords.length >= 3 && firstCoord) {
            features.push({
                type: "Feature",
                properties: {},
                geometry: {
                    type: "Polygon",
                    coordinates: [[...coords, firstCoord]],
                },
            });
        }

        return { type: "FeatureCollection", features };
    }

    function getTempLineGeoJson(mousePos?: Position): GeoJSON.FeatureCollection {
        const features: GeoJSON.Feature[] = [];
        const coords = drawingCoords.value;

        if (coords.length >= 1) {
            const lineCoords = mousePos ? [...coords, mousePos] : [...coords];
            if (lineCoords.length >= 2) {
                features.push({
                    type: "Feature",
                    properties: {},
                    geometry: {
                        type: "LineString",
                        coordinates: lineCoords,
                    },
                });
            }
        }

        return { type: "FeatureCollection", features };
    }

    function getTempVerticesGeoJson(): GeoJSON.FeatureCollection {
        return {
            type: "FeatureCollection",
            features: drawingCoords.value.map((coord, i) => ({
                type: "Feature" as const,
                properties: { index: i },
                geometry: {
                    type: "Point" as const,
                    coordinates: coord,
                },
            })),
        };
    }

    return {
        activeTool,
        drawingCoords,
        selectedFeatureId,
        isDrawing,
        setTool,
        addDrawingCoord,
        cancelDrawing,
        finishDrawing,
        selectFeature,
        distancePx,
        getTempGeoJson,
        getTempLineGeoJson,
        getTempVerticesGeoJson,
    };
}
