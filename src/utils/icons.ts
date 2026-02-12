import type { Map as MaplibreMap } from "maplibre-gl";
import {
    location,
    pin,
    flag,
    star,
    heart,
    home,
    business,
    cafe,
    restaurant,
    car,
    bus,
    bicycle,
    walk,
    airplane,
    boat,
    train,
    medical,
    fitness,
    school,
    library,
    cart,
    basket,
    gift,
    camera,
    musicalNotes,
    football,
    basketball,
    golf,
    tennisball,
    fish,
    leaf,
    flower,
    paw,
    water,
    flame,
    snow,
    sunny,
    moon,
    cloudy,
    thunderstorm,
    warning,
    informationCircle,
    helpCircle,
    checkmarkCircle,
    closeCircle,
    alertCircle,
    wifi,
    cellular,
    globe,
    compass,
    navigate,
    map,
    trailSign,
    bed,
    beer,
    wine,
    pizza,
    iceCream,
} from "ionicons/icons";

/** Built-in SVG icons (not from Ionicons) */
const BUILTIN_SVGS: Record<string, string> = {
    "marker-pin": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 27 41"><path d="M13.5 0C6.044 0 0 6.044 0 13.5 0 24.818 13.5 41 13.5 41S27 24.818 27 13.5C27 6.044 20.956 0 13.5 0z" fill="#000"/></svg>`,
};

const IONICON_URLS: Readonly<Record<string, string>> = {
    "location": location,
    "pin": pin,
    "flag": flag,
    "star": star,
    "heart": heart,
    "home": home,
    "business": business,
    "cafe": cafe,
    "restaurant": restaurant,
    "car": car,
    "bus": bus,
    "bicycle": bicycle,
    "walk": walk,
    "airplane": airplane,
    "boat": boat,
    "train": train,
    "medical": medical,
    "fitness": fitness,
    "school": school,
    "library": library,
    "cart": cart,
    "basket": basket,
    "gift": gift,
    "camera": camera,
    "musical-notes": musicalNotes,
    "football": football,
    "basketball": basketball,
    "golf": golf,
    "tennisball": tennisball,
    "fish": fish,
    "leaf": leaf,
    "flower": flower,
    "paw": paw,
    "water": water,
    "flame": flame,
    "snow": snow,
    "sunny": sunny,
    "moon": moon,
    "cloudy": cloudy,
    "thunderstorm": thunderstorm,
    "warning": warning,
    "information-circle": informationCircle,
    "help-circle": helpCircle,
    "checkmark-circle": checkmarkCircle,
    "close-circle": closeCircle,
    "alert-circle": alertCircle,
    "wifi": wifi,
    "cellular": cellular,
    "globe": globe,
    "compass": compass,
    "navigate": navigate,
    "map": map,
    "trail-sign": trailSign,
    "bed": bed,
    "beer": beer,
    "wine": wine,
    "pizza": pizza,
    "ice-cream": iceCream,
};

/** Common icons available in the picker */
export const COMMON_ICONS = [
    "marker-pin",
    "location",
    "pin",
    "flag",
    "star",
    "heart",
    "home",
    "business",
    "cafe",
    "restaurant",
    "car",
    "bus",
    "bicycle",
    "walk",
    "airplane",
    "boat",
    "train",
    "medical",
    "fitness",
    "school",
    "library",
    "cart",
    "basket",
    "gift",
    "camera",
    "musical-notes",
    "football",
    "basketball",
    "golf",
    "tennisball",
    "fish",
    "leaf",
    "flower",
    "paw",
    "water",
    "flame",
    "snow",
    "sunny",
    "moon",
    "cloudy",
    "thunderstorm",
    "warning",
    "information-circle",
    "help-circle",
    "checkmark-circle",
    "close-circle",
    "alert-circle",
    "wifi",
    "cellular",
    "globe",
    "compass",
    "navigate",
    "map",
    "trail-sign",
    "bed",
    "beer",
    "wine",
    "pizza",
    "ice-cream",
] as const;

function svgToDataUrl(svg: string): string {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function resolveIconUrl(name: string): string | null {
    const builtinSvg = BUILTIN_SVGS[name];
    if (builtinSvg) {
        return svgToDataUrl(builtinSvg);
    }

    return IONICON_URLS[name] ?? null;
}

/** Resolve an icon name to a displayable SVG URL (for UI previews). */
export async function getIconUrl(name: string): Promise<string | null> {
    return resolveIconUrl(name);
}

export async function loadIcon(map: MaplibreMap, name: string): Promise<void> {
    if (map.hasImage(name)) {
        return;
    }

    const url = resolveIconUrl(name);
    if (!url) {
        return;
    }

    try {
        const maxScale = 5;
        const dpr = window.devicePixelRatio || 1;
        const pixelRatio = maxScale * dpr;
        const size = Math.round(32 * pixelRatio);
        const img = new Image(size, size);
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = url;
        });

        if (!map.hasImage(name)) {
            map.addImage(name, img, { pixelRatio, sdf: true });
        }
    } catch {
        // Icon not found — silently ignore
    }
}

export async function loadIconsForFeatures(
    map: MaplibreMap,
    features: Array<{ properties: Record<string, unknown> }>
): Promise<void> {
    const icons = new Set<string>();
    for (const f of features) {
        const sym = f.properties["marker-symbol"];
        if (typeof sym === "string" && sym) {
            icons.add(sym);
        }
    }
    await Promise.all([...icons].map((name) => loadIcon(map, name)));
}
