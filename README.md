# Teal / Bus Studio

An interactive Three.js exterior study of the painted 2016 Ford E-450 shuttle bus, modeled from the supplied photographs and walkaround videos. Approximately 26 feet long and 10 feet tall; coach width is approximately 8 feet. Teal paint covers the cab, coach, roof, and roof equipment. Tires, glazing, lights, and chrome retain their respective materials.

The dark viewer displays only a compact vehicle stats panel and camera controls. The paint is a digital approximation of Porsche Fjord Green, modeled as a solid gloss finish with no metallic component. Reference: https://www.carpaints.co/paints/detail/fjord-green (including its photographic swatch); Porsche Classic also lists Fjord Green in its 1960–1961 colour archive. Display and lighting affect perceived color.

The model includes a smoothly lofted roof cap and hood, a bowed windshield, flared wheel arches, dual rear tires with detailed wheel dishes, passenger entry and lift doors, rear emergency glazing, lens reflectors, hinges, fasteners, badges, and weather seals. Layered teal paint, tinted glass, chrome, and rubber use separate physical materials with a procedural studio reflection environment.

Drag to orbit, scroll or pinch to zoom, and right-drag or use two fingers to pan. Presets cover the driver side, entry side, rear, and roof. Automatic orbit and camera reset are available. Dimensions and details not fully visible in the references are approximate; this is a visual model, not a fabrication drawing.

## Panel viewer

Use **PANEL VIEWER** to open a contiguous, same-scale SVG net of 23 exterior panels. The widest coach panels fill most of the available screen width; scroll to reach the cab and end panels. Window, wheel, door, lamp, and roof-equipment openings are excluded as appropriate.

Hover or focus a panel to highlight it. Click or press Enter to isolate it, with an orbitable 3D locator in the bottom-left corner. **All panels** returns to the sheet; **Back to 3D** restores the original bus view. Escape moves back one level. **Download SVG** exports the entire sheet or the selected panel, with millimetre dimensions and genuine vector paths.

These are model-based placement guides, not measured cutting templates. The hood, roof caps, and fenders use projected outlines: measure the real bus and allow for curvature, stretch, trim margins, and seams before fabrication. Shared definitions in `src/panels.js` drive both SVG outlines and 3D highlights.

Run `node check-panels.mjs` for geometry-area, cutout, selection, export, and desktop/mobile browser checks in the local browser environment. Set `BUS_URL` to verify a deployed URL.

## Local

`npm ci` then `npm run dev` serves on port 5009, including the hostname `hmsharbor`. `npm run build` produces the static application in `dist`.

The local deployment uses `deploy/bus-vis.service` to serve the production build. After edits, run `npm run build` to update it.

## GitHub Pages deployment

Repository: `VRatMIT/bus-vis`. The included GitHub Actions workflow deploys the static build to `https://vratmit.github.io/bus-vis/`. This is a project site: it does not modify the separate `vratmit.github.io` repository or its homepage. The `hmsharbor:5009` production service remains available.

Reference photographs and video files remain local and are excluded from Git. Geometry is authored in `src/bus.js` and `src/sculpt.js`; physical materials and reflection lighting are in `src/materials.js`. No model downloads or external 3D services are needed at runtime.
