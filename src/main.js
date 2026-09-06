import "./style.css";
import * as T from "three/webgpu";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { loadAnt, Ant } from "./ant.js";
import { buildWorld, height, walkable } from "./world.js";
import {
  attachSurface,
  moveOnSurface,
  serializeFrame,
  restoreFrame,
} from "./surface-motor.js";
import { CameraRig } from "./camera.js";
import { stanceSupport } from "./support.js";
import { startGrooming } from "./grooming.js";
import { clearScentPath } from "./colony-social.js";
import { separateWorkersFromPlayer } from "./player-separation.js";
import { currentDuty } from "./duties.js";
import { AudioSystem } from "./audio.js";
import { load, save, loadNotice } from "./save.js";
import { scentRoute } from "./navigation.js";
import { AntSenses } from "./senses.js";
import { Presentation } from "./presentation.js";
import { updateDaylight } from "./daylight.js";
import { activityLabel } from "./daily-life.js";
import {
  sites,
  tick,
  distance,
  excavate,
  pickup,
  deposit,
  greet,
  relationship,
} from "./simulation.js";
const $ = (id) => document.getElementById(id);
addEventListener("unhandledrejection", (event) => {
  $("status").textContent =
    `Colony could not start: ${event.reason?.message ?? "unknown graphics error"}`;
});
addEventListener("error", (event) => {
  $("status").textContent = `Runtime error: ${event.message}`;
});
const state = await load();
let surfaceFrame = restoreFrame(state.player.attachment);
let gripCruise = false;
let route = [];
let started = false,
  saveFailed = false,
  elapsed = 0,
  lastSave = 0,
  lastHud = 0,
  toastUntil = 0,
  frameCount = 0,
  frameTime = 0;
const audio = new AudioSystem(),
  keys = new Set(),
  scene = new T.Scene();
