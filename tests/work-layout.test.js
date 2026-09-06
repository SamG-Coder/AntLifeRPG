import test from "node:test";
import assert from "node:assert/strict";
import {
  nurseryWaitingPlace,
  reserveExcavationCell,
} from "../src/work-layout.js";
import { separateWorkersFromPlayer } from "../src/player-separation.js";
import { createState, tick } from "../src/simulation.js";
import { walkable } from "../src/world.js";

test("ground crews have separate walkable nursery waiting positions", () => {
  const workers = createState().npcs.filter((n) => n.role !== "forager");
  const places = workers.map(nurseryWaitingPlace);
  assert.equal(new Set(places.map((p) => `${p.x}:${p.z}`)).size, 16);
  for (const a of places) {
    assert.ok(walkable(a.x, a.z));
    for (const b of places)
      if (a !== b) assert.ok(Math.hypot(a.x - b.x, a.z - b.z) >= 1.7999);
  }
});

test("excavation reservations leave body width between active columns", () => {
  const state = createState();
  for (const n of state.npcs.filter((n) => n.role === "excavator"))
    n.cell = reserveExcavationCell(state, n);
  const columns = state.npcs
    .filter((n) => n.cell)
    .map((n) => Number(n.cell.split(":")[0]));
  assert.deepEqual(columns, [0, 3, 6]);
});

test("a saved crew targeting the player's approach point resumes excavation and deliveries", () => {
  const state = createState();
  state.player.x = -14;
  state.player.z = -26.77;
  for (const n of state.npcs.filter((n) => n.role !== "forager"))
    Object.assign(n, {
      workVersion: 1,
      task: "commute",
      destination: "dig",
      path: [{ x: -14, z: -27 }],
      x: -14 + Math.sin(n.id) * 2,
      z: -25 + Math.cos(n.id),
    });
  for (let i = 0; i < 6000; i++) {
    tick(state, 0.05);
    separateWorkersFromPlayer(state.npcs, state.player, 0.05, walkable);
  }
  assert.ok(state.colony.soilDelivered >= 10);
  assert.ok(state.removed.length >= 10);
  assert.ok(
    state.npcs.some(
      (n) => n.role !== "forager" && Math.hypot(n.x + 14, n.z + 27) > 3,
    ),
  );
});
