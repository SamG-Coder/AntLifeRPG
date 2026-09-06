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

## Autonomous worker scent encounters

Nearby workers can now pause for a 2.4-second scent exchange and face each other using the antenna greeting animation. Up to two pairs may be active, with individual cooldowns and a once-per-pair-per-day familiarity increment. Completed encounters create symmetric persistent worker-to-worker records, separate from player trust. Colony lives lists familiar nestmates by name. Cargo and paths remain owned and preserved during the pause; hunger, sleep/fatigue schedules, separation or a player greeting cancel an unfinished encounter without recording familiarity.

All 55 tests pass, including cargo/route preservation, symmetric records, daily limits, next-day progression, serialization, urgent interruption, pair-count limits and invalid bond IDs. Lint/build pass. In the production-preview browser, workers continued excavation and delivery while five acquaintance pairs formed. The actual roster showed Tansy–Sorrel, Mica–Fern, Yarrow–Clover, Ash–Thistle and Fennel–Ember. Runtime telemetry reported five bonds and no warnings/errors at the inspected point, around 60 FPS. This verifies autonomous encounters through their persistent effects and live roster; a separate close-up capture of an active pair remains outstanding.

This is an initial social graph. Familiarity does not yet change partner choice, assistance, leisure or conflict. Encounters use proximity without a wall/line-of-contact test, do not approach a precise antenna-contact pose, and can briefly pause working carriers. More nuanced needs/role/context decisions and consequential relationships remain necessary.

Reload restored the earlier autosave with two completed bonds and one in-progress encounter; the five-bond live snapshot had not yet reached the periodic save. Serialization tests separately verify the complete symmetric records.

## Soil-aware encounters and familiar partner choice

Worker exchanges now check a sampled path at approximate head height against the game's detailed soil and excavation field, both before starting and while active. An obstruction cancels the exchange without awarding familiarity. The same check is wired into ordinary simulation and rest fast-forward. Eligible nearby partners are ranked by distance with a capped familiarity bonus; cooldowns, urgent needs, the 2.8-unit range and daily encounter limit still apply.

All 57 tests, lint and production build pass. Tests cover an intervening soil slab preventing and cancelling an encounter, familiar partner preference in a close choice, and distance/range/cooldown overriding even a long encounter history. Production preview restored the existing two acquaintance pairs and rendered the colony without captured warnings/errors. Soil obstruction and partner-choice outcomes are verified by tests rather than a staged browser encounter.

This is a sampled soil clearance check, not a precise antenna-contact pose or a biological scent propagation model. Decorative props and other ants do not obstruct the exchange path. Familiarity still has no assistance, shared leisure or conflict consequences.

After closing the journal, live simulation increased completed worker bonds from two to four while soil deliveries rose from 26 to 28. The store screenshot still shows the player overlapping decorative seeds, confirming the separate ground-prop locomotion collision gap.

## Store-seed foot contacts and ground body clearance

The static store seeds now provide analytic upper-surface contacts derived from their transformed sphere geometry. Player and worker feet use those heights; sampled body clearance raises their ground posture over the pile while retaining the underlying terrain orientation. The camera follows the actual rendered body height in both modes. Seed envelopes also join the grip contact and detailed solid fields, and grip engagement/release uses the local support height.

All 59 tests, lint and production build pass. New tests verify rotated/non-uniform ellipsoid contacts, sampled body clearance over a seed, and unchanged bare-floor posture. Production-preview playtesting restored the formerly overlapping store pose, walked home and returned onto the pile. Returned telemetry recorded ground body lift 0.5404, zero unreachable feet and segment error about 3.3e-16. First-person rendering was inspected. Grip engaged at seed height 0.5443 with normal.y 0.8852 and settled to six planted feet, no recovery and no unreachable feet; release was then requested. The inspected session ran near 60 FPS and captured no warnings/errors.

This is kinematic support over a static pile, not granular or rigid-body seed physics. Body samples do not prove full mesh clearance, and upper-surface placement is not swept limb collision or force-based support. Abrupt height changes can still produce abrupt body adjustments. Other props, movable cargo, foliage and NPC bodies remain outside this ground support field; broader seed-grip traversal and worker close-up animation verification remain outstanding.

## Reach-limited ground posture settling

Ground body height now eases downward toward the required clearance height, instead of taking every downward change immediately. Existing non-swinging/non-recovering ankles impose an upper height limit from leg reach, so easing does not add overextension. Clearance still takes priority when its required height exceeds that limit. Upward corrections remain immediate; releasing grip starts from the ground-required posture rather than carrying the attached contact origin into the settling history.

All 61 tests, lint and build pass. Tests verify monotonic settling to the floor, immediate upward clearance, stance-reach limiting, exclusion of airborne feet and frame-subdivision equivalence in an unconstrained interval. Production preview walked from the saved seed pose (ground lift 0.5315) to home, where lift returned to zero with no unreachable feet and segment error around 1.1e-16. The endpoint was visually inspected, near 60 FPS with no captured warnings/errors. The brief descent itself was not captured frame by frame; its temporal behavior is verified by the tests.

This remains kinematic posture adjustment. It does not supply gravity, force-based support, fall behavior or swept collision, and immediate rises or reach constraints can still produce abrupt corrections.

## Shared grooming beside familiar nestmates

Familiar workers who are idle, nearby, free of cargo and urgent needs can now take an eight-second grooming break together when either needs cleaning. Each uses the existing self-grooming animation, facing its partner, and gains cleanliness gradually. Completed breaks persist in the roster, limited to one per participant per day. A shared break may follow a recent scent exchange despite its ordinary social cooldown. Daily scent familiarity still increments at most once.