scene.background = new T.Color(0x52614c);
scene.fog = new T.FogExp2(0x59634d, 0.014);
const camera = new T.PerspectiveCamera(53, innerWidth / innerHeight, 0.04, 130);
camera.position.set(3, 3, 7);
scene.add(camera);
const senses = new AntSenses(camera);
const renderer = new T.WebGPURenderer({
  canvas: $("world"),
  antialias: true,
  forceWebGL: new URLSearchParams(location.search).get("backend") === "webgl",
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.22;
try {
  await renderer.init();
} catch (error) {
  $("status").textContent = `Graphics could not start: ${error.message}`;
  throw error;
}
const pmrem = new T.PMREMGenerator(renderer);
const env = new RoomEnvironment();
scene.environment = pmrem.fromScene(env, 0.04).texture;
scene.environmentIntensity = 0.22;
env.dispose();
const ambient = new T.HemisphereLight(0xc4d4a0, 0x5b361a, 1.25);
scene.add(ambient);
const sun = new T.DirectionalLight(0xffe7a8, 3.5);
sun.position.set(12, 23, -13);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -28;
sun.shadow.camera.right = 28;
sun.shadow.camera.top = 30;
sun.shadow.camera.bottom = -30;
sun.shadow.normalBias = 0.035;
scene.add(sun);
scene.add(sun.target);
sun.target.position.set(0, 0, -16);
for (const [x, y, z, color, intensity] of [
  [-2, 2, -2, 0xffc77e, 15],
  [0, 2, -12, 0xe6bc70, 14],
  [-13, 2, -25, 0xe1a163, 20],
  [6, 4, -22, 0xd9e9aa, 18],
  [-13, 2, -6, 0xc6b887, 13],
  [13, 2, -6, 0xbecb98, 13],
]) {
  const l = new T.PointLight(color, intensity, 12, 1.6);
  l.position.set(x, y, z);
  scene.add(l);
}
const world = buildWorld(scene, state);
if (surfaceFrame) {
  surfaceFrame =
    attachSurface(
      world.contactDensity,
      surfaceFrame.position,
      surfaceFrame.forward,
    ) ?? surfaceFrame;
  state.player.x = surfaceFrame.position.x;
  state.player.z = surfaceFrame.position.z;
  state.player.attachment = serializeFrame(surfaceFrame);
}
await loadAnt();
const player = new Ant(
  scene,
  state.player.x,
  state.player.z,
  world.walkHeight,
  state.player.yaw,
);
const ants = state.npcs.map((n) => new Ant(scene, n.x, n.z, world.walkHeight));
for (const ant of [player, ...ants]) ant.terrainHeight = height;
player.contactDensity = world.solidDensity;
const rig = new CameraRig(camera, $("world"), world.cameraDensity);
rig.yaw = state.player.yaw;
rig.first = state.settings.firstPerson;
if (surfaceFrame) rig.yaw = 0;
const presentation = new Presentation(
  renderer,
  scene,
  camera,
  state.settings.quality ?? "balanced",
);
const itemMeshes = new Map();
const soilGeo = new T.IcosahedronGeometry(0.27, 1);
function syncItems() {
  for (const item of state.items) {
    let m = itemMeshes.get(item.id);
    if (!m) {
      m = new T.Mesh(
        item.kind === "seed" ? world.seedGeo : soilGeo,
        item.kind === "seed" ? world.seedMat : world.soil,
      );
      m.castShadow = true;
      m.receiveShadow = true;
      if (item.kind === "seed") m.scale.set(1, 0.8, 1.8);
      scene.add(m);
      itemMeshes.set(item.id, m);
    }
    m.visible = item.id !== state.player.carrying && item.owner == null;
    m.position.set(
      item.x,
      height(item.x, item.z) +
        0.2 +
        (item.fallHeight ?? 0) +
        (item.deposited ? 0.08 : 0),
      item.z,
    );
  }
}
function toast(message) {
  $("toast").textContent = message;
  $("toast").style.opacity = 1;
  toastUntil = elapsed + 5;
}
function nearby() {
  if (surfaceFrame)
    return {
      kind: "grip",
      text: `GRIP · W/S advance · A/D turn · V ${gripCruise ? "stop" : "steady advance"} · C release on ground`,
    };
  const p = state.player;
  if (p.groomRemaining > 0)
    return {
      kind: "groom",
      text: `Grooming antennae · ${Math.ceil(p.groomRemaining)}s · WASD to stop`,
    };
  if (p.carrying !== null)
    return {
      kind: "drop",
      text:
        distance(p, sites.spoil) < 3
          ? "E · Deposit soil in the spoil bed"
          : distance(p, sites.store) < 3
            ? "E · Deliver to the store"
            : "E · Put down your load",
    };
  const item = state.items
    .filter(
      (i) =>
        !i.deposited &&
        !(i.fallHeight > 0) &&
        i.owner == null &&
        i.id !== p.carrying &&
        distance(p, i) < 1.8,
    )
    .sort((a, b) => distance(p, a) - distance(p, b))[0];
  if (item)
    return {
      kind: "item",
      item,
      text: `E · Lift ${item.kind === "seed" ? "a fallen seed" : "the loosened soil"}`,
    };
  if (distance(p, sites.store) < 2.5)
    return { kind: "eat", text: "E · Eat from the communal store" };
  const npc = state.npcs
    .filter((n) => distance(p, n) < 2)
    .sort((a, b) => distance(p, a) - distance(p, b))[0];
  if (npc)
    return {
      kind: "social",
      npc,
      text: `E · Antennal greeting with ${npc.name}`,
    };
  if (distance(p, sites.home) < 3)
    return { kind: "home", text: "R · Rest on your leaf bed" };
  if (distance(p, sites.dig) < 5)
    return {
      kind: "dig",
      text: "Q · Scrape the earth face · E lift loose soil",
    };
  return null;
}
function interact() {
  const n = nearby();
  if (!n) return;
  audio.click();
  if (n.kind === "drop") {
    const delivered = distance(state.player, sites.spoil) < 3;
    deposit(state, {
      x: state.player.x - Math.sin(state.player.yaw),
      z: state.player.z - Math.cos(state.player.yaw),
    });
    toast(
      delivered
        ? "A little more room for the colony. Your crew notices."
        : "You set down your load.",
    );
  } else if (n.kind === "item") {
    pickup(state, n.item);
    toast(
      n.item.kind === "soil"
        ? "The clump grips between your mandibles. Carry it to the spoil bed."
        : "A seed for the colony. Carry it to the communal store.",
    );
  } else if (n.kind === "eat") {
    if (state.colony && state.colony.food <= 0) {
      toast("The store is empty. Foragers need to bring back more seeds.");
      return;
    }
    if (state.colony) state.colony.food--;
    state.player.hunger = Math.min(100, state.player.hunger + 25);
    toast("Warm seed oils. You feel nourished.");
  } else if (n.kind === "social") {
    greetWorker(n.npc);
  } else if (n.kind === "home") rest();
  syncItems();
}
function greetWorker(npc) {
  if (surfaceFrame) return;
  if (!npc) {
    toast("Move closer to a worker to exchange scents.");
    return;
  }
  const fresh = greet(state, npc);
  if (fresh === null) return;
  toast(
    fresh
      ? `${npc.name} pauses for an antennal exchange. Your scent is remembered.`
      : `${npc.name} recognises your scent. ${relationship(npc)}.`,
  );
}
function dig() {
  if (surfaceFrame) {
    toast("Release your grip on the ground before excavating.");
    return;
  }
  if (state.player.carrying !== null) {
    toast("Set down your load before excavating.");
    return;
  }
  let closest = null,
    best = 2.1;
  const p = state.player;
  for (const [id, m] of world.digCells) {
    const d = Math.hypot(
      m.position.x - p.x,
      m.position.z - p.z,
      m.position.y - 0.5,
    );
    if (d < best) {
      best = d;
      closest = [id, m];
    }
  }
  if (!closest) {
    toast("Move close to the exposed earth face in the new nursery.");
    return;
  }
  const [id, m] = closest;
  excavate(state, id, { x: m.position.x, z: m.position.z + 0.7, y: 0 });
  scene.remove(m);
  world.digCells.delete(id);
  world.rebuildExcavation();
  state.player.energy = Math.max(0, state.player.energy - 2);
  state.player.cleanliness = Math.max(0, (state.player.cleanliness ?? 78) - 7);
  audio.click(true);
  syncItems();
  toast("The soil breaks free. Lift the clump and carry it away.");
}
function rest() {
  if (surfaceFrame) {
    toast("Release your grip on the ground before resting.");
    return;
  }
  if (distance(state.player, sites.home) > 3) {
    toast("Your leaf bed is back in your home chamber.");
    return;
  }
  state.player.energy = 100;
  for (let i = 0; i < 150; i++)
    tick(state, 1, {
      canMeet: (a, b) =>
        clearScentPath(a, b, world.solidDensity, world.walkHeight),
    });
  state.player.hunger = Math.max(0, state.player.hunger - 8);
  toast("Two quiet hours beneath the leaf. The colony carries on.");
}
function journal() {
  if ($("journal").open) {
    $("journal").close();
    return;
  }
  const roster = $("colony-roster");
  roster.replaceChildren();
  const reserve = document.createElement("p");
  reserve.textContent = `Colony food: ${state.colony.food} portions · ${state.npcs.length} familiar workers`;
  roster.append(reserve);
  const selfCare = document.createElement("p");
  const cleanliness = state.player.cleanliness ?? 78;
  selfCare.textContent = `Your antennae: ${cleanliness >= 90 ? "clean" : cleanliness >= 60 ? "dusty" : "coated in soil"} · ${state.player.groomingBouts ?? 0} grooming breaks completed. Press L on the ground to groom.`;
  roster.append(selfCare);
  for (const n of state.npcs) {
    const row = document.createElement("p");
    row.textContent = `${n.name} · ${n.role} · ${activityLabel(n)} · energy ${Math.round(n.energy)} · nourishment ${Math.round(n.hunger ?? 85)}`;
    if (n.bonds?.length)
      row.textContent += ` · familiar with ${n.bonds
        .map((b) => state.npcs.find((other) => other.id === b.id)?.name)
        .filter(Boolean)
        .join(", ")}`;
    if (n.sharedGroomingBouts)
      row.textContent += ` · ${n.sharedGroomingBouts} shared grooming breaks`;
    roster.append(row);
  }
  $("memories").textContent =
    state.npcs
      .filter((n) => n.memories.length)
      .map(
        (n) =>
          `${n.name} · ${relationship(n)} · ${n.memories.length} shared memories`,
      )
      .join(" / ") || "You have yet to become familiar with your neighbours.";
  $("journal").showModal();
  const completed = state.nurseryCleared;
  $("colony-progress").textContent = completed
    ? `Nursery cleared on day ${completed.day}. You delivered ${completed.playerLoads} soil loads; the crew delivered ${completed.crewLoads}. ${currentDuty(state).text}`
    : currentDuty(state).text;
  keys.clear();
}
$("close").onclick = () => $("journal").close();
function followScent(key) {
  const site = sites[key];
  if (surfaceFrame) {
    toast("Release your grip on the ground before following a scent.");
    $("journal").close();
    return;
  }
  route = scentRoute(state.player, key);
  if (key === "surface") {
    const seed = state.items
      .filter((i) => i.kind === "seed" && !i.deposited && i.owner == null)
      .sort(
        (a, b) => distance(a, sites.surface) - distance(b, sites.surface),
      )[0];
    if (seed) route.push({ x: seed.x, z: seed.z });
  }
  $("journal").close();
  toast(
    `You pick up the scent of ${site.name.toLowerCase()}. WASD to leave the trail.`,
  );
}
$("duty-route").onclick = () => followScent(currentDuty(state).destination);
for (const [key, site] of Object.entries(sites)) {
  const button = document.createElement("button");
  button.textContent = `Follow scent · ${site.name}`;
  button.className = "scent-choice";
  button.onclick = () => followScent(key);
  $("journal").append(button);
}
const notesButton = document.createElement("button");
notesButton.id = "notes-button";
notesButton.textContent = "H · Scent & field notes";
notesButton.onclick = journal;
$("hud").append(notesButton);
const graphicsLabel = document.createElement("label");
graphicsLabel.className = "graphics-setting";
graphicsLabel.textContent = "Contact shading ";
const graphics = document.createElement("select");
graphics.setAttribute("aria-label", "Graphics quality");
for (const [value, text] of [
  ["low", "Off · fastest"],
  ["balanced", "Balanced"],
  ["high", "High detail"],
]) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = text;
  graphics.append(option);
}
graphics.value = presentation.quality;
graphics.onchange = () => {
  state.settings.quality = graphics.value;
  presentation.setQuality(graphics.value);
};
graphicsLabel.append(graphics);
$("journal").append(graphicsLabel);
const rosterDetails = document.createElement("details");
const rosterTitle = document.createElement("summary");
rosterTitle.textContent = "Colony lives";
const rosterContent = document.createElement("div");
rosterContent.id = "colony-roster";
rosterDetails.append(rosterTitle, rosterContent);
$("journal").append(rosterDetails);
if (import.meta.env.DEV) {
  const capture = document.createElement("button");
  capture.id = "capture-button";
  capture.textContent = "Save gameplay frame";
  capture.onclick = async () => {
    try {
      presentation.render();
      const pixels = renderer.domElement.toDataURL("image/png");
      const response = await fetch("/__capture", {
        method: "POST",
        body: pixels,
      });
      if (!response.ok) throw new Error("Capture failed");
      const result = await response.json();
      toast(`Actual gameplay frame saved: ${result.path}`);
    } catch (error) {
      toast(error.message);
    }
  };
  $("hud").append(capture);
}
$("enter").onclick = () => {
  started = true;
  $("enter").style.display = "none";
  audio.start();
  toast(loadNotice || "You are Worker 041. The day is yours.");
};
addEventListener("keydown", (e) => {
  if (
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(
      e.code,
    )
  )
    e.preventDefault();
  keys.add(e.code);
  if (e.repeat || !started) return;
  if (e.code === "KeyH") {
    journal();
    return;
  }
  if ($("journal").open) return;
  if (
    [
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "KeyE",
      "KeyG",
      "KeyQ",
      "KeyR",
      "KeyC",
    ].includes(e.code)
  )
    state.player.groomRemaining = 0;
  if (e.code === "KeyL") {
    if (startGrooming(state.player)) {
      route = [];
      toast("You settle down to clean your antennae.");
    } else toast("Stand on the ground with empty mandibles to groom.");
  }
  if (e.code === "KeyF") {
    rig.first = !rig.first;
    state.settings.firstPerson = rig.first;
  }
  if (e.code === "KeyE") interact();
  if (e.code === "KeyC") {
    gripCruise = false;
    if (surfaceFrame) {
      if (
        surfaceFrame.normal.y < 0.8 ||
        Math.abs(
          surfaceFrame.position.y -
            world.walkHeight(state.player.x, state.player.z),
        ) > 0.35
      ) {
        toast("Keep your grip. Return to the ground before releasing.");
        return;
      }
      state.player.yaw = Math.atan2(
        -surfaceFrame.forward.x,
        -surfaceFrame.forward.z,
      );
      rig.yaw = state.player.yaw;
      surfaceFrame = null;
      delete state.player.attachment;
      toast("Back on the ground.");
    } else {
      surfaceFrame = attachSurface(
        world.contactDensity,
        new T.Vector3(
          state.player.x,
          world.walkHeight(state.player.x, state.player.z),
          state.player.z,
        ),
        new T.Vector3(-Math.sin(rig.yaw), 0, -Math.cos(rig.yaw)),
      );
      if (surfaceFrame) {
        state.player.attachment = serializeFrame(surfaceFrame);
        rig.yaw = 0;
        route = [];
        toast("Grip engaged. W/S advance along the surface; A/D turn.");
      } else toast("No stable surface contact here.");
    }
  }
  if (e.code === "KeyV" && surfaceFrame) gripCruise = !gripCruise;
  if (e.code === "KeyW" || e.code === "KeyS") gripCruise = false;
  if (e.code === "KeyG")
    greetWorker(
      state.npcs
        .filter((n) => distance(n, state.player) < 2)
        .sort(
          (a, b) => distance(a, state.player) - distance(b, state.player),
        )[0],
    );
  if (e.code === "KeyQ") dig();
  if (e.code === "KeyR") rest();
});
addEventListener("keyup", (e) => keys.delete(e.code));
addEventListener("blur", () => keys.clear());
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
async function persist() {
  if (!started) return;
  try {
    await save(state);
    saveFailed = false;
    lastSave = elapsed;
  } catch (error) {
    saveFailed = true;
    console.warn(error);
    toast(
      "Saving is unavailable. Keep this tab open to preserve this session.",
    );
    lastSave = elapsed;
  }
}
document.addEventListener("visibilitychange", () => {
  keys.clear();
  if (document.hidden) persist();
});
let previous = performance.now();
syncItems();
renderer.setAnimationLoop(() => {
  const now = performance.now(),
    rawDt = (now - previous) / 1000,
    dt = Math.min(rawDt, 0.05);
  previous = now;
  elapsed += dt;
  if (started && !$("journal").open) {
    const nurseryWasCleared = !!state.nurseryCleared;
    const groomingBouts = state.player.groomingBouts ?? 0;
    tick(state, dt, {
      canMeet: (a, b) =>
        clearScentPath(a, b, world.solidDensity, world.walkHeight),
    });
    if (!nurseryWasCleared && state.nurseryCleared)
      toast("The nursery floor is clear. The colony has room to grow.");
    if ((state.player.groomingBouts ?? 0) > groomingBouts)
      toast("Antennae clean. Ready for the next part of your day.");
    separateWorkersFromPlayer(state.npcs, state.player, dt, walkable);
    if (world.digCells.size !== 105 - state.removed.length) {
      for (const id of state.removed) world.digCells.delete(id);
      world.rebuildExcavation();
    }
    if (keys.has("ArrowLeft")) rig.yaw += dt * 1.6;
    if (keys.has("ArrowRight")) rig.yaw -= dt * 1.6;
    if (keys.has("ArrowUp")) rig.pitch = Math.max(-0.3, rig.pitch - dt);
    if (keys.has("ArrowDown")) rig.pitch = Math.min(0.8, rig.pitch + dt);
    let forward = Number(keys.has("KeyW")) - Number(keys.has("KeyS")),
      side = Number(keys.has("KeyD")) - Number(keys.has("KeyA"));
    if (surfaceFrame && gripCruise && !forward) forward = 1;
    if (forward || side) route = [];
    if (route.length) {
      const waypoint = route[0];
      if (distance(state.player, waypoint) < 0.25) route.shift();
      else {
        const desired = Math.atan2(
          state.player.x - waypoint.x,
          state.player.z - waypoint.z,
        );
        rig.yaw +=
          Math.atan2(Math.sin(desired - rig.yaw), Math.cos(desired - rig.yaw)) *
          Math.min(1, dt * 5);
        forward = 1;
      }
    }
    const length = Math.hypot(forward, side);
    if (length) state.player.groomRemaining = 0;
    player.gaitIntent = !!surfaceFrame && length > 0;
    if (surfaceFrame) {
      const speed = state.player.carrying !== null ? 0.65 : 1.1;
      surfaceFrame = moveOnSurface(
        world.contactDensity,
        surfaceFrame,
        forward * dt * speed,
        -side * dt * 1.5,
        world.solidDensity,
        (frame) =>
          stanceSupport(world.solidDensity, frame, player.legs).supported,
      );
      state.player.x = surfaceFrame.position.x;
      state.player.z = surfaceFrame.position.z;
      state.player.attachment = serializeFrame(surfaceFrame);
      if (length)
        state.player.energy = Math.max(0, state.player.energy - dt * 0.3);
    } else if (length) {
      forward /= length;
      side /= length;
      const running = keys.has("ShiftLeft") && state.player.energy > 5;
      const speed =
        (running ? 3.6 : 1.8) * (state.player.carrying !== null ? 0.67 : 1);
      const dx =
          (-Math.sin(rig.yaw) * forward + Math.cos(rig.yaw) * side) *
          dt *
          speed,
        dz =
          (-Math.cos(rig.yaw) * forward - Math.sin(rig.yaw) * side) *
          dt *
          speed;
      const allowed = (x, z) =>
        walkable(x, z) &&
        ![...world.digCells.values()].some(
          (m) =>
            m.position.y < 1 &&
            Math.hypot(x - m.position.x, z - m.position.z) < 0.6,
        );
      if (allowed(state.player.x + dx, state.player.z)) state.player.x += dx;
      if (allowed(state.player.x, state.player.z + dz)) state.player.z += dz;
      const target = Math.atan2(-dx, -dz);
      state.player.yaw +=
        Math.atan2(
          Math.sin(target - state.player.yaw),
          Math.cos(target - state.player.yaw),
        ) * Math.min(1, dt * 12);
      state.player.energy = Math.max(
        0,
        state.player.energy - dt * (running ? 2 : 0.16),
      );
    }
    if (elapsed - lastSave > 20) persist();
  }
  player.update(
    state.player.x,
    state.player.z,
    rig.first ? rig.yaw : state.player.yaw,
    dt,
    state.player.carrying !== null,
    false,
    false,
    surfaceFrame,
    state.player.groomRemaining > 0,
  );
  player.body.visible = !rig.first;
  senses.update(rig.first, elapsed, state.player.carrying !== null);
  for (let i = 0; i < ants.length; i++) {
    const n = state.npcs[i],
      a = ants[i];
    const moving =
      Math.hypot(n.x - a.root.position.x, n.z - a.root.position.z) > 0.0002;
    const partner =
      n.encounterRemaining > 0
        ? state.npcs.find((other) => other.id === n.encounterPartner)
        : null;
    const yaw = partner
      ? Math.atan2(n.x - partner.x, n.z - partner.z)
      : n.greetingRemaining > 0
        ? Math.atan2(n.x - state.player.x, n.z - state.player.z)
        : moving
          ? Math.atan2(-(n.x - a.root.position.x), -(n.z - a.root.position.z))
          : (a.yaw ?? 0);
    const resting =
      n.task === "off-duty" &&
      !n.path?.length &&
      ["sleep", "fatigue"].includes(n.breakReason);
    a.update(
      n.x,
      n.z,
      yaw,
      dt,
      !!n.cargo,
      n.greetingRemaining > 0 ||
        (n.encounterRemaining > 0 && n.encounterKind !== "groom"),
      resting,
      null,
      n.groomRemaining > 0,
    );
  }
  rig.update(state.player, dt, player.root.position.y);
  if (state.items.some((item) => item.fallHeight > 0)) syncItems();
  world.dust.rotation.y = Math.sin(elapsed * 0.015) * 0.02;
  updateDaylight(scene, sun, ambient, state.time);
  if (elapsed - lastHud > 0.2) {
    syncItems();
    lastHud = elapsed;
    let closest = "home",
      d = Infinity;
    for (const [key, site] of Object.entries(sites)) {
      const dist = distance(state.player, site);
      if (dist < d) {
        closest = key;
        d = dist;
      }
    }
    $("location").textContent = d > 7 ? "The main artery" : sites[closest].name;
    $("ambient").textContent =
      closest === "surface"
        ? "Above you, the human world goes on."
        : closest === "dig"
          ? "Small mandibles. A world slowly reshaped."
          : "Familiar scents thread through the living soil.";
    $("clock").textContent =
      `DAY ${String(state.day).padStart(2, "0")} · ${String(Math.floor(state.time / 60)).padStart(2, "0")}:${String(Math.floor(state.time % 60)).padStart(2, "0")}`;
    $("energy").value = state.player.energy;
    $("hunger").value = state.player.hunger;
    $("cargo").textContent =
      state.player.carrying !== null
        ? "Carrying · " +
          state.items.find((i) => i.id === state.player.carrying)?.kind
        : "Mandibles free";
    const n = nearby();
    $("prompt").style.display = started && n ? "block" : "none";
    $("prompt").textContent = n?.text ?? "";
    const duty = currentDuty(state);
    $("duty-title").textContent = duty.title;
    $("duty-description").textContent = duty.text;
    $("objective").textContent = duty.progress;
    if (elapsed > toastUntil) $("toast").style.opacity = 0;
  }
  presentation.render();
  frameCount++;
  frameTime += rawDt;
  if (frameTime >= 2) {
    $("status").textContent =
      `${renderer.backend.isWebGPUBackend ? "WEBGPU" : "WEBGL 2"} · ${Math.round(frameCount / frameTime)} FPS · 24 colony workers · ${saveFailed ? "saving unavailable" : lastSave ? "colony saved" : "autosave ready"}`;
    $("status").dataset.metrics = JSON.stringify({
      fps: frameCount / frameTime,
      drawCalls: renderer.info.render.drawCalls,
      triangles: renderer.info.render.triangles,
      x: state.player.x,
      z: state.player.z,
      bodyY: player.root.position.y,
      groundBodyLift: surfaceFrame
        ? null
        : player.root.position.y - height(state.player.x, state.player.z),
      removed: state.removed.length,
      fallingSoil: state.items.filter((item) => item.fallHeight > 0).length,
      soilFalls: state.soilFalls ?? 0,
      items: state.items.length,
      carrying: state.player.carrying,
      colony: state.colony,
      restingWorkers: ants.filter((a) => a.restBlend > 0.8).length,
      attachment: state.player.attachment ?? null,
      grooming: {
        remaining: state.player.groomRemaining ?? 0,
        cleanliness: state.player.cleanliness ?? 78,
        bouts: state.player.groomingBouts ?? 0,
        workers: state.npcs.filter((n) => n.groomRemaining > 0).length,
      },
      workerEncounters:
        state.npcs.filter((n) => n.encounterRemaining > 0).length / 2,
      sharedGrooming: {
        pairs:
          state.npcs.filter(
            (n) => n.encounterKind === "groom" && n.encounterRemaining > 0,
          ).length / 2,
        completed:
          state.npcs.reduce((sum, n) => sum + (n.sharedGroomingBouts ?? 0), 0) /
          2,
      },
      workerBonds:
        state.npcs.reduce((total, n) => total + (n.bonds?.length ?? 0), 0) / 2,
      feet: {
        planted: surfaceFrame
          ? stanceSupport(world.solidDensity, surfaceFrame, player.legs).count
          : null,
        recovering: player.recoveringFeet,
        unreachable: player.unreachableFeet,
        maxSegmentError: player.maxLegLengthError,
      },
      camera: {
        position: camera.position.toArray(),
        obstructionOffset: rig.obstructionOffset,
        firstPerson: rig.first,
      },
    });
    frameCount = 0;
    frameTime = 0;
  }
});
window.antLife = {
  state,
  renderer,
  scene,
  camera,
  world,
  player,
  ants,
  rig,
  interact,
  dig,
  save: persist,
  telemetry: () => ({
    drawCalls: renderer.info.render.drawCalls,
    triangles: renderer.info.render.triangles,
    items: state.items.length,
    removed: state.removed.length,
  }),
};
$("status").textContent = "Colony ready";
$("enter").disabled = false;
