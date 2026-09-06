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

## Visible greetings and articulated antennae

Greetings now pause a worker for 2.8 seconds, turn it toward the player and resume the preserved job/path afterward. Carried item ownership remains intact. Moving away cancels the encounter, and repeated greetings still cannot farm daily trust. Separated authored antenna meshes into left/right pivot groups during runtime material batching; added gentle baseline sweeps and a more active greeting sweep without rebuilding the Blender asset. This is simple expressive motion, not contact-solved antennation.

The real store playtest exposed that E always selected eating before greeting. Added G as a dedicated nearby-worker greeting key and documented it in controls. G successfully greeted Sorrel in the saved colony; the roster displayed 'Exchanging scents with you', and the existing shared-work memory plus the new greeting made Sorrel a Familiar worker. Repeating G did not add another daily memory. No captured browser warnings/errors. Tests verify proximity, pause/resume of an owned delivery, conservation and daily trust; all 19 pass.

The store is visibly overcrowded when all idle ants gather there. The next spatial improvement should provide separate resting alcoves and enough room for the actual body/leg span. The present centre-distance separation does not prevent appendage overlap. The social animation is a foundation, not a finished reciprocal encounter system.

## Separate resting chambers

Added fern and moss sleeping chambers west and east of the store, physically carved into the shared cave density and connected by navigable tunnels. Twenty-four stable worker slots are spaced 2.7 units apart, with individual leaf pads and softer chamber lighting. Workers go to the store for meals and then return to their own resting chamber. Existing off-duty saves are redirected from the old store destination without replacing worker identities, cargo or memories.

Route tests sample every site-to-chamber path through the cave clearance field, and verify slot spacing and wall clearance. The saved-idle-crew regression initially revealed that passing traffic could push settled workers away permanently. Workers now return to displaced resting spots. All 21 tests pass, including meals and owned deliveries across nightfall.

Actual browser travel reached the fern sleeping chamber from the existing store save, showing twelve spaced workers and accessible greetings. The camera remained inside the cave and no captured warnings/errors appeared. This reduces store overcrowding; it does not implement full body/appendage collision, a sleeping pose, organic nest architecture or species-accurate housing. The room layout is still visibly regular and the broad ceiling needs visual refinement.
The return browser trip verified that the communal store was clear of idle crews while the saved food supply and player deliveries remained intact. Saved an unretouched canvas capture in docs/screenshots/store-after-resting-chambers.png.

## Save generations and non-destructive recovery

Inspection found that load errors and invalid saves silently created a new colony, allowing the next autosave to overwrite old progress. Loading now uses the valid current generation, falls back to a valid backup with a visible recovery notice, or fails with existing records untouched. A genuinely empty database still creates a new colony. Autosave validates a cloned snapshot and atomically rotates only a valid current generation into backup; a corrupt primary cannot overwrite the backup. Database handles close on success and failure, and aborted transactions reject instead of hanging.

