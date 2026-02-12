import { LngLatBounds, type Map as MaplibreMap } from "maplibre-gl";
import type { EditorFeature, Position } from "../types";

const DEFAULT_FIT_PADDING = 40;
const DEFAULT_FIT_MAX_ZOOM = 15;
const DEFAULT_FIT_POINT_ZOOM = 15;

export function shouldAutoFitOnLoad(center?: Position, zoom?: number): boolean {
    return center === undefined && zoom === undefined;
}

export function fitMapToFeatures(
    map: MaplibreMap,
    features: EditorFeature[],
    options?: {
        padding?: number;
        maxZoom?: number;
        pointZoom?: number;
    }
): void {
    if (features.length === 0) return;

    const bounds = new LngLatBounds();
    for (const feature of features) {
        const coords = feature.geometry.coordinates;
        if (feature.geometry.type === "Point") {
            bounds.extend(coords as [number, number]);
        } else if (feature.geometry.type === "LineString") {
            for (const c of coords as [number, number][]) bounds.extend(c);
        } else if (feature.geometry.type === "Polygon") {
            for (const ring of coords as [number, number][][]) {
                for (const c of ring) bounds.extend(c);
            }
        }
    }

    if (bounds.isEmpty()) return;

    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const isPoint = sw.lng === ne.lng && sw.lat === ne.lat;

    const padding = options?.padding ?? DEFAULT_FIT_PADDING;
    const maxZoom = options?.maxZoom ?? DEFAULT_FIT_MAX_ZOOM;
    const pointZoom = options?.pointZoom ?? DEFAULT_FIT_POINT_ZOOM;

    if (isPoint) {
        map.jumpTo({ center: sw, zoom: pointZoom });
    } else {
        map.fitBounds(bounds, { padding, maxZoom });
    }
}
