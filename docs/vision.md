# ANT RPG — Worker Ant Life Simulation

## GOAL

Create a highly detailed, visually impressive **third-person / first-person ant RPG and life simulation** set inside a huge, living ant colony tank.

The player is **not the queen, a soldier, or a chosen hero**.

The player begins as an ordinary **Worker Ant** living inside a functioning colony.

The goal is to make the player feel like they genuinely inhabit an enormous ant civilisation where they have:

* a daily occupation
* responsibilities to the colony
* hunger and energy needs
* friendships
* rivalries
* relationships
* a home
* possessions
* leisure activities
* reputation
* routines
* choices
* progression
* a changing social life
* meaningful work
* an enormous physical world to explore

The colony should feel alive whether or not the player is watching it.

This should not feel like a generic survival game with an ant model.

It should feel like an **ant life simulator / RPG**.

---

# CORE FANTASY

You are one worker ant among thousands.

Every morning you leave your chamber, move through crowded tunnels, encounter ants you recognise, check your assigned duties, eat, work, socialise, explore and gradually build your own life inside the colony.

Your work might involve:

* excavating new chambers
* carrying soil
* moving gravel
* reinforcing tunnels
* collecting seeds
* harvesting food
* scavenging outside
* carrying food back to storage
* tending fungus or colony resources depending on ant species
* moving larvae
* helping injured ants
* repairing damaged tunnels
* cleaning chambers
* transporting resources between areas
* assisting construction teams
* responding to emergencies

But the game should also let the player exist beyond work.

After a shift the player might:

* visit another ant's chamber
* eat with colony members
* socialise
* groom another ant
* attend communal activities
* explore unused tunnels
* race other ants
* climb objects inside the tank
* investigate the human world outside the glass
* collect decorative items
* improve their own chamber
* form friendships
* build rivalries
* develop a partner relationship
* gain social reputation
* participate in colony celebrations or rituals
* help another worker with a personal problem
* sneak into restricted areas
* discover hidden parts of the colony

The world needs mundane life, not just missions.

---

# THE WORLD

The entire game takes place inside and around a gigantic ant colony tank.

At ant scale, this should feel like an enormous open world.

The player should experience:

## Below Ground

A huge procedural / authored tunnel network containing:

* main transportation tunnels
* narrow worker tunnels
* nursery chambers
* food storage chambers
* waste chambers
* worker living areas
* construction zones
* abandoned tunnels
* recently collapsed tunnels
* emergency routes
* hidden cavities
* water pockets
* roots
* stones
* buried human objects
* fungal growth
* mineral deposits
* underground insects
* natural soil layers

Different depths should visually change.

Examples:

### Upper Soil

Loose dirt, roots, plant matter, bright cracks of surface light.

### Mid Colony

Dense tunnel infrastructure, heavily travelled routes, storage and residential chambers.

### Deep Colony

Dark compact soil, larger stones, moisture, rare materials, forgotten tunnels and dangerous creatures.

---

# SURFACE WORLD

The colony should connect to a highly detailed surface environment inside the ant tank.

Possible elements:

* moss
* grass
* stones
* twigs
* leaves
* bark
* flowers
* seeds
* food dropped by humans
* water bowls
* feeding stations
* terrarium decorations
* glass walls
* artificial lights
* condensation
* insects
* spiders
* beetles
* flies
* mites

At ant scale even mundane objects should look monumental.

A dropped biscuit crumb might resemble a boulder.

A blade of grass should resemble a tree.

A shallow droplet should resemble a lake.

---

# SCALE

Scale is critical.

The game should constantly remind the player that they are tiny.

Use:

* extreme macro rendering
* very shallow environmental details
* giant grains of dirt
* huge fibres
* individual hairs
* tiny scratches
* microscopic surface imperfections
* enormous plant structures
* volumetric dust
* pollen
* moisture droplets
* soil particles

Avoid making the world simply look like a normal human environment scaled upward.

It needs authentic **macro-scale visual language**.

---

# PLAYER CHARACTER

The player is a Worker Ant.

Create a high-quality anatomically believable ant model in Blender.

The ant should have:

* head
* thorax / mesosoma
* abdomen / gaster
* mandibles
* antennae
* compound eyes
* six articulated legs
* realistic joints
* segmented body
* subtle body hairs
* shell roughness variation
* micro scratches
* dirt accumulation
* moisture response
* subtle subsurface qualities where appropriate

