export const sites = {
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
      x: Math.cos(i * 2.39996) * (1.8 + (i % 3) * 0.5),
      z: (i < 12 ? 0 : -14) + Math.sin(i * 2.39996) * (1.8 + (i % 3) * 0.5),
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
export function tick(state, dt) {
  state.time += dt * 0.8;
  if (state.time >= 1440) {
    state.day++;
    state.time -= 1440;
  }
  const p = state.player;
  p.hunger = Math.max(0, p.hunger - dt * 0.024);
  p.energy = Math.min(100, Math.max(0, p.energy + dt * 0.12));
  updateColony(state, dt, { sites, distance, excavate });
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
  if (state.player.carrying !== null || item.deposited || item.owner != null)
    return false;
  state.player.carrying = item.id;
  return true;
}
export function deposit(state, position) {
  const item = state.items.find((i) => i.id === state.player.carrying);
  if (!item) return false;
  item.x = position.x;
  item.z = position.z;
  item.y = position.y ?? 0;
  state.player.carrying = null;
  if (distance(position, sites.spoil) < 3 && item.kind === "soil") {
    item.deposited = true;
    state.player.deliveries++;
    for (const n of state.npcs.filter((n) => distance(n, sites.dig) < 12)) {
      remember(state, n, "shared-work");
    }
  }
  if (distance(position, sites.store) < 3 && item.kind === "seed") {
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
    Array.isArray(state.removed) &&
    Array.isArray(state.items) &&
    Number.isFinite(state.player?.x) &&
    Number.isFinite(state.player?.z) &&
    Number.isFinite(state.time)
  );
}
import { updateColony } from "./colony.js";
