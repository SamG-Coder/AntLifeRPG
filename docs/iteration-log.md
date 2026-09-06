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

## Physical colony work and asset refinement

Replaced NPC display-only loads with shared persistent item ownership. Excavators remove terrain and deliver the resulting clumps; foragers collect actual surface seeds and increase colony food. Tests now verify NPC conservation, exclusive load ownership, retained introductory gathering seeds, and two-bone IK segment lengths. Eating consumes colony food. NPCs now separate locally, though navigation and collision still require more robust treatment.

The actual browser session showed excavation removals increasing from one player removal to seventeen while the player travelled to the surface, with item count increasing from ten to twenty-six. This confirms that off-camera workers altered the shared world. The player's previous deposited clump and cavity survived a page reload. First-person antennae were rendered and inspected; their thickness was reduced after the initial view looked like oversized tusks.

The refined Blender mesosoma caused a real asset-import failure because its vertex attributes differed from the other meshes. Fixed the geometry batching to normalize attributes, added a shipped-asset validation test, and verified the model renders again. This illustrates why build success alone is insufficient.

Public commit 25dbd6a passed GitHub Actions, deployed successfully, and was opened in the browser with WebGPU rendering and no warnings/errors. Later physical-worker and model changes require their own deployment check.

### Next critical work

- Surface rendering still looks overly procedural: repeated blade shapes, crude moss, smooth stones and weak lighting. The surface browser visit displayed about 49 FPS during ongoing worker excavation; profiling must separate remeshing spikes from steady rendering cost.
- Actual scene-prop collision and climbing are not yet implemented. Heightfield body alignment and grounded feet are only a foundation, not a complete adhesion system.
- Social interactions need visible antennation, food sharing, richer memories, and schedule-driven encounters.
- No leisure activity or physical home furnishing loop yet.
- Initial ant appearance remains below the reference bar despite improved thorax topology and cuticle roughness.
- Per-frame draw-call telemetry was corrected after discovering that the original field was a cumulative render-call counter. See benchmarks.md.

## Gathering and delivery verification

The browser playtest followed the surface seed scent, lifted a fallen seed, carried it through the tunnel to the communal store, delivered it, and ate. The HUD showed one delivered soil clump and one gathered seed, with nourishment rising from approximately 68 to 93 after the meal. Player seed deliveries now feed the same colony reserve used by NPC deliveries and meals.

Added a local-development gameplay capture button. It saves pixels from the actual rendered game canvas to `docs/screenshots`; it does not synthesize or retouch images. The development server accepts these captures only from local browser origins, and the production game does not contain this capture endpoint or button.

Saved and visually inspected `worker-home.png` and `worker-entrance.png`. These are direct canvas captures without the HTML HUD. A turning inspection exposed mixed Euler/quaternion updates that could produce an incorrect body pose; removed the conflicting Euler assignment. Rebuilt curled tube mandibles as serrated wedge meshes. Distributed NPC destination points and widened local separation to reduce pileups; crowd navigation still needs work.

## Contact shading and exhausted-crew traffic

Batched all runtime ant limb segments into one scene-level instanced mesh; the isolated comparison reduced submissions by 45.9% without changing triangle count. Added GTAO, depth-based denoising, FXAA, and persisted contact-shading settings. Corrected a real multisampled-depth shader compilation failure before accepting the new pipeline. Added surface sunrise/noon/sunset/night lighting, embedded brown soil granules, bark striations, smaller Blender eyes and wider runtime leg contacts. Initial foot positions now respect saved heading, turning advances gait, and completed swing phases explicitly land on their contact targets.

The nursery browser visit exposed a crowd of idle workers at the exhausted face. Added distributed off-duty resting positions at the store and automatic return when work becomes available. A regression test initially failed: crowds could not reach a shared junction's exact point against separation forces. Treating intermediate junctions as two-unit areas resolved the deadlock. The test now verifies all exhausted workers clear the nursery and newly loosened soil is subsequently collected and delivered once. This is still basic crowd navigation, not full body collision or schedules.

The entry button is now disabled while assets and graphics initialize, preventing clicks before its handler is ready. Remaining visible problems include smooth cave shapes, simplistic antennae, angular leg joints, close-up NPC overlap and limited terrain structure. Climbing, richer social animation, home furnishings and full schedules remain outstanding.

## Worker rhythms, meals and visible colony lives

Added deliberately stylised daily rhythms: surface foragers pause at night, while underground crews have staggered rest windows within each role. Fatigue uses a recovery threshold so workers do not repeatedly switch jobs around one energy value. Workers finish owned deliveries before leaving, release uncut cells, physically return to distributed store positions, and consume one shared food portion when hungry. Hunger, meal counts and recovery state persist in the existing saved NPC records; older saves receive needs defaults without losing identity.

An empty reserve must not trap hungry foragers at the store. On-duty foragers can continue gathering when food is empty, then eat from their delivered reserve. Tests cover this recovery, exact meal accounting after physical travel, staggered shifts, and owned-load delivery across nightfall. All 17 tests pass. These are game schedules, not a validated species-specific ant sleep model.

Added H → Colony lives with all 24 names, roles, current activities, energy, nourishment and shared food reserve. Inspected the expanded panel in the real browser using the existing saved midnight colony: surface foragers rested, some underground workers were between shifts, and others remained available. The panel remained readable and scrollable, with no captured warnings/errors. Resting does not yet have a dedicated curled-body or antennal animation; meals are a simulated store interaction, not visible trophallaxis.