The animation system should account for six-legged locomotion rather than approximating a quadruped.

Animations should include:

* idle
* walking
* running
* climbing
* turning
* carrying
* dragging
* digging
* mandible interaction
* grooming
* eating
* drinking
* antenna investigation
* social antenna interaction
* resting
* sleeping
* squeezing through tunnels
* falling
* recovering
* carrying oversized objects

Use Blender located at:

D:/Blender

Use Blender through the available MCP tooling wherever possible.

Do not replace quality assets with primitive placeholders unless they are temporary during prototyping.

---

# CAMERA

The primary camera is **third-person**, positioned close enough to maintain the feeling of ant scale.

The player must also be able to switch into **first-person**.

## Third Person

Camera should:

* follow naturally
* handle tunnels correctly
* avoid clipping through soil
* dynamically zoom in narrow spaces
* react to climbing
* smoothly adjust orientation on walls and steep surfaces
* support looking independently from movement

## First Person

First-person mode should feel genuinely different.

It should show:

* antennae occasionally entering the player's vision
* mandibles when carrying / digging / interacting
* dramatic macro depth
* ground particles passing extremely close
* realistic body motion
* limited ant-scale field of view where appropriate

Do not treat first-person as simply attaching a camera to the head.

---

# LOCOMOTION

Ant movement is fundamental.

Research real ant gait.

Implement convincing six-legged procedural or authored locomotion.

Support:

* walking across flat ground
* uneven soil
* rocks
* roots
* ceilings where biologically reasonable
* vertical surfaces
* steep tunnels
* climbing vegetation
* squeezing between objects

Feet should conform to surfaces.

Avoid visible foot sliding.

Use procedural foot placement / IK if needed.

Body orientation should respond smoothly to surface normals.

Movement should communicate very low body mass.

---

# DAILY LIFE SYSTEM

The player should live through repeating colony days.

Each day contains:

* waking
* checking needs
* work assignment
* travelling to the workplace
* performing tasks
* meal periods
* social interaction
* personal time
* returning home
* sleep

But this should not become a rigid checklist simulator.

The player can choose how faithfully they follow colony expectations.

Skipping work could affect:

* reputation
* relationships
* work assignments
* colony trust
* access to areas
* future opportunities

---

# WORK SYSTEM

Work should be physical and playable.

Do NOT resolve jobs with progress bars.

## Digging

Digging needs to alter the physical environment.

The player should:

1. bite / scrape soil
2. loosen material
3. gather a dirt particle / clump
4. carry or drag it
5. transport it out
6. deposit it somewhere appropriate

Tunnel excavation should therefore visually emerge from repeated physical actions.

Consider voxel, signed-distance-field, sparse volume, marching cubes, mesh remeshing, or another appropriate deformable-terrain solution.

Research what will produce the best visual quality while remaining performant in Three.js / WebGPU.

Digging must produce:

* actual cavities
* dirt displacement
* debris
* loose particles
* changing navigation
* tunnel expansion
* structural consequences

---

# SOIL SIMULATION

Soil should not behave like a single smooth terrain mesh.

Support different particulate behaviour for:

* dry loose soil
* compact soil
* damp soil
* sand
* clay-like material
* small gravel
* organic matter

Use visual tricks and simulation selectively.

Do not attempt to physically simulate every soil grain.

Instead combine:

* deformable macro geometry
* instanced particles
* decals
* displacement
* normal maps
* loose debris
* GPU particles
* local physics

Aim for the perception of granular soil.

---

# GATHERING WORK

Other jobs should include:

## Food Gathering

Locate food, break manageable pieces off and transport them home.

Weight should matter.

Large objects may require multiple ants.

## Resource Transport

Move:

* seeds
* food particles
* larvae
* soil
* leaves
* building material

NPC ants should dynamically join cooperative carrying tasks.

## Construction

Help create:

* new tunnels
* chamber walls
* storage zones
* structural reinforcement

---

# ANT SOCIETY

NPC ants must not behave like anonymous ambient crowds.

Create persistent ants with identities.

Each ant may have:

* name / identifier
* age
* role
* home chamber
* schedule
* preferences
* relationships
* friends
* rivals
* partner
* family / colony associations where applicable
* work group
* personality traits
* memories
* opinion of the player
* recent experiences

The player should repeatedly encounter familiar ants.