Expanded structural validation for worker identities, finite worker positions, memories, routes, item IDs and allocation counters. This is not a full semantic world repair system. Added five IndexedDB-level tests for generation independence, corrupt-primary recovery, unrecoverable-record preservation, invalid live-state rejection and transaction-abort rollback. The test-only implementation is fake-indexeddb (https://github.com/dumbmatter/fakeIndexedDB); it does not ship in the production bundle and is not a substitute for browser testing. All 26 tests pass.

The existing real-browser save loaded day two in the moss chamber with its prior player deliveries intact and no captured warnings/errors. HUD save failure reporting now remains honest after a rejected save. Missing both valid generations stops loading instead of resetting progress; a user-facing export/repair workflow and cross-tab ownership protection remain future work.

## Schedule-driven resting posture

Workers settled at a sleeping spot during sleep/fatigue breaks now blend into a lowered stance, with reduced body motion and slower, lower antenna sweeps. Movement, cargo and greetings suppress the resting blend. Posture height changes no longer count as walking distance, preventing spurious foot lifts while settling. Antenna oscillation accumulates phase rather than multiplying absolute time by a changing speed, avoiding rapid phase jumps through wake/rest transitions.

The browser playtest walked home, used the player rest interaction to advance two hours, and returned to the moss chamber. At about 09:00 the roster showed four underground workers between shifts; rendered telemetry independently showed four workers above 80% resting blend. Visually inspected feet and lowered workers beside alert workers, with no captured warnings/errors. Saved the actual canvas frame as resting-posture.png. This is a modest lowered pose, not a curled-leg sleep cycle, species-accurate sleep model or leaf-contact solver. A specifically sleeping worker's greeting transition still needs isolated close-up inspection.

All 26 existing tests and lint pass. Production build succeeds. No implementation-mirroring unit test was added for the small visual blend; browser inspection provides the relevant evidence.

## General surface contacts and camera integration

Started the contact foundation needed for climbing: bounded projection onto implicit surfaces, normals pointing into free space, and heading transport through changing normals. Tests cover floors, walls, ceilings, a nonlinear sphere density, unreachable/flat fields, and a continuous floor-to-ceiling normal turn. This is not yet connected to ant movement; it must not be advertised as playable climbing.

Both camera modes now use the shared contact field for floor/cave clearance. Segment sampling catches intervening walls even when both endpoints are free, and collision is checked again after smoothing. This replaces the third-person-only horizontal clipping loop and extends clearance checks to first person. Samples are at most 0.08 units apart; thinner features need a smaller step, and the field threshold is not an exact world-space sphere clearance for arbitrary densities. Props and NPC bodies are not yet in this field.

The real-browser chamber inspection exercised orbiting toward the ceiling and switching to first person. Both rendered without captured warnings/errors. Close NPC geometry still intrudes in first person, confirming the separate body-contact gap. All 30 tests pass. Next climbing work must connect contact normals to a surface motor, body orientation, per-foot contacts, save state and camera orientation before calling the feature usable.

## First playable nest grip traversal

Connected the surface motor to the player, body frame, six foot targets, camera up direction and saved attachment state. C engages grip from the ground; W/S advance or reverse, A/D turn on the surface, and V toggles steady forward travel. C releases only when back on a sufficiently level ground contact. Other interactions and scent guidance currently require releasing grip first. This is an initial nest-soil climbing mode, not universal prop climbing or NPC climbing.

A continuous motor test circles a sphere through vertical/inverted contacts and another travels from the actual home floor onto its wall and ceiling. Added frame serialization checks and body-clearance obstruction coverage. The movement field rounds floor/wall transitions and omits small cave noise; feet and camera query detailed solids. Initial clipping at the excavation exposed the need to include its live remeshing density and approximate body samples. The resulting body samples reject deeper penetration, including in-place turns, while allowing escape from an already intersecting saved position. These samples are not a complete swept ant mesh collision system.

The real browser traversed from the home floor to an inverted surface toward the store. An inverted attachment survived reload and both camera modes remained aligned. C correctly refused release above the floor. Saved an actual canvas capture in inverted-grip.png. After refining clearance, a separate production-build origin repeated the home climb; telemetry recorded y=2.76 and normal.y=-0.87 with the ground visibly overhead and no graphics errors. All 34 tests pass, along with lint/build.

Remaining climbing gaps: roots/rocks/foliage and NPCs are not part of the contact field; grip interactions and dropping/falling are limited; feet may still snap or stretch at tight transitions; excavation collision needs more close-up auditing; NPCs still use ground routes. The rendered cave and rounded movement field differ near concave floor/wall joins. These limitations do not reduce the full requested climbing scope.

## Follow camera clearance around nest corners

The follow camera now searches alternate angles around the ant's contact normal when its requested view is squeezed to less than 3.5 units (bounded by the chosen zoom). It also tries a lower orbit in cramped tunnels. A switching margin discourages flicker between similar openings, and the final smoothed camera remains subject to the existing solid-field segment check. Manual yaw and first-person controls remain separate from this automatic follow offset.

Three tests verify preservation of an unobstructed orbit, collision-free alternate views for upright/inverted contacts with stable selection, and a lower orbit in a 2.2-unit tunnel. All 37 tests, lint and production build pass. Production-preview playtesting restored the saved inverted store contact and exercised manual orbit into a blocked corner: DOM telemetry showed a 60-degree automatic offset, a wider chamber view and approximately 60 FPS in this observed session, without captured warnings/errors.

This improves available viewing space; it does not guarantee visibility of the entire ant. In the corner inspection, the soil lip still occluded part of the head. First-person close-wall views and climbing body clearance remain separate work. The field excludes decorative props, and broad performance/continuous camera-transition validation remains outstanding.

## Full-length climbing body clearance

Replaced the short nine-point spine check with 44 samples around Blender-sized head, mesosoma, gaster and mandible extents. The previous check stopped at 0.75 units fore/aft, missing the mandibles at 1.16 and gaster rear at 1.46. Forward and reverse obstacle tests now check the resulting posed body against solids.

Climbing stance can raise the root up to 0.48 units and pitch the body up to 0.45 radians relative to the contact frame. The movement field begins rounding the floor/wall join earlier so the full abdomen can negotiate the transition. Soil contact position remains separate from body pose; feet project onto detailed solids and the camera follows the raised root. Pose values serialize with backward-compatible defaults and bounds validation. This remains sampled clearance, not swept mesh collision; the rounded movement surface differs from the visible soil.

All 38 tests pass, including the actual home floor-to-wall-to-ceiling path with a body-penetration assertion at every step, sphere travel, mandible/abdomen obstacle checks and pose serialization. Lint and production build pass. In the production-preview browser, an older saved ceiling attachment fitted a 0.336-unit lift, then steady movement carried it beyond its former corner to a descending store-wall contact at y=1.35, lift=0.471 and pitch=-0.45. Visual inspection showed body clearance and no captured browser errors, at approximately 60 FPS in that observed session.

The extended stance exposed stretched-looking legs. Reach-constrained foot support, pose-transition collision, flexible antenna contact, cargo bounds and prop contact remain unfinished. The new body samples do not prove clearance of unsampled mesh details or all six planted feet.

## Reach-constrained legs and replacement footholds

The rendered femur and tibia now retain their 0.66-unit lengths even when a requested ankle is unreachable or coincident with its hip. Degenerate bend directions get a perpendicular fallback. Before clamping an unreachable leg, the ant searches for a closer soil contact by alternating projection onto the surface and its reach sphere from several seeds. This applies to ground workers as well as the attached player. If no contact is found, a finite unsupported endpoint is rendered; it does not pretend that an overextended foot is planted.

All 41 tests pass, including fixed bone lengths for overextended/collapsed targets, parallel bend directions, replacement contacts on floors/walls/ceilings and an explicitly unreachable floor. Lint and production build pass. Production-preview inspection restored the extreme store-wall stance (lift 0.471, pitch -0.45). Runtime measurements showed no clamped unreachable ankles in that sampled stance and maximum segment-length error of 1.1e-15; the browser showed approximately 60 FPS and no captured warnings/errors.

Fixed lengths do not prove a physically supported stance. Contact search can relocate a foot abruptly, independent leg searches may produce awkward crossings, and body movement does not yet require a valid support set. The inspected front-leg arrangement is still awkward near the head. Whole-gait transition checks and support-aware body motion remain necessary.

## Recovery steps and leg-side contact bounds

Unreachable-foot replacement now follows a 0.18-second lifted recovery step instead of copying the foot instantly. Contacts must remain at least 0.1 units outward of the hip along the leg's own side direction. The older large-drift teleport uses the same recovery path. Tiny replacement changes are ignored. Fixed segment lengths remain enforced throughout recovery.

Initial browser inspection exposed an idle recovery loop: repeatedly projecting a planted foot could send it to another patch of soil. Idle projection now runs only when the foot is clearly away from the surface. After reload and settling at the saved extreme wall stance, telemetry showed zero active recoveries and segment-length error around 1e-15. One foot remained unreachable under the new side constraint; its limb stayed finite. That is an exposed support gap, not a supported six-foot pose. No warnings/errors were captured in the initial browser pass.

All 43 tests, lint and production build pass. New tests cover outward-side contact selection and a wall-relative lifted recovery trajectory with exact endpoints. Multi-leg recovery scheduling, collision along swing arcs, foot-to-foot separation and body motion constrained by actual support are still outstanding; this does not claim a complete coordinated gait.

## Climbing foothold feasibility and recovery scheduling

Each proposed climbing translation now searches six body-pose-relative footholds against the detailed solid field. Movement requires at least three reachable contacts distributed over both sides; a turn is also rejected if its candidate pose lacks that distribution. This prevents the body-clearance check alone from admitting a one-sided ledge pose. It is a geometric feasibility condition, not measured planted support, a support polygon, adhesion force or torque simulation.

Recovery steps are limited to one active step at a time per ant. During walking they may begin only in the currently swinging group; idle ants recover one foot at a time. A recovery may still span a gait phase boundary, so this does not guarantee three physically planted feet throughout every transition.

All 46 tests, lint and production build pass. New tests cover six footholds on floor/ceiling poses, rejection of a body-clear one-sided ledge, and recovery scheduling. The original sphere and actual nest floor-to-ceiling traversal tests still pass. A fresh production-preview colony was played from the home floor through attached traversal onto the ceiling: telemetry recorded y=3.78, normal.y=-0.97, one recovery and zero unreachable ankles. After pausing, recovery settled to zero, segment error remained around 3.3e-16, and no browser warnings/errors were captured. The observed session ran near 60 FPS; broad performance remains unverified.

Remaining support work includes coupling body movement to actual stance feet, distinct/non-collinear contacts, contact forces, slip/fall behavior, recovery completion relative to gait phase, and swing collision.

## Climbing movement gated by stance feet

Connected player climbing movement to the current animated stance feet. Candidate translation/turn poses must retain at least three reachable, near-surface, non-swinging/non-recovering feet across both sides. The existing potential-foothold check remains separate. When the body waits for support, movement intent advances the gait at a minimum rate so feet can complete steps and regain contact. This is a kinematic support gate, not contact-force or adhesion simulation; gait transitions can temporarily reduce support after a body step, causing subsequent movement to wait.

Initial browser testing revealed that raw density thresholds misclassified ceiling contacts because the implicit field is not a distance field. Stance detection now projects each eligible foot onto nearby soil and checks geometric separation. A regression assertion scales floor density by 100 while preserving contact classification. Tests also show movement stopping with airborne/recovering feet and resuming when they plant. All 47 tests, lint and build pass.

Production-preview playtesting resumed the saved home-ceiling attachment and traversed toward the store. After contact correction, telemetry progressed from (1.26,3.82,-0.13) to (-3.38,1.83,-9.38). A moving sample had two current stance contacts (subsequent movement waits); after pausing the store pose settled to six planted feet, zero recovery/unreachable counts and segment error around 1.1e-15. No browser warnings/errors were captured. Store props briefly filled the camera view, reproducing the outstanding decorative-prop collision gap.

This does not verify a stable support polygon, non-collinear or distinct contacts, friction/adhesion, fall behavior, full swing collision or support-aware NPC body motion. Minimum-rate stepping while waiting can still look like stepping in place. Prop-aware camera collision remains necessary.

## Camera collision with prominent static props

Added camera-only collision envelopes for the 45 stored decorative seeds, 34 surface rocks, water drop and three large roots. Ellipsoid envelopes preserve mesh translation, rotation and non-uniform scale; roots use capsule chains following the same sampled curve as their tube geometry. Local bounds skip distant envelope calculations. Both camera modes and alternate follow-orbit selection use the combined soil/excavation/prop field.

All 49 tests, lint and production build pass. New tests cover a rotated/stretched seed envelope, stopping before a root, and escape from a non-central enclosed root target. Production-preview inspection restored the exact store attachment where the previous camera had shown a seed filling the screen. The new follow view showed the ant and chamber; first-person switching also rendered without captured warnings/errors. Observed performance remained around 60 FPS in this session.

These are approximate static camera envelopes, not mesh-exact collision or ant locomotion surfaces. Small hanging rootlets, leaves/moss, movable items/cargo and NPC bodies remain outside the camera field. Rock envelopes can leave extra clearance. Deeply enclosed anchors and overlapping envelopes still require broader testing; the existing projection can fail at flat gradients. No general performance claim is made from this one browser session.

## First grooming/self-care activity

Added an eight-second antenna grooming break for the player (L, on the ground with empty mandibles) and idle workers. Cleanliness is persistent, decreases through dusty excavation/carrying work and recovers gradually while grooming. Completed bouts are counted once; progress survives serialization. Player movement/interactions cancel the activity. Workers groom at their resting place when work is unavailable, and urgent needs, greetings and renewed jobs take priority. Field notes expose player cleanliness and completed breaks; the roster labels active grooming.

The rendered ant blends its front feet toward the head and sweeps the antennae during grooming. This is an initial stylised animation, not anatomically exact cleaning contact. The activity currently affects cleanliness only; cleanliness does not yet alter sensory ability, disease or social outcomes. Mutual grooming, player companionship and richer leisure remain outstanding.

All 52 tests pass, with coverage for gradual cleaning, serialization, single completion, invalid save bounds, carrying/attachment exclusions, autonomous idle-worker grooming and urgent hunger interruption. Lint and production build pass. In a fresh production-preview browser, the player's first bout progressed from cleanliness 78 to 100 with a visible front-leg/antenna animation and one completion. Starting a second bout then pressing W left completion count at one and remaining time at zero. Browser telemetry also caught one worker actively grooming. No warnings/errors were captured; the observed session ran around 60 FPS. NPC grooming was verified through simulation tests and runtime activity count, not a separate close-up animation capture.
