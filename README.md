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

Upload transparent PNG/WebP images, JPGs, or SVGs (up to 20 MB each). Images are rasterized locally with their transparency intact and resized only if their longest edge exceeds 2400 pixels. Nothing is uploaded to a server. Drag an asset from the shelf onto one of the 23 exterior-facing panel outlines, or click the asset to center it. Artwork now lives in one shared, metre-based layer stack. The canvas shows connected panels at their actual relative positions, including entry/lift-door leaves, cab doors, fenders, window surrounds and skirts. One image can cross panel seams; each panel samples its portion of the same image transform and processed effect. Window, wheel, door and equipment openings remain excluded.

Drag artwork to move it, grab a corner to scale it proportionally, and drag the round handle to rotate. Hold Shift to constrain movement or snap rotation. The Inspector also provides millimetre positions, width, scale, rotation, opacity, flip, center, and reset controls. The live, orbitable 3D bus shows artwork projected onto the actual painted surfaces, including the hood and fenders. Panel guides remain on the connected 2D canvas; the 3D bus preview shows the painted body and applied artwork without a wireframe overlay. Selecting a panel chooses its camera view and individual export without isolating it from its neighbors.

Ctrl/Cmd C and V copy and paste artwork, including between panels; Ctrl/Cmd D duplicates. Ctrl/Cmd Z undoes; Shift Ctrl/Cmd Z or Ctrl Y redoes. Arrow keys nudge by 1 mm, or 10 mm with Shift. Delete removes the selected layer. Layers can be hidden or reordered. Use Canvas, Split view, or 3D bus to adjust the workspace. The connected-canvas selector offers complete driver/entry elevations, rear, front, roof/cap, hood, cab roof, or the whole unfolded exterior. The body belt unfolds driver → rear → entry → front, with periodic artwork across its closing cut. The hood and cab roof occupy separate islands because their top-down projections overlap the overhang at different heights. Roof/cap and fender shapes retain the model’s approximate projected geometry; this is not a measured surface-development or cutting template.

**Retro print** follows the supplied recipe and the tutorial comment correcting the fourth filter to **Reticulation**, not Craquelure:

1. Grain adjustment on the source: Amount 100, Size 25, Roughness 50.
2. Separate solid-color fill #808080, treated as an editable Smart Object source.
3. Halftone Pattern: Dot, Size 2, Contrast 12, foreground black/background white.
4. Reticulation below Halftone in the gallery: Density 35, Foreground Level 15, Background Level 3. The gallery renders bottom-up, so reticulation is applied to the gray fill before the halftone screen.
5. Composite the filtered fill over the grain-adjusted source with **Lighter Color**, layer opacity 60%. This compares the whole RGB channel sum and selects an entire color before applying opacity; it does not use independent per-channel Lighten maxima.
6. Threshold the composite at 161.
7. Resolve the fine print samples and apply a full two-stop gradient map, including intermediate tones. The default reference preset maps to navy #27247d with transparent highlights. Opaque highlight mode maps to white or any chosen highlight color. A separate subject mask removes the outside background.

The print is sampled up to a 2400-pixel long edge (at most 4× the input size), then area-resolved back to the uploaded asset dimensions before panel crops and GPU texture resampling. This reproduces the reference's fine emulsion grain instead of coarse binary speckles. Its photographic grain-density response is calibrated from flat interior tone regions of the supplied silver/blue screw reference; it uses deterministic film-grain and emulsion-clumping kernels. The reference head measures ~36.1% ink coverage with ~0.188 grain standard deviation; the revised output measures ~36.0% and ~0.190. This is a tone/texture calibration, not a per-pixel copy of the target. Adobe does not publish its proprietary filter kernels; this is a visual equivalent using the specified stack and settings, not a claim of pixel-identical Photoshop output. Implementation semantics were checked against Adobe's [blend-mode reference](https://helpx.adobe.com/lt/photoshop/desktop/repair-retouch/adjust-light-tone/blending-mode-descriptions.html), [filter reference](https://helpx.adobe.com/photoshop/desktop/effects-filters/blur-sharpen-filters/filter-effects-reference.html), and [grain controls](https://helpx.adobe.com/camera-raw/using/vignette-grain-effects-camera-raw.html), and [gradient-map semantics](https://helpx.adobe.com/photoshop/desktop/adjust-color/color-effects-techniques/apply-special-color-effects-to-images.html).

**Monochrome** and **Gradient map** switch the final color treatment. The map has editable shadow/ink and highlight stops, a live gradient swatch, and an independent highlight-knockout control. Default transparent highlights match the supplied navy-on-pink example once composited over a background; choose **Opaque highlight color** for color-and-white or another two-color print. **Remove flat background** uses existing transparency or an edge-connected dominant flat-color background. It preserves subject geometry and soft alpha edges; chroma-aware keying distinguishes a pink background from similarly bright neutral silver. It is not semantic segmentation of complex photographic backgrounds. Disable it to keep the full source rectangle. Original uploaded assets remain unchanged.

**View filter steps** displays actual grain, gray fill, halftone-only, reticulation, combined gallery, lighter-color composite, threshold, and masked/colorized results for the selected image. Recipe settings expose grain size/roughness, dot size/contrast, reticulation controls and background tolerance, while **Reset to screw reference** restores the calibrated preset.

Projects autosave to IndexedDB on the current browser/device. **Save project** downloads a JSON backup containing the images and editable layers; **Open project** restores it on another browser. **Export connected canvas** downloads all visible connected-panel artwork as one transparent PNG. **Export active panel PNG** downloads the corresponding individual crop at 300 pixels/metre; **Snapshot** downloads the current bus view. Panel dimensions remain approximate model measurements.

Run `npm run test:design` for the end-to-end access, upload, drag/drop, transform handles, effect pixels, copy/paste, undo/redo, 3D texture geometry, export, persistence, and mobile checks. `CHROMIUM_PATH` and `LD_LIBRARY_PATH` can point at an installed Chromium and its runtime libraries. `BUS_URL` can point at the deployed base URL.

Project format v2 stores shared artwork once, rather than making independent copies per panel. Existing v1 projects migrate automatically with their positions and original panel masks preserved. Select an old layer and uncheck **Clip to one panel** to let it span neighboring panels. New artwork spans panels by default. The Inspector reports how many panels a layer covers.

`src/wrap-layout.js` defines the common coordinates and panel-to-canvas transforms. `check-wrap.mjs` checks physical seam alignment, unchanged scale/orientation, door-leaf alignment, shared transforms, the periodic closing cut, and v1 migration. The browser check also samples real rendered textures on both sides of a coach/skirt seam and verifies that a single layer drives both.

The pure pixel checks in `check-retro.mjs` verify filter order, true RGB Lighter Color at 60%, threshold ordering, white-detail preservation, background/alpha masking, both color palettes, the dot period, grain controls and deterministic output.

### Reference comparison

Run `node scripts/compare-retro.mjs /absolute/path/to/the-supplied-before-after.png --check` to extract the silver screw, register the blue target, run the real filter, compare tonal-density/grain statistics and pink-background removal, and produce a four-column proof plus transparent source/result PNGs in `/tmp/retro-calibration/`. The comparator uses release `f169bb0` as its historical baseline. It tests overall tonal-density RMSE below 0.03, head ink coverage within 0.02, grain contrast within 0.025, silhouette IoU above 0.97, and zero surviving outside pixels. The comparison pink is a preview backdrop only; generated PNGs have alpha. `scripts/fit-retro-response.mjs` documents the one-dimensional density-curve fit. Original attachments are not published.
