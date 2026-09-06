import test from "node:test";
import assert from "node:assert/strict";
import {
  updateWorkerEncounters,
  clearScentPath,
} from "../src/colony-social.js";
import { createState, tick, validateState } from "../src/simulation.js";
import { restingPlace } from "../src/colony-layout.js";

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

function groomingPair() {
  const state = pairState();
  const [a, b] = state.npcs;
  for (const [worker, other] of [
    [a, b],
    [b, a],
  ]) {
    Object.assign(worker, {
      task: "off-duty",
      path: [],
      cleanliness: 50,
      bonds: [{ id: other.id, meetings: 1, lastDay: 1 }],
    });
  }
  return state;
}

test("idle acquaintances groom together, retain progress in saves and complete once per day", () => {
  let state = groomingPair();
  // A recent scent exchange must not force both workers to finish solo grooming first.
  state.npcs[0].socialCooldown = state.npcs[1].socialCooldown = 40;
  updateWorkerEncounters(state, 0.1);
  assert.equal(state.npcs[0].encounterKind, "groom");
  updateWorkerEncounters(state, 2);
  state = JSON.parse(JSON.stringify(state));
  assert.ok(validateState(state));
  assert.equal(state.npcs[0].cleanliness, 60);
  updateWorkerEncounters(state, 6);
  for (const n of state.npcs.slice(0, 2)) {
    assert.equal(n.cleanliness, 90);
    assert.equal(n.groomingBouts, 1);
    assert.equal(n.sharedGroomingBouts, 1);
    assert.equal(n.bonds[0].meetings, 1);
    n.socialCooldown = 0;
    n.cleanliness = 50;
  }
  updateWorkerEncounters(state, 0.1);
  assert.equal(state.npcs[0].encounterRemaining, 0);
  state.day++;
  updateWorkerEncounters(state, 0.1);
  assert.equal(state.npcs[0].encounterKind, "groom");
});

test("work, hunger and obstruction interrupt shared grooming without completion credit", () => {
  for (const reason of ["work", "hunger", "obstruction"]) {
    const state = groomingPair();
    updateWorkerEncounters(state, 0.1);
    updateWorkerEncounters(state, 1);
    if (reason === "hunger") state.npcs[0].hunger = 10;
    updateWorkerEncounters(
      state,
      0.1,
      () => reason !== "obstruction",
      () => reason === "work",
    );
    for (const n of state.npcs.slice(0, 2)) {
      assert.equal(n.encounterRemaining, 0);
      assert.equal(n.groomRemaining, 0);
      assert.equal(n.sharedGroomingBouts, undefined);
      assert.equal(n.groomingBouts, undefined);
      assert.equal(n.cleanliness, 55);
    }
  }
});

test("the colony scheduler starts shared grooming at adjacent beds and resumes for a loose load", () => {
  const state = createState();
  for (let z = 0; z < 3; z++)
    for (let y = 0; y < 5; y++)
      for (let x = 0; x < 7; x++) state.removed.push(`${x}:${y}:${z}`);
  for (const n of state.npcs) {
    const bed = restingPlace(n.id);
    Object.assign(n, {
      workVersion: 1,
      x: bed.x,
      z: bed.z,
      task: "off-duty",
      destination: bed.chamber,
      path: [],
      socialCooldown: 100,
      cleanliness: 100,
    });
  }
  const a = state.npcs[0],
    b = state.npcs[2];
  for (const [n, other] of [
    [a, b],
    [b, a],
  ]) {
    n.cleanliness = 40;
    n.bonds = [{ id: other.id, meetings: 1, lastDay: 1 }];
  }
  tick(state, 0.1);
  assert.equal(a.encounterKind, "groom");
  tick(state, 1);
  state.items.push({
    id: state.nextItem++,
    kind: "soil",
    x: -16,
    z: -28,
    owner: null,
    deposited: false,
  });
  tick(state, 0.1);
  assert.equal(a.encounterRemaining, 0);
  assert.equal(a.groomRemaining, 0);
  assert.equal(a.task, "commute");
  assert.ok(a.path.length > 0);
  assert.equal(a.sharedGroomingBouts, undefined);
  assert.ok(validateState(state));
});
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