An ant met on day one should still exist weeks later unless something happened to them.

---

# SOCIAL SYSTEM

Ant communication should be inspired by real ant behaviours rather than simply showing human dialogue bubbles.

Research:

* pheromones
* antennation
* trophallaxis
* grooming
* trail communication
* alarm responses
* recognition

Translate these into understandable gameplay.

Some human-readable dialogue / internal interpretation is acceptable for RPG accessibility, but visually interactions should remain ant-like.

Possible interactions:

* greet
* inspect
* antennal exchange
* groom
* share food
* ask for help
* invite somewhere
* work together
* gift item
* argue / challenge
* apologise
* comfort
* follow
* join activity

---

# RELATIONSHIPS

Allow persistent relationships.

Types:

* acquaintance
* friend
* close friend
* rival
* work partner
* romantic / bonded partner if appropriate to the fictionalised ant society
* mentor
* dependent
* disliked

Relationships should emerge through repeated interactions rather than a simplistic relationship bar.

NPCs should remember:

* shared work
* help
* abandonment
* gifts
* arguments
* dangerous events
* promises
* successful group activities

---

# PLAYER HOME

The player should have their own small chamber.

Initially it may be simple.

Over time the player can improve it.

Possible upgrades:

* larger chamber
* storage niches
* food storage
* collected objects
* polished stones
* seed shells
* fibres
* leaf pieces
* colourful human debris
* improved sleeping area
* wall markings
* trophies
* sentimental objects

Housing should physically exist in the colony.

The player should travel there rather than opening a menu.

NPC ants may visit.

---

# FUN ACTIVITIES

Create ant-scale activities unrelated to work.

Examples:

* beetle riding / climbing
* twig climbing
* seed rolling contests
* dirt races
* tunnel races
* exploration groups
* scavenger hunts
* fungal gardens
* collecting unusual materials
* play fighting
* climbing grass
* visiting surface viewpoints
* watching humans through the glass
* exploring abandoned colony sections
* tending small personal collections
* helping build communal decorations

Continue inventing activities that suit ant scale.

---

# RPG PROGRESSION

Avoid generic "+5 strength" RPG design.

Progression should primarily happen through capability and social standing.

Possible skills:

* digging efficiency
* carrying
* climbing
* navigation
* scent tracking
* foraging
* construction
* scouting
* combat
* cooperation
* grooming / social skill

Progress may unlock:

* harder work
* specialised teams
* restricted colony zones
* better housing
* leadership responsibilities
* dangerous expeditions
* surface missions
* construction planning
* rare resource access

---

# SIMULATION

The colony should continue operating around the player.

NPC ants should:

* travel
* work
* eat
* rest
* socialise
* carry things
* respond to pheromones
* respond to blocked paths
* respond to food discovery
* repair damage
* assist other ants
* create trails
* evacuate danger
* react to changing colony conditions

Implement an efficient simulation model where distant ants can run on simplified logic rather than fully rendered behaviour.

---

# EVENTS

Create systemic events.

Examples:

* tunnel collapse
* sudden flooding
* new food source
* food shortage
* insect invasion
* spider attack
* damaged nursery
* heat wave
* heavy condensation
* human moving part of the tank
* foreign ant intrusion
* disease / fungal contamination
* queen-related colony event
* new chamber project
* lost worker
* buried worker
* major excavation

These should alter normal routines.

---

# GRAPHICS TARGET

Visual quality is one of the highest priorities.

Do not accept "good for Three.js."

Push Three.js WebGPU as far as practical.

Research current Three.js capabilities before implementation.

Use high quality:

* physically based rendering
* WebGPU
* TSL where appropriate
* procedural material layering
* macro textures
* normal maps
* height maps
* roughness maps
* ambient occlusion
* contact shadows
* dynamic lighting
* GI approximations
* reflections
* translucency
* volumetric effects
* particle systems
* temporal effects
* depth of field
* motion blur where tasteful
* atmospheric dust
* subsurface scattering approximations
* physically plausible moisture

If WebGPU allows a substantially better approach than WebGL, favour WebGPU.

---

# UNDERGROUND LIGHTING

Underground environments must not look like generic brown caves.

Create lighting variation using:

* indirect surface light
* shafts through entrances
* translucent soil edges
* wet reflective pockets
* fungi
* warm ambient colony lighting if stylised systems are needed
* tiny reflective minerals
* subtle bioluminescent elements only where appropriate
* player-adapted low-light perception