Work availability is shared between the social activity and off-duty scheduler. A renewed job, hunger/fatigue/schedule change, separation, obstruction or player greeting cancels the unfinished activity and clears grooming timers without completion credit. Partial cleaning remains. Saved activity kind, duration and shared completion fields are validated.

Tests cover two-worker cleaning/completion, serialized progress, daily limits, interruption and the actual colony scheduler returning adjacent-bed partners to work after a loose soil load appears. A fresh headless simulation over 900 simulated seconds produced five shared breaks without manually assigning bonds. Production preview reached the fern sleeping chamber and showed the existing acquaintance roster with no captured shared break; this older colony had already finished its excavation and self-grooming. Active pair animation and natural shared-break occurrence with browser terrain obstruction remain unverified. This is shared self-care rather than allogrooming, an approach-to-contact controller or consequential friendship beyond partner choice and a shared activity.

All 64 tests, lint and the production build pass. Browser inspection captured no warnings/errors and ran near 60 FPS at the inspected point.

## First undermined-soil collapse and falling loads

Nursery parcels now retain support from the layer below in their own or one adjacent column. Removing that neighbourhood can release a parcel every 0.35 simulation seconds, starting with the lowest unsupported layer. Each release removes the corresponding rendered excavation volume and creates exactly one persistent soil item. Released items accelerate downward at four world units per second squared and stop at ground level; player/NPC pickup waits for landing. Motion advances in bounded substeps, is rendered each frame while active, and survives save serialization with validated bounds.

All 68 tests, lint and build pass. New tests cover adjacent support, cascades, unique cell-to-item conservation, landing/pickup, invalid motion saves and frame subdivision. Idle/rest/grooming fixtures now clear all five layers rather than leaving three unsupported layers. A fresh 900-second headless simulation cleared all 105 cells and delivered exactly 105 soil loads, including 70 released by instability, with no remaining falling or owned loads.

Initial browser testing recorded three falling items and 24 releases from the older 42-cell excavation, but dropped to about 27 FPS. Excavation density was extracted and optimized with exact rejection bounds; it skips cavity distances that cannot lower the current value. A spatial grid test matches the original field within 1e-12. A local 100,000-point sample took 144 ms with the original evaluator and 16 ms with the bounded evaluator, with identical sums. This microbenchmark does not establish general game performance.

The fresh nursery visit also exposed heavy worker overlap and stalled excavation while the player stood amid the crew. Four manual scrapes worked, but crew approach/queue handling needs a focused movement fix. This collapse rule is an initial loose-soil approximation, not cohesive-earth mechanics. It excludes external ceiling/side anchoring, stresses, clump-clump collisions, settled-pile support, impacts on ants and dynamic rubble footholds. Higher walls still require genuine climbing workers rather than remote excavation.

With the optimized field, one saved excavation completed its 63 remaining releases and rendered around 60 FPS afterward. Another saved pose recorded three actively falling parcels, 29 releases and about 53 FPS with no warnings/errors. These are different poses from the original 27-FPS observation, so they are not a controlled frame-rate comparison. Close-up falling-parcel footage and broader collapse performance remain unverified.

## Nursery approach positions and excavation spacing

The nursery scent route previously sent every ground worker to the same final point used by the player. Ground crews now have sixteen distinct waiting positions within the walkable nursery area. Old saved paths targeting the common final point are repaired in place. Carriers return to their assigned waiting positions between loads. Excavators reserve columns at least three cells apart, allowing at most three separated active columns; other excavators wait for space rather than joining the same face position. Collapsed cell reservations are released.

The existing player-separation routine was extracted unchanged so the regression can exercise the same post-simulation separation used by gameplay. All 71 tests, lint and build pass. Tests verify separate walkable waiting positions, column spacing and recovery of a saved crew targeting the player's point. The latter removed 56 cells and delivered 44 loads over 300 simulated seconds with the player fixed near the face.

Production preview reopened the exact previously stalled save at (-14.03,-26.77), with four manual scrapes and zero crew soil deliveries. Without moving the player or scraping again, the crew advanced to ten removed cells and five deliveries. The inspected screenshot showed a less concentrated group and active loads, around 60 FPS. Body and leg overlaps still occur during passing and collection; this is destination allocation and work spacing, not full body collision, steering around obstacles, queue priority or universal deadlock prevention.

## Duties that follow colony progress

The duty panel now derives its instructions from real state: opening the nursery face, clearing loose soil, finishing a carried delivery, bringing available seeds home, or taking personal time. Hunger and fatigue can redirect an empty worker toward food or rest. A direct scent button reuses the existing physical route controls. Cleanup distinguishes falling parcels, collectable loads and loads already owned by the crew.

Nursery completion requires every one of its 105 cell identities to be removed and every soil item to be deposited. A persistent completion record stores day/time and separate player/crew delivery counts once; it does not award the player the crew's work. Field notes show this record and the current duty. Completion changes guidance, but does not yet add brood, furnishings, a new excavation area or a broader quest system.

All 74 tests, lint and build pass. Tests cover incomplete cleanup despite an open face, falling/owned loads, one-time saved completion, honest contribution counts, invalid milestone data, and duty priorities. Production preview showed cleanup with 63 loads remaining, changed to a delivery instruction after an actual pickup, routed to the spoil bed through the new button, then returned to cleanup after deposition. The count fell to 39 as the crew also worked. The HUD layout was visually inspected; no browser warnings/errors were captured. Completion/foraging transitions are tested in simulation; this particular browser colony had not yet completed cleanup.
