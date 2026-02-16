import { LngLatBounds } from "maplibre-gl";
import type { EditorFeatureCollection, GeoJsonBbox, Position, BboxPadding } from "../types";

export interface MapPadding {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export const DEFAULT_BBOX_PADDING: BboxPadding = [0, 0, 0, 0];

/**
 * Returns bounds for initial map view.
 * Priority:
 * 1) GeoJSON bbox member (if present on FeatureCollection)
 * 2) Calculated bounds from FeatureCollection.features
 */
export function getBounds(modelValue?: EditorFeatureCollection): LngLatBounds | null {
    if (!modelValue) return null;

    const bboxBounds = getBoundsFromGeoJsonBbox(modelValue.bbox);
    if (bboxBounds) return bboxBounds;

    if (modelValue.features.length === 0) return null;

    const bounds = new LngLatBounds();
    let hasCoordinates = false;

    for (const feature of modelValue.features) {
        const geometry = feature.geometry;
        if (!geometry) continue;

        if (geometry.type === "Point") {
            const [lng, lat] = geometry.coordinates;
            if (isValidPosition([lng, lat])) {
                bounds.extend([lng, lat]);
                hasCoordinates = true;
            }
            continue;
        }

        if (geometry.type === "LineString") {
            for (const [lng, lat] of geometry.coordinates) {
                if (!isValidPosition([lng, lat])) continue;
                bounds.extend([lng, lat]);
                hasCoordinates = true;
            }
            continue;
        }

        if (geometry.type === "Polygon") {
            for (const ring of geometry.coordinates) {
                for (const [lng, lat] of ring) {
                    if (!isValidPosition([lng, lat])) continue;
                    bounds.extend([lng, lat]);
                    hasCoordinates = true;
                }
            }
        }
    }

    if (!hasCoordinates || bounds.isEmpty()) return null;
    return bounds;
}

export function getPadding(
    bboxPadding: BboxPadding = DEFAULT_BBOX_PADDING,
    extraPadding?: Partial<MapPadding>
): MapPadding {
    const [top, right, bottom, left] = normalizeBboxPadding(bboxPadding);
    return {
        top: sanitizePadding(top) + sanitizePadding(extraPadding?.top),
        right: sanitizePadding(right) + sanitizePadding(extraPadding?.right),
        bottom: sanitizePadding(bottom) + sanitizePadding(extraPadding?.bottom),
        left: sanitizePadding(left) + sanitizePadding(extraPadding?.left),
    };
}

function getBoundsFromGeoJsonBbox(bbox?: GeoJsonBbox): LngLatBounds | null {
    if (!bbox) return null;
    if (bbox.length !== 4 && bbox.length !== 6) return null;

    const west = bbox[0];
    const south = bbox[1];
    const east = bbox.length === 6 ? bbox[3] : bbox[2];
    const north = bbox.length === 6 ? bbox[4] : bbox[3];

    if (
        !Number.isFinite(west) ||
        !Number.isFinite(south) ||
        !Number.isFinite(east) ||
        !Number.isFinite(north)
    ) {
        return null;
    }

    return new LngLatBounds([west, south], [east, north]);
}

function isValidPosition(position: Position): boolean {
    return Number.isFinite(position[0]) && Number.isFinite(position[1]);
}

function normalizeBboxPadding(value: BboxPadding): BboxPadding {
    if (Array.isArray(value) && value.length === 4) {
        return value;
    }
    return DEFAULT_BBOX_PADDING;
}

function sanitizePadding(value?: number): number {
    if (value === undefined || !Number.isFinite(value)) return 0;
    return Math.max(0, value);
}