The colony should remain readable without destroying the illusion of darkness.

---

# MACRO PHOTOGRAPHY LOOK

Use macro-photography inspiration.

Visual characteristics:

* extremely detailed foreground
* physically meaningful depth of field
* shallow focus where appropriate
* large bokeh
* micro surface detail
* strong near-ground perspective
* close-up lighting
* tiny floating particles

Do not overuse DOF to the point that gameplay becomes blurry.

---

# PERFORMANCE

Beautiful graphics cannot mean unusable performance.

Target stable gameplay on modern desktop GPUs.

Design systems around:

* GPU instancing
* spatial partitioning
* frustum culling
* occlusion
* chunk streaming
* mesh LOD
* texture streaming
* simplified distant simulation
* pooled particles
* batched AI updates
* worker threads where useful

Aim initially for a stable 60 FPS target on capable hardware, with scalable presets.

Do not destroy close-up detail just to improve benchmark numbers.

---

# TECHNOLOGY

Primary stack:

* Three.js
* WebGPU
* JavaScript or TypeScript
* TSL where beneficial
* Blender assets
* Blender MCP
* GitHub
* GitHub Actions
* GitHub Pages

Use Blender from:

D:/Blender

The final project should run as a browser game from GitHub Pages.

---

# REPOSITORY

Create a clean GitHub repository.

Suggested project name:

AntLifeRPG

Include:

* source
* assets
* Blender source assets where appropriate
* shaders
* simulation systems
* documentation
* design notes
* benchmarks
* screenshots
* README
* licence
* GitHub Actions
* GitHub Pages deployment

Commit in meaningful stages.

Do not dump one giant unstructured commit.

---

# GITHUB ACTIONS

Set up automated:

* dependency installation
* build
* tests
* lint
* production bundle
* GitHub Pages deploy

Do not depend on a developer manually uploading builds.

---

# ARCHITECTURE

Use separate systems for:

* rendering
* world streaming
* terrain
* digging
* ant locomotion
* animation
* AI
* NPC schedules
* relationships
* needs
* work
* colony simulation
* interaction
* items
* inventory
* housing
* audio
* save system
* UI

Do not create one giant game class.

---

# SAVE SYSTEM

Persist:

* player progress
* player home
* inventory
* current job
* skills
* relationships
* NPC states
* discovered locations
* colony state
* tunnel alterations
* world events
* settings

For a browser build, start with IndexedDB or another sensible client-side persistence system.

---

# AUDIO

Sound should reinforce scale.

Examples:

* granular soil scraping
* mandible clicks
* faint leg movement
* distant tunnel activity
* muffled underground vibration
* rainfall hitting the tank
* human footsteps sounding enormous
* glass vibration
* dirt collapse
* plant movement
* insect sounds

Avoid making ants constantly produce unrealistic loud noises.

Use vibration and environmental sound to communicate things an ant might detect differently from a human.

---

# USER INTERFACE

Keep HUD minimal.

Do not make this look like an MMO.

Communicate information diegetically where possible.

Small UI may show:

* energy
* hunger
* current task
* pheromone / scent information
* carried object
* important relationship changes

Menus should feel polished and modern.

---

# STARTING EXPERIENCE

Create a strong playable opening.

Example:

The player wakes inside their small worker chamber.

Ants move through the nearby tunnel.

The player steps into the main artery of the colony and immediately sees dozens of ants travelling in both directions.

They collect food from a communal storage area.

Their first assignment is to join a digging crew extending a tunnel.

The player walks to the construction zone.

Several NPCs are already scraping soil.

The player physically digs loose material, carries it away and deposits it.

During the shift, a worker nearby introduces themselves.

After work, that ant invites the player to visit a surface feeding area.

This naturally introduces:

* locomotion
* navigation
* work
* digging
* NPCs
* relationships
* food
* surface exploration
* the day cycle

Do not start with a wall of tutorials.

Teach through play.

---

# FIRST VERTICAL SLICE

Before attempting the entire colony, create one extremely polished vertical slice containing:

* player Worker Ant
* third-person locomotion
* first-person mode
* one detailed underground chamber
* one main tunnel
* one excavation chamber
* one surface area
* at least 20 active worker ants
* persistent NPC identities
* basic relationship system
* hunger
* stamina
* food
* player's home
* working excavation mechanics
* dirt carrying
* one gathering task
* one leisure activity
* day / night progression
* save system

