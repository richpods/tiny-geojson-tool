import { ref } from "vue";

const RESULT_LIMIT = 5;
const MAX_CACHE_SIZE = 100;

export interface NominatimResult {
    display_name: string;
    lat: string;
    lon: string;
    boundingbox: [string, string, string, string]; // [south, north, west, east]
}

export interface Viewport {
    bounds: [number, number, number, number]; // [west, south, east, north]
    zoom: number;
}

const cache = new Map<string, NominatimResult[]>();
let lastRequestTime = 0;

function getViewboxExpansion(zoom: number): number {
    if (zoom < 5) return 0.1;
    if (zoom < 8) return 0.2;
    if (zoom < 10) return 0.5;
    if (zoom < 11) return 1.5;
    if (zoom < 12) return 3.0;
    return 4.0;
}

function expandViewbox(viewport: Viewport): string {
    const [west, south, east, north] = viewport.bounds;
    const expansion = getViewboxExpansion(viewport.zoom);
    const lngSpan = east - west;
    const latSpan = north - south;
    const ew = west - lngSpan * expansion;
    const ee = east + lngSpan * expansion;
    const es = Math.max(-90, south - latSpan * expansion);
    const en = Math.min(90, north + latSpan * expansion);
    return `${ew},${es},${ee},${en}`;
}

export function useNominatimSearch(
    nominatimUrl: string,
    getViewport?: () => Viewport | null,
    language?: string
) {
    const query = ref("");
    const results = ref<NominatimResult[]>([]);
    const loading = ref(false);
    const error = ref(false);
    const searched = ref(false);

    async function search() {
        const q = query.value.trim().replace(/\s+/g, " ");
        if (!q) return;

        error.value = false;

        const viewport = getViewport?.() ?? null;
        const viewbox = viewport ? expandViewbox(viewport) : "";
        const cacheKey = `${nominatimUrl}|${q}|${language ?? ""}`;
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
            let url = `${nominatimUrl}/search?q=${encodeURIComponent(q)}&format=jsonv2&limit=${RESULT_LIMIT}`;
            if (viewbox) {
                url += `&viewbox=${viewbox}`;
            }
            if (language) {
                url += `&accept-language=${encodeURIComponent(language)}`;
            }
            lastRequestTime = Date.now();
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`Nominatim request failed (${res.status})`);
            }
            const data: NominatimResult[] = await res.json();
            if (cache.size >= MAX_CACHE_SIZE) {
                cache.clear();
            }
            cache.set(cacheKey, data);
            results.value = data;
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
