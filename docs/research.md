# Research and implementation decisions

## Rendering

Three.js WebGPURenderer uses WebGPU by default with WebGL 2 fallback. TSL compiles shader nodes to both backends. Renderer initialization is asynchronous. Existing WebGL onBeforeCompile shader patches and EffectComposer are not compatible with the new renderer.

Source: https://threejs.org/manual/en/webgpurenderer (consulted 2026-09-06).

Decision: pin Three.js 0.185.1; use its WebGPU entrypoint throughout. Begin with physical materials and measured instancing, then introduce TSL and postprocessing after actual render inspection.

## Locomotion

Walking and running in Cataglyphis fortis use alternating tripods. Forward speed changes stride length and stride frequency. Transported loads influence stability and support.

Sources: https://pubmed.ncbi.nlm.nih.gov/25829304/ and https://pmc.ncbi.nlm.nih.gov/articles/PMC3534694/.

Decision: maintain world-space stance feet, alternate L1/R2/L3 and R1/L2/R3, use swing arcs and a two-segment solver. Do not equate rhythmic leg waving with grounded locomotion. Uneven surfaces and climbing need explicit contact validation.

## Excavation

Leaf-cutting ants excavate pellets and transport them in stages. Intermediate deposits can attract further excavation. Roles in removal and transport can differ.

Sources: https://pmc.ncbi.nlm.nih.gov/articles/PMC3574050/ and https://elifesciences.org/articles/79638.

Decision: terrain removal creates a loose clump; carrying and deposition relocate that same object. Save the removed terrain and deposited particles. Begin with a bounded excavation face, then evaluate SDF remeshing and structural stability before claiming full volumetric terrain.

## Outstanding research

Ant recognition, trophallaxis, nest layouts, adhesion, soil material classes, and GPU terrain methods need deeper research before their production implementations. Names, personal housing, and social bonding will be explicit fictional interpretations of colony life.
