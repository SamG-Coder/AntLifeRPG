# Performance evidence

The initial local browser viewport was 1280×720, using WebGPU. An uncapped-wall-time sample on 2026-09-06 reported 59.99 FPS at the spoil bed and 2,855,269 triangles (including renderer passes). This is a single local observation, not a benchmark distribution. The precise GPU and driver were not collected. Do not generalize it to arbitrary desktop GPUs.

An earlier telemetry field incorrectly labelled cumulative `renderer.info.render.calls` as per-frame draw calls. That value (6,029) was not a valid draw-call measurement and has been discarded. Telemetry now reads `renderer.info.render.drawCalls`, verified against the installed Three.js Info source.

A corrected 1280×720 home-entrance sample reported 59.999 FPS, 1,955 actual per-frame draw calls and 3,283,349 rendered triangles with 42 terrain removals and 51 persistent items. At that point the colony had delivered 41 soil clumps and six seeds in addition to the player's delivery. Draw-call count remains an obvious batching opportunity; the sample is still not a frame-time distribution.

## Reproducible manual procedure

1. Build the exact commit with `npm ci && npm run build` and serve `dist` over HTTP.
2. Record GPU, driver, browser version, renderer backend, viewport, device pixel ratio and saved-world state.
3. Enter the colony and use H to follow the scent to the nursery. Complete a dig/carry/deposit cycle, then visit the surface and return home.
4. Record uncapped frame durations for at least 60 seconds after shader warmup, including excavation remesh frames. Report median, p95, p99 and maximum; distinguish simulation, CPU rendering and GPU time where available.
5. Test at 1280×720, 1920×1080 and a high-DPI desktop size; repeat on WebGL 2 fallback and at least one integrated GPU.

Current HUD FPS uses actual wall time. Simulation delta is separately limited to 50 ms to avoid physics explosions after tab suspension. Terrain remeshing still runs on the main thread. The `#status` element exposes development measurements in `data-metrics`. A proper recording/export harness and scalable settings remain to be implemented.

## Compatibility smoke check

The local browser was explicitly started with `?backend=webgl`. It rendered the saved communal-store scene, reported WebGL 2, and produced no captured warnings or errors. After shader startup, the visible two-second HUD sample reported 60 FPS. This verifies one fallback scene on this machine, not equal performance or feature parity across devices.

## Limb batching comparison and contact shading

An isolated limb-batching change reduced the same home-entrance scene from 1,955 to 1,057 draw submissions (45.9% fewer), with unchanged 3,283,349 rendered triangles. Both short HUD observations were approximately 60 FPS. This is evidence of reduced submissions, not evidence of a frame-rate improvement.

Subsequent contact shading, additional soil granules and daylight changes alter the pass count and scene workload, so later measurements are not directly comparable to that isolated test. A later nursery sample at high contact shading reported 491 submissions and 4,128,769 triangles at approximately 60 FPS. View-dependent culling matters. The WebGL2 home startup scene also rendered at approximately 60 FPS after warmup, with no captured warnings/errors. These remain single-machine smoke checks.

The field-notes contact-shading control offers Off, Balanced (half-resolution AO) and High (full-resolution AO), persisted with the colony. It is not yet a complete geometry/shadow quality preset or a benchmark harness.
