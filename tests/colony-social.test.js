import test from "node:test";
import assert from "node:assert/strict";
import {
  updateWorkerEncounters,
  clearScentPath,
} from "../src/colony-social.js";
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

test("intervening soil prevents and cancels an encounter without awarding a bond", () => {
  const state = pairState(),
    a = state.npcs[0],
    b = state.npcs[1];
  const blocked = (left, right) =>
    clearScentPath(
      left,
      right,
      (x) => 0.15 - Math.abs(x + 11),
      () => 0,
    );
  assert.equal(blocked(a, b), false);
  updateWorkerEncounters(state, 0.1, blocked);
  assert.equal(a.encounterRemaining, undefined);
  updateWorkerEncounters(state, 0.1, () => true);
  assert.ok(a.encounterRemaining > 0);
  updateWorkerEncounters(state, 0.1, blocked);
  assert.equal(a.encounterRemaining, 0);
  assert.equal(a.bonds, undefined);
});

test("a familiar nearby partner wins a close choice without defeating distance or availability", () => {
  const state = pairState(),
    a = state.npcs[0],
    stranger = state.npcs[1],
    friend = state.npcs[2];
  Object.assign(friend, { x: -12.2, z: -21, socialCooldown: 0, hunger: 90 });
  a.bonds = [{ id: friend.id, meetings: 2, lastDay: 1 }];
  state.day = 2;
  updateWorkerEncounters(state, 0.1);
  assert.equal(a.encounterPartner, friend.id);
  assert.equal(stranger.encounterRemaining, undefined);
  for (const adjustment of [
    (friend) => (friend.x = -12.9),
    (friend) => (friend.socialCooldown = 20),
    (_friend, stranger) => (stranger.x = -10.5),
  ]) {
    const otherState = pairState();
    const [worker, otherStranger, otherFriend] = otherState.npcs;
    Object.assign(otherFriend, {
      x: -12.2,
      z: -21,
      socialCooldown: 0,
      hunger: 90,
    });
    worker.bonds = [{ id: otherFriend.id, meetings: 100, lastDay: 1 }];
    otherState.day = 2;
    adjustment(otherFriend, otherStranger);
    updateWorkerEncounters(otherState, 0.1);
    assert.equal(worker.encounterPartner, otherStranger.id);
  }
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
