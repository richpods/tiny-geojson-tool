/** Locale strings for the GeoJSON editor UI */
export interface EditorLocale {
    toolSelect: string;
    toolMarker: string;
    toolLine: string;
    toolPolygon: string;
    toolEraser: string;
    propTitle: string;
    propDescription: string;
    propFillColor: string;
    propFillOpacity: string;
    propStrokeColor: string;
    propStrokeOpacity: string;
    propStrokeWidth: string;
    propMarkerColor: string;
    propMarkerSize: string;
    propSizeSmall: string;
    propSizeMedium: string;
    propSizeLarge: string;
    propIcon: string;
    propIconRemove: string;
    propIconNone: string;
    propIconSearch: string;
    propIconNoResults: string;
    propLabel: string;
    propLabelPosition: string;
    propPositionTop: string;
    propPositionBottom: string;
    propPositionLeft: string;
    propPositionRight: string;
}

export const DEFAULT_LOCALE: EditorLocale = {
    toolSelect: "Select",
    toolMarker: "Marker",
    toolLine: "Line",
    toolPolygon: "Polygon",
    toolEraser: "Eraser",
    propTitle: "Title",
    propDescription: "Description",
    propFillColor: "Fill color",
    propFillOpacity: "Fill opacity",
    propStrokeColor: "Stroke color",
    propStrokeOpacity: "Stroke opacity",
    propStrokeWidth: "Stroke width",
    propMarkerColor: "Marker color",
    propMarkerSize: "Marker size",
    propSizeSmall: "Small",
    propSizeMedium: "Medium",
    propSizeLarge: "Large",
    propIcon: "Icon",
    propIconRemove: "Remove icon",
    propIconNone: "None",
    propIconSearch: "Search icons...",
    propIconNoResults: "No icons found",
    propLabel: "Label",
    propLabelPosition: "Label position",
    propPositionTop: "Top",
    propPositionBottom: "Bottom",
    propPositionLeft: "Left",
    propPositionRight: "Right",
};
