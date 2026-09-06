import test from "node:test";
import assert from "node:assert/strict";
import { createState, validateState } from "../src/simulation.js";
import { currentDuty, recordNurseryCompletion } from "../src/duties.js";

function openedNursery() {
  const state = createState();
  for (let x = 0; x < 7; x++)
    for (let y = 0; y < 5; y++)
      for (let z = 0; z < 3; z++) state.removed.push(`${x}:${y}:${z}`);
  return state;
}
test("an open face is not completed while loose, falling or carried soil remains", () => {
  const state = openedNursery();
  const item = {
    id: state.nextItem++,
    kind: "soil",
    x: -14,
    z: -28,
    deposited: false,
  };
  state.items.push(item);
  for (const owner of [null, 2]) {
    item.owner = owner;
    assert.equal(recordNurseryCompletion(state), false);
    assert.equal(currentDuty(state).id, "clear");
  }
  item.owner = null;
  item.fallHeight = 1;
  assert.equal(recordNurseryCompletion(state), false);
  item.fallHeight = 0;
  item.deposited = true;
  assert.ok(recordNurseryCompletion(state));
});
test("nursery completion persists once with honest player and crew contribution counts", () => {
  const state = openedNursery();
  state.player.deliveries = 0;
  state.colony.soilDelivered = 105;
  assert.ok(recordNurseryCompletion(state));
  const saved = JSON.parse(JSON.stringify(state));
  assert.ok(validateState(saved));
  assert.equal(saved.nurseryCleared.playerLoads, 0);
  saved.day++;
  assert.equal(recordNurseryCompletion(saved), false);
  assert.equal(saved.nurseryCleared.day, 1);
  saved.nurseryCleared.crewLoads = -1;
  assert.equal(validateState(saved), false);
});
test("duties move from excavation to food and free time, with delivery and needs taking priority", () => {
  const state = createState();
  assert.equal(currentDuty(state).id, "excavate");
  state.removed = openedNursery().removed;
  assert.equal(currentDuty(state).id, "leisure");
  const seed = {
    id: state.nextItem++,
    kind: "seed",
    x: 13,
    z: -31,
    deposited: false,
  };
  state.items.push(seed);
  assert.equal(currentDuty(state).id, "forage");
  state.player.hunger = 10;
  assert.equal(currentDuty(state).id, "eat");
  state.player.carrying = seed.id;
  assert.equal(currentDuty(state).destination, "store");
  seed.kind = "soil";
  assert.equal(currentDuty(state).destination, "spoil");
  state.player.carrying = null;
  state.player.hunger = 80;
  state.player.energy = 10;
  assert.equal(currentDuty(state).id, "rest");
});
