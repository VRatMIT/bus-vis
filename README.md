# Teal / Bus Studio

An interactive Three.js exterior study of the painted 2016 Ford E-450 shuttle bus, modeled from the supplied photographs and walkaround videos. Approximately 26 feet long and 10 feet tall; coach width is approximately 8 feet. Teal paint covers the cab, coach, roof, and roof equipment. Tires, glazing, lights, and chrome retain their respective materials.

The model includes a smoothly lofted roof cap and hood, a bowed windshield, flared wheel arches, dual rear tires with detailed wheel dishes, passenger entry and lift doors, rear emergency glazing, lens reflectors, hinges, fasteners, badges, and weather seals. Layered teal paint, tinted glass, chrome, and rubber use separate physical materials with a procedural studio reflection environment.

Drag to orbit, scroll or pinch to zoom, and right-drag or use two fingers to pan. Presets cover the driver side, entry side, rear, and roof. Automatic orbit, camera reset, and dusk lighting are available. Dimensions and details not fully visible in the references are approximate; this is a visual model, not a fabrication drawing.

## Local

`npm ci` then `npm run dev` serves on port 5009, including the hostname `hmsharbor`. `npm run build` produces the static application in `dist`. Google Fonts are optional, with system font fallbacks.

The local deployment uses `deploy/bus-vis.service` to serve the production build. After edits, run `npm run build` to update it.

## Repository and optional Pages deployment

Repository: `VRatMIT/bus-vis`. The included GitHub Actions workflow can deploy the static build when **GitHub Actions** is selected as the Pages source in repository Settings → Pages. Its expected Pages URL is `https://vratmit.github.io/bus-vis/`.

Reference photographs and video files remain local and are excluded from Git. Geometry is authored in `src/bus.js` and `src/sculpt.js`; physical materials and reflection lighting are in `src/materials.js`. No model downloads or external 3D services are needed at runtime.
