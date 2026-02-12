import { type Ref } from "vue";
import type {
    EditorFeatureCollection,
    EditorFeature,
    EditorProperties,
    Position,
} from "../types";
import { generateFeatureId } from "../utils/id";

export function useGeoJson(model: Ref<EditorFeatureCollection>) {
    function addFeature(feature: EditorFeature): void {
        model.value = {
            ...model.value,
            features: [...model.value.features, feature],
        };
    }

    function removeFeature(id: string): void {
        model.value = {
            ...model.value,
            features: model.value.features.filter((f) => f.id !== id),
        };
    }

    function updateFeature(id: string, updater: (f: EditorFeature) => EditorFeature): void {
        model.value = {
            ...model.value,
            features: model.value.features.map((f) => (f.id === id ? updater(f) : f)),
        };
    }

    function updateFeatureProperties(id: string, props: Partial<EditorProperties>): void {
        updateFeature(id, (f) => ({
            ...f,
            properties: { ...f.properties, ...props },
        }));
    }

    function createPolygon(coordinates: Position[][]): EditorFeature {
        const id = generateFeatureId();
        return {
            type: "Feature",
            id,
            geometry: { type: "Polygon", coordinates },
            properties: { id },
        };
    }

    function createLineString(coordinates: Position[]): EditorFeature {
        const id = generateFeatureId();
        return {
            type: "Feature",
            id,
            geometry: { type: "LineString", coordinates },
            properties: { id },
        };
    }

    function createPoint(coordinates: Position): EditorFeature {
        const id = generateFeatureId();
        return {
            type: "Feature",
            id,
            geometry: { type: "Point", coordinates },
            properties: { id },
        };
    }

    function createMarker(coordinates: Position): EditorFeature {
        const id = generateFeatureId();
        return {
            type: "Feature",
            id,
            geometry: { type: "Point", coordinates },
            properties: { id, "marker-symbol": "location" },
        };
    }

    function getFeature(id: string): EditorFeature | undefined {
        return model.value.features.find((f) => f.id === id);
    }

    return {
        model,
        addFeature,
        removeFeature,
        updateFeature,
        updateFeatureProperties,
        createPolygon,
        createLineString,
        createPoint,
        createMarker,
        getFeature,
    };
}
