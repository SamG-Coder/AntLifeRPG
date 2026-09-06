# Development and critical inspection

## 2026-09-06: first playable foundation

- Created repository, pinned Three.js 0.185.1 and Vite 8.2.2, set up lint/tests/build/Pages deployment.
- Exported editable Blender worker asset with mesosoma, petiole, gaster, eyes/facets, antennae, mandibles and setae; six runtime legs use alternating contact phases.
- Connected home, communal store, excavation, spoil bed and surface with traversable paths.
- Added 24 persistent identities, elementary routes and cargo display, daily memories, needs, IndexedDB saves, gathering and physical digging/carrying/deposition.
- Actual browser playtest reached the excavation, loosened a clump, picked it up, carried it to spoil and deposited it. Delivery count changed from zero to one.

### Findings and changes

The initial wall rows looked like stacked toy stones. Replaced them with a continuous implicit cave surface and TSL triplanar soil. This exposed a camera clipping bug; camera clearance now samples the same cave density. The excavation block rows had the same visual problem; replaced their visible meshes with a bounded remeshed face and saved spherical removal cavities. Leaf surfaces gained veins and fine variation. Shader hot reload caused invalid transient WebGPU pipelines; development uses explicit page reloads.

### Measurements

Initial observed browser viewport: 1280 x 720, WebGPU active, displayed roughly 58–60 FPS. These were short observations in the local Codex browser, not a repeatable benchmark or verified 60 FPS claim. Frame-rate accounting was corrected to use uncapped wall time; simulation time is separately bounded. GPU model has not been recorded. No broad performance claim is justified yet.

### Remaining shortcomings

This is an early playable prototype, not the polished requested vertical slice. The ant's cuticle looks too lacquered, legs need stronger biological posing and contact inspection, roots lack surface structure, lighting is too uniform, and camera views still need full-route auditing. NPCs have persistent identity but currently shallow schedules and cargo behaviour: they do not yet execute the same physical jobs as the player. There is no full structural soil simulation, no verified climbing, no cooperative carrying, no leisure activity, no home decoration interaction, and no mature relationship simulation. First-person sensory appendages need visual validation. Large-scale streaming, LOD, quality presets, and reproducible benchmarks remain outstanding.

Continue by closing these gaps through actual render and gameplay inspection. Do not treat passing tests or this feature list as completion.
