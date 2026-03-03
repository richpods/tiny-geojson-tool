import { ref } from "vue";

const RESULT_LIMIT = 5;
const MAX_CACHE_SIZE = 100;

export interface PhotonResult {
    display_name: string;
    lat: number;
    lon: number;
    extent?: [number, number, number, number]; // [west, south, east, north]
}

export interface Viewport {
    center: [number, number]; // [lng, lat]
    zoom: number;
}

interface PhotonFeatureProperties {
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
    extent?: [number, number, number, number];
}

interface PhotonFeature {
    type: "Feature";
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: PhotonFeatureProperties;
}

interface PhotonResponse {
    type: "FeatureCollection";
    features: PhotonFeature[];
}

const cache = new Map<string, PhotonResult[]>();
let lastRequestTime = 0;

function buildDisplayName(props: PhotonFeatureProperties): string {
    const parts: string[] = [];
    if (props.name) parts.push(props.name);

    const address: string[] = [];
    if (props.street && props.housenumber) {
        address.push(`${props.street} ${props.housenumber}`);
    } else if (props.street) {
        address.push(props.street);
    }
    if (props.postcode && props.city) {
        address.push(`${props.postcode} ${props.city}`);
    } else if (props.city) {
        address.push(props.city);
    } else if (props.district) {
        address.push(props.district);
    }
    if (props.state) address.push(props.state);
    if (props.country) address.push(props.country);

    // Avoid duplicating the name if it equals the first address part
    if (parts.length > 0 && address.length > 0 && parts[0] === address[0]) {
        address.shift();
    }

    parts.push(...address);
    return parts.join(", ");
}

function toResult(feature: PhotonFeature): PhotonResult {
    const [lon, lat] = feature.geometry.coordinates;
    return {
        display_name: buildDisplayName(feature.properties),
        lat: lat!,
        lon: lon!,
        extent: feature.properties.extent,
    };
}

export function usePhotonSearch(
    photonUrl: string,
    getViewport?: () => Viewport | null,
    language?: string
) {
    const query = ref("");
    const results = ref<PhotonResult[]>([]);
    const loading = ref(false);
    const error = ref(false);
    const searched = ref(false);

    async function search() {
        const q = query.value.trim().replace(/\s+/g, " ");
        if (!q) return;

        error.value = false;

        const cacheKey = `${photonUrl}|${q}|${language ?? ""}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            results.value = cached;
            searched.value = true;
            return;
        }

        // Rate limit: 1 request per second
        const now = Date.now();
        const wait = Math.max(0, 1000 - (now - lastRequestTime));
        if (wait > 0) {
            await new Promise((r) => setTimeout(r, wait));
        }

        loading.value = true;
        try {
            let url = `${photonUrl}/api?q=${encodeURIComponent(q)}&limit=${RESULT_LIMIT}`;
            const viewport = getViewport?.() ?? null;
            if (viewport) {
                url += `&lat=${viewport.center[1]}&lon=${viewport.center[0]}&zoom=${Math.round(viewport.zoom)}`;
            }
            if (language) {
                url += `&lang=${encodeURIComponent(language)}`;
            }
            lastRequestTime = Date.now();
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`Photon request failed (${res.status})`);
            }
            const data: PhotonResponse = await res.json();
            const mapped = data.features.map(toResult);
            if (cache.size >= MAX_CACHE_SIZE) {
                cache.clear();
            }
            cache.set(cacheKey, mapped);
            results.value = mapped;
            searched.value = true;
        } catch {
            error.value = true;
            results.value = [];
        } finally {
            loading.value = false;
        }
    }

    function clear() {
        query.value = "";
        results.value = [];
        error.value = false;
        searched.value = false;
    }

    return { query, results, loading, error, searched, search, clear };
}
