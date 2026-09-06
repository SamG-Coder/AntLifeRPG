import test from "node:test";
import assert from "node:assert/strict";
import {
  createState,
  tick,
  excavate,
  pickup,
  deposit,
  remember,
  sites,
  validateState,
} from "../src/simulation.js";
test("excavation conserves a clump through pickup and deposition", () => {
  const s = createState();
  const clump = excavate(s, "1,2,3", { x: 1, z: 2 });
  assert.equal(excavate(s, "1,2,3", { x: 1, z: 2 }), null);
  assert.ok(pickup(s, clump));
  assert.equal(pickup(s, clump), false);
  assert.ok(deposit(s, sites.spoil));
  assert.equal(s.items.length, s.removed.length);
  assert.equal(s.player.deliveries, 1);
  assert.equal(clump.deposited, true);
  assert.equal(pickup(s, clump), false);
});
test("NPC identities survive a colony day and remain finite", () => {
  const s = createState();
  const ids = s.npcs.map((n) => n.id);
  for (let i = 0; i < 20000; i++) tick(s, 0.1);
  assert.equal(s.day, 2);
  assert.deepEqual(
    s.npcs.map((n) => n.id),
    ids,
  );
  assert.ok(s.npcs.every((n) => Number.isFinite(n.x) && Number.isFinite(n.z)));
  assert.ok(s.player.hunger >= 0);
});
test("repeated greeting cannot farm trust within the same day", () => {
  const s = createState(),
    n = s.npcs[0];
  assert.ok(remember(s, n, "greet"));
  assert.equal(remember(s, n, "greet"), false);
  assert.equal(n.trust, 1);
  s.day++;
  assert.ok(remember(s, n, "greet"));
  assert.equal(n.memories.length, 2);
});
test("serialized state retains excavation, relationships and cargo", () => {
  const s = createState();
  const c = excavate(s, "test", { x: 2, z: 3 });
  pickup(s, c);
  remember(s, s.npcs[1], "greet");
  const copy = JSON.parse(JSON.stringify(s));
  assert.ok(validateState(copy));
  assert.deepEqual(copy, s);
  assert.equal(validateState({ version: 0 }), false);
});
test("player seed delivery increases the same food reserve used by the colony", () => {
  const s = createState();
  const seed = {
    id: s.nextItem++,
    kind: "seed",
    x: 13,
    z: -31,
    deposited: false,
  };
  s.items.push(seed);
  pickup(s, seed);
  const food = s.colony.food;
  deposit(s, sites.store);
  assert.equal(s.colony.food, food + 1);
  assert.equal(s.player.seeds, 1);
  assert.equal(deposit(s, sites.store), false);
  assert.equal(s.colony.food, food + 1);
});
