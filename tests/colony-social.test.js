import test from "node:test";
import assert from "node:assert/strict";
import { updateWorkerEncounters } from "../src/colony-social.js";
import { createState, tick, validateState } from "../src/simulation.js";

function pairState() {
  const state = createState();
  for (const n of state.npcs) {
    n.workVersion = 1;
    n.socialCooldown = 100;
  }
  for (const [i, x] of [
    [0, -10],
    [1, -12],
  ])
    Object.assign(state.npcs[i], {
      x,
      z: -21,
      socialCooldown: 0,
      hunger: 90,
      task: "commute",
      path: [{ x: -8, z: -19 }],
    });
  return state;
}
test("nearby workers pause with cargo intact, then remember each other symmetrically", () => {
  const state = pairState(),
    a = state.npcs[0],
    b = state.npcs[1];
  a.cargo = 999;
  a.task = "carry";
  state.items.push({
    id: 999,
    kind: "soil",
    owner: a.id,
    x: a.x,
    z: a.z,
    deposited: false,
  });
  state.nextItem = 1000;
  tick(state, 0.1);
  assert.equal(a.encounterPartner, b.id);
  assert.equal(b.encounterPartner, a.id);
  assert.equal(a.x, -10);
  assert.equal(a.cargo, 999);
  assert.equal(a.path.length, 1);
  updateWorkerEncounters(state, 3);
  assert.deepEqual(a.bonds, [{ id: b.id, meetings: 1, lastDay: 1 }]);
  assert.deepEqual(b.bonds, [{ id: a.id, meetings: 1, lastDay: 1 }]);
  assert.equal(a.trust, 0);
  assert.ok(validateState(JSON.parse(JSON.stringify(state))));
  a.socialCooldown = b.socialCooldown = 0;
  updateWorkerEncounters(state, 0.1);
  assert.equal(a.encounterRemaining, 0);
  state.day++;
  updateWorkerEncounters(state, 0.1);
  updateWorkerEncounters(state, 3);
  assert.equal(a.bonds[0].meetings, 2);
});
test("urgent hunger and player greetings cancel encounters without awarding familiarity", () => {
  for (const change of [
    (n) => (n.hunger = 10),
    (n) => (n.greetingRemaining = 2),
  ]) {
    const state = pairState(),
      a = state.npcs[0],
      b = state.npcs[1];
    updateWorkerEncounters(state, 0.1);
    change(a);
    updateWorkerEncounters(state, 0.1);
    assert.equal(a.encounterRemaining, 0);
    assert.equal(b.encounterRemaining, 0);
    assert.equal(a.bonds, undefined);
    assert.equal(b.bonds, undefined);
  }
});
test("social encounters stay bounded and invalid bond identities fail save validation", () => {
  const state = pairState();
  for (const n of state.npcs) {
    n.x = 0;
    n.z = 0;
    n.socialCooldown = 0;
  }
  updateWorkerEncounters(state, 0.1);
  assert.ok(state.npcs.filter((n) => n.encounterRemaining > 0).length <= 4);
  state.npcs[0].bonds = [{ id: 999, meetings: 1, lastDay: 1 }];
  assert.equal(validateState(state), false);
});
