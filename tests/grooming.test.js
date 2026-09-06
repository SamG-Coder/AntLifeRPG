import test from "node:test";
import assert from "node:assert/strict";
import { startGrooming, advanceGrooming } from "../src/grooming.js";
import { createState, tick, validateState } from "../src/simulation.js";

test("grooming cleans gradually, survives save serialization and completes once", () => {
  const state = createState();
  state.player.cleanliness = 40;
  assert.ok(startGrooming(state.player));
  advanceGrooming(state.player, 3);
  assert.equal(state.player.cleanliness, 55);
  const restored = JSON.parse(JSON.stringify(state));
  assert.ok(validateState(restored));
  advanceGrooming(restored.player, 20);
  assert.equal(restored.player.cleanliness, 80);
  assert.equal(restored.player.groomingBouts, 1);
  advanceGrooming(restored.player, 20);
  assert.equal(restored.player.groomingBouts, 1);
  restored.player.groomRemaining = -1;
  assert.equal(validateState(restored), false);
});
test("carriers and attached players cannot begin grooming", () => {
  assert.equal(startGrooming({ cargo: 12 }), false);
  assert.equal(startGrooming({ carrying: 12 }), false);
  assert.equal(startGrooming({ attachment: {} }), false);
});
test("idle workers groom after work while urgent needs take priority", () => {
  const state = createState();
  for (let iz = 0; iz < 3; iz++)
    for (let iy = 0; iy < 2; iy++)
      for (let ix = 0; ix < 7; ix++) state.removed.push(`${ix}:${iy}:${iz}`);
  for (let i = 0; i < 600; i++) tick(state, 0.5);
  assert.ok(state.npcs.some((n) => n.groomingBouts > 0));
  const worker = state.npcs.find((n) => n.groomingBouts > 0);
  worker.groomRemaining = 5;
  worker.hunger = 10;
  tick(state, 0.1);
  assert.equal(worker.groomRemaining, 0);
});
