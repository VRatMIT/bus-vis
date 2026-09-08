# Teal / Bus Studio

An interactive Three.js exterior study of a painted 2016 Ford E-450 shuttle bus, modeled from the supplied photographs. Approximately 26 feet long and 10 feet tall; coach width is approximately 8 feet. Teal paint covers the cab, coach, roof, and roof equipment. Tires, glazing, lights, and chrome retain their respective materials.

Drag to orbit, scroll or pinch to zoom, and right-drag or use two fingers to pan. Presets cover the driver side, entry side, rear, and roof. Automatic orbit, camera reset, and dusk lighting are available. The passenger entry and rear details are interpretations where the reference photographs do not show them clearly; this is a visual model, not a fabrication drawing.

## Local

`npm ci` then `npm run dev` serves on port 5009, including the hostname `hmsharbor`. `npm run build` produces the static application in `dist`. Google Fonts are optional, with system font fallbacks.

## GitHub Pages

Create a public `whatthemehek/bus-vis` repository, push this project to `main`, then select **GitHub Actions** as the Pages source in repository Settings → Pages. The included workflow builds and deploys the site at `https://whatthemehek.github.io/bus-vis/` without a paid server.

Reference photographs and video files remain local and are excluded from Git. Geometry is authored in `src/bus.js`; no model downloads or external 3D services are needed at runtime.