This slice must look visually impressive.

Do not expand into a huge empty world before the slice feels good.

---

# QUALITY BAR

Repeatedly compare the implementation against:

* modern AAA macro environments
* high-end nature documentaries
* macro insect photography
* realistic soil photography
* high quality Unreal Engine nature scenes
* grounded survival game environments

Do NOT simply compare the current build against the previous build and declare improvement.

Compare it against the intended quality target.

---

# ITERATION RULE

This project is explicitly **not finished when the checklist is implemented**.

Continue iterating until stopped manually.

Whenever you think a feature is finished:

1. run it
2. inspect it
3. criticise it
4. identify the weakest visible area
5. improve that area
6. test again
7. compare against references
8. repeat

Do not assume a system works because the code compiles.

Do not assume graphics look good because the shader is sophisticated.

Actually inspect the rendered result.

---

# SELF-CRITIQUE LOOP

After every significant milestone, answer internally:

* What looks fake?
* What feels gamey?
* What looks procedural?
* What lacks detail?
* What breaks ant scale?
* What is repetitive?
* What is visually flat?
* What animation looks wrong?
* What interactions lack physicality?
* What part currently looks cheapest?
* What would immediately expose this as an indie prototype?
* What would Unreal Engine likely do better?
* What can we improve using Three.js/WebGPU?

Then fix the biggest issue.

---

# DO NOT CHEAT

Do not:

* fake digging with only an animation
* teleport dirt away
* make NPCs purely decorative
* replace social simulation with random dialogue
* make the world a set of disconnected menus
* rely on giant texture files instead of proper geometry/detail techniques
* use fog to hide weak environments
* spawn hundreds of NPCs that have no persistent state
* create fake screenshots that do not represent gameplay
* call something "procedural locomotion" if feet visibly slide
* claim performance improvements without measuring them
* stop once every task has a green tick

---

# RESEARCH

Research before implementing difficult systems.

In particular research:

* real ant locomotion
* ant social behaviour
* ant nest architecture
* excavation behaviour
* cooperative carrying
* pheromone communication
* macro insect rendering
* soil rendering
* deformable terrain approaches
* WebGPU capabilities
* current Three.js WebGPU / TSL techniques
* modern browser GPU performance strategies

Use research to alter the design when reality suggests something better.

---

# BUILD PHILOSOPHY

Prefer a smaller number of systems that feel physical and convincing over a large number of shallow systems.

The player's first ten minutes should already demonstrate why being an ant is mechanically different from playing a human RPG.

The game should eventually support stories emerging from simulation rather than relying exclusively on scripted quests.

---

# DEVELOPMENT ORDER

Start approximately in this order:

1. Repository / build / GitHub Pages
2. Three.js WebGPU rendering foundation
3. Macro-scale test scene
4. High-quality Worker Ant Blender model
5. Six-legged locomotion
6. Third-person camera
7. First-person camera
8. Surface adhesion / climbing
9. Detailed soil materials
10. Tunnel environment
11. Deformable excavation prototype
12. Dirt pickup / carrying / deposition
13. NPC Worker Ants
14. Colony navigation
15. NPC scheduling
16. Player needs
17. Work assignments
18. Persistent NPC identities
19. Relationship simulation
20. Player home
21. Surface environment
22. Gathering
23. Leisure activities
24. Day cycle
25. Colony events
26. optimisation
27. graphics refinement
28. animation refinement
29. simulation refinement
30. repeat indefinitely

This order may change when research reveals a better architecture.

---

# CONTINUOUS GOAL

Your ongoing goal is:

> Build the most convincing ant-scale RPG and living ant colony simulation practical in Three.js/WebGPU, with exceptional graphics, physical interaction, persistent NPC lives and genuinely enjoyable everyday ant life.

Do not interpret completion of a milestone as completion of the goal.

If there is no obvious task remaining, inspect the game and invent the next improvement.

If the game looks good, improve simulation.

If simulation is good, improve animation.

If animation is good, improve interaction.

If interaction is good, improve world density.

If world density is good, improve performance.

If performance is good, improve graphical fidelity.

If all of those appear good, perform a full critical audit and find what is still weaker than the reference quality bar.

Continue until I manually stop you.
