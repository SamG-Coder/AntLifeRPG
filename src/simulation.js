import { restingChambers } from "./colony-layout.js";
import { restoreFrame } from "./surface-motor.js";
import { advanceGrooming, validGrooming } from "./grooming.js";
import { validWorkerBonds } from "./colony-social.js";
import { advanceSoilStability, validSoilMotion } from "./soil-stability.js";
import { recordNurseryCompletion, validNurseryCompletion } from "./duties.js";
import { advanceFoodSupply, validFoodSupply } from "./food-supply.js";
import { nutrition } from "./nutrition.js";
import { validBedding } from "./bedding.js";
export const sites = {
  ...restingChambers,
  home: { x: 0, z: 0, name: "Your chamber" },
  store: { x: 0, z: -14, name: "The communal store" },
  dig: { x: -14, z: -25, name: "The new nursery" },
  spoil: { x: -8, z: -19, name: "The spoil bed" },
  surface: { x: 13, z: -31, name: "The root garden" },
};
const names = [
  "Tansy",
  "Ochre",
  "Reed",
  "Mica",
  "Silt",
  "Fern",
  "Russet",
  "Clove",
  "Flint",
  "Sorrel",
  "Pip",
  "Yarrow",
  "Ash",
  "Lichen",
  "Clover",
  "Bramble",
  "Nettle",
  "Loam",
  "Fennel",
  "Moss",
  "Thistle",
  "Ember",
  "Hazel",
  "Juniper",
];
export const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export function createState() {
  return {
    version: 1,
    day: 1,
    foodSupply: { lastDay: 1, arrivals: 0, archived: 0 },
    time: 7 * 60,
    player: {
      x: 0,
      z: 1,
      yaw: 0,
      energy: 100,
      hunger: 86,
      carrying: null,
      deliveries: 0,
      seeds: 0,
    },
    npcs: names.map((name, i) => ({
      id: i,
      name,
      role: i % 3 === 0 ? "excavator" : i % 3 === 1 ? "forager" : "carrier",
      x:
        i < 12
          ? ((i % 2) * 2 - 1) * 1.05
          : Math.cos(((i - 12) * Math.PI) / 6) * 3.5,
      z:
        i < 12
          ? -4 - Math.floor(i / 2) * 1.7
          : -14 + Math.sin(((i - 12) * Math.PI) / 6) * 3.5,
      target: i % 4,
      energy: 100,
      trust: 0,
      memories: [],
      cargo: null,
    })),
    removed: [],
    items: [],
    nextItem: 1,
    events: [],
    colony: { soilDelivered: 0, seedsDelivered: 0, food: 45 },
    discovered: ["home"],
    home: { decorations: 0 },
    settings: { firstPerson: false },
  };
}
export function tick(state, dt, { canMeet, canWalk } = {}) {
  state.time += dt * nutrition.minutesPerSecond;
  if (state.time >= 1440) {
    state.day++;
    state.time -= 1440;
  }
  const p = state.player;
  advanceFoodSupply(state);
  p.hunger = Math.max(0, p.hunger - dt * nutrition.playerDrain);
  advanceGrooming(p, dt);
  p.energy = Math.min(100, Math.max(0, p.energy + dt * 0.12));
  advanceSoilStability(state, dt, excavate);
  advancePlayerGreetings(state, dt, canMeet);
  updateColony(state, dt, { sites, distance, excavate, canMeet, canWalk });
  recordNurseryCompletion(state);
}
export function excavate(state, cell, position) {
  if (state.removed.includes(cell)) return null;
  state.removed.push(cell);
  const item = {
    id: state.nextItem++,
    kind: "soil",
    x: position.x,
    z: position.z,
    y: position.y ?? 0,
    cell,
    deposited: false,
  };
  state.items.push(item);
  return item;
}
export function pickup(state, item) {
  if (
    state.player.carrying !== null ||
    item.deposited ||
    item.owner != null ||
    item.fallHeight > 0
  )
    return false;
  state.player.carrying = item.id;
  if (item.kind === "leaf") item.homePlaced = false;
  return true;
}
export function deliveryDestination(item, position) {
  if (item?.kind === "leaf" && distance(position, sites.home) < 4.5)
    return "home";
  if (item?.kind === "soil" && distance(position, sites.spoil) < 3)
    return "spoil";
  if (item?.kind === "seed" && distance(position, sites.store) < 3)
    return "store";
  return null;
}
export function deposit(state, position) {
  const item = state.items.find((i) => i.id === state.player.carrying);
  if (!item) return false;
  item.x = position.x;
  item.z = position.z;
  item.y = position.y ?? 0;
  state.player.carrying = null;
  const destination = deliveryDestination(item, position);
  if (item.kind === "leaf") item.homePlaced = destination === "home";
  if (destination === "spoil") {
    item.deposited = true;
    state.player.deliveries++;
    for (const n of state.npcs.filter((n) => distance(n, sites.dig) < 12)) {
      remember(state, n, "shared-work");
    }
  }
  if (destination === "store") {
    item.deposited = true;
    state.player.seeds++;
    if (state.colony) state.colony.food++;
  }
  return true;
}
export function remember(state, npc, event) {
  const key = `${state.day}:${event}`;
  if (npc.memories.some((m) => m.key === key)) return false;
  npc.memories.push({ key, day: state.day, event });
  npc.trust += event === "shared-work" ? 2 : 1;
  return true;
}
export function greet(state, npc, canMeet = () => true) {
  if (
    state.player.attachment ||
    distance(state.player, npc) >= 2 ||
    npc.greetingRemaining > 0 ||
    !canMeet(state.player, npc)
  )
    return null;
  npc.greetingRemaining = 2.8;
  return !npc.memories.some((m) => m.key === `${state.day}:greet`);
}
function advancePlayerGreetings(state, dt, canMeet = () => true) {
  for (const npc of state.npcs) {
    if (!(npc.greetingRemaining > 0)) continue;
    if (
      state.player.attachment ||
      distance(state.player, npc) >= 2.8 ||
      !canMeet(state.player, npc)
    ) {
      npc.greetingRemaining = 0;
      continue;
    }
    npc.greetingRemaining = Math.max(0, npc.greetingRemaining - dt);
    if (npc.greetingRemaining === 0) remember(state, npc, "greet");
  }
}
export function relationship(npc) {
  return npc.trust >= 8
    ? "Work friend"
    : npc.trust >= 3
      ? "Familiar worker"
      : "Colony acquaintance";
}
export function validateState(state) {
  return (
    state?.version === 1 &&
    Array.isArray(state.npcs) &&
    state.npcs.length === 24 &&
    new Set(state.npcs.map((n) => n?.id)).size === 24 &&
    state.npcs.every(
      (n) =>
        n &&
        validGrooming(n) &&
        validWorkerBonds(n, new Set(state.npcs.map((worker) => worker?.id))) &&
        Number.isInteger(n.id) &&
        typeof n.name === "string" &&
        [n.x, n.z, n.energy, n.trust].every(Number.isFinite) &&
        Array.isArray(n.memories) &&
        n.memories.every((m) => m && typeof m.key === "string") &&
        (!n.path ||
          (Array.isArray(n.path) &&
            n.path.every((p) => p && [p.x, p.z].every(Number.isFinite)))),
    ) &&
    Array.isArray(state.removed) &&
    Array.isArray(state.items) &&
    state.items.every(
      (i) =>
        i &&
        Number.isInteger(i.id) &&
        [i.x, i.z].every(Number.isFinite) &&
        ["soil", "seed", "leaf"].includes(i.kind),
    ) &&
    validSoilMotion(state) &&
    validNurseryCompletion(state) &&
    validFoodSupply(state) &&
    validBedding(state) &&
    new Set(state.items.map((i) => i.id)).size === state.items.length &&
    Number.isInteger(state.nextItem) &&
    state.items.every((i) => i.id < state.nextItem) &&
    Number.isInteger(state.day) &&
    state.day > 0 &&
    state.settings &&
    typeof state.settings === "object" &&
    Number.isFinite(state.player?.x) &&
    validGrooming(state.player) &&
    (!state.player.attachment || !!restoreFrame(state.player.attachment)) &&
    Number.isFinite(state.player?.z) &&
    Number.isFinite(state.time)
  );
}
import { updateColony } from "./colony.js";
