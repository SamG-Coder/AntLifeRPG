# Performance evidence

The initial local browser viewport was 1280×720, using WebGPU. An uncapped-wall-time sample on 2026-09-06 reported 59.99 FPS at the spoil bed and 2,855,269 triangles (including renderer passes). This is a single local observation, not a benchmark distribution. The precise GPU and driver were not collected. Do not generalize it to arbitrary desktop GPUs.

An earlier telemetry field incorrectly labelled cumulative `renderer.info.render.calls` as per-frame draw calls. That value (6,029) was not a valid draw-call measurement and has been discarded. Telemetry now reads `renderer.info.render.drawCalls`, verified against the installed Three.js Info source.

## Reproducible manual procedure

1. Build the exact commit with `npm ci && npm run build` and serve `dist` over HTTP.
2. Record GPU, driver, browser version, renderer backend, viewport, device pixel ratio and saved-world state.
3. Enter the colony and use H to follow the scent to the nursery. Complete a dig/carry/deposit cycle, then visit the surface and return home.
4. Record uncapped frame durations for at least 60 seconds after shader warmup, including excavation remesh frames. Report median, p95, p99 and maximum; distinguish simulation, CPU rendering and GPU time where available.
5. Test at 1280×720, 1920×1080 and a high-DPI desktop size; repeat on WebGL 2 fallback and at least one integrated GPU.

Current HUD FPS uses actual wall time. Simulation delta is separately limited to 50 ms to avoid physics explosions after tab suspension. Terrain remeshing still runs on the main thread. The `#status` element exposes development measurements in `data-metrics`. A proper recording/export harness and scalable settings remain to be implemented.
