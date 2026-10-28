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

## Panel Studio

Open **DESIGN STUDIO** or `/bus-vis/design.html` to enter the separate design workspace. The workspace password is `alohomora`; the lock button closes it and requires the password again. This is a browser-side password gate on a static GitHub Pages site, not server authentication. Do not use it to protect confidential content.

Upload transparent PNG/WebP images, JPGs, or SVGs (up to 20 MB each). Images are rasterized locally with their transparency intact and resized only if their longest edge exceeds 2400 pixels. Nothing is uploaded to a server. Drag an asset from the shelf onto one of the 23 exterior-facing panel outlines, or click the asset to center it. Each panel has its own layer stack and excludes its window, wheel, door, and equipment openings.

Drag artwork to move it, grab a corner to scale it proportionally, and drag the round handle to rotate. Hold Shift to constrain movement or snap rotation. The Inspector also provides millimetre positions, width, scale, rotation, opacity, flip, center, and reset controls. The live, orbitable 3D bus shows artwork projected onto the actual painted surfaces, including the hood and fenders. The active panel is outlined on the bus.

Ctrl/Cmd C and V copy and paste artwork, including between panels; Ctrl/Cmd D duplicates. Ctrl/Cmd Z undoes; Shift Ctrl/Cmd Z or Ctrl Y redoes. Arrow keys nudge by 1 mm, or 10 mm with Shift. Delete removes the selected layer. Layers can be hidden or reordered. Use Canvas, Split view, or 3D bus to adjust the workspace.

**Retro print** is a canvas interpretation of the supplied Photoshop tutorial: grain (100/25/50), gray fill, dot halftone (2/12), craquelure (35/15/3), Lighter Color at 60%, threshold 161, and an ink color map. A worker combines grain, a distorted dot screen, cracked-cell texture, lightening, and thresholding into a single transparent ink impression. Enable it per layer and choose any six-digit hex ink color. Coverage, grain, and print texture are adjustable; Reset restores the reference-inspired settings. Transparent source pixels stay transparent, and unprinted highlights are transparent so the bus paint shows through. The procedural result approximates the visual recipe rather than Photoshop's proprietary filters pixel for pixel.

Projects autosave to IndexedDB on the current browser/device. **Save project** downloads a JSON backup containing the images and editable layers; **Open project** restores it on another browser. **Export panel PNG** downloads transparent, clipped artwork at 300 pixels/metre; **Snapshot** downloads the current bus view. Panel dimensions remain approximate model measurements.

Run `npm run test:design` for the end-to-end access, upload, drag/drop, transform handles, effect pixels, copy/paste, undo/redo, 3D texture geometry, export, persistence, and mobile checks. `CHROMIUM_PATH` and `LD_LIBRARY_PATH` can point at an installed Chromium and its runtime libraries. `BUS_URL` can point at the deployed base URL.
