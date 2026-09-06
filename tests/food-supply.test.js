import test from "node:test";
import assert from "node:assert/strict";
import { createState, tick, validateState } from "../src/simulation.js";
import { advanceFoodSupply, reservedSeeds } from "../src/food-supply.js";
import { walkable } from "../src/world.js";

test("morning supply arrives once, persists across reload and lies on garden ground", () => {
  let s = createState();
  s.day = 2;
  s.time = 359.9;
  assert.equal(advanceFoodSupply(s), 0);
  s.time = 360;
  assert.equal(advanceFoodSupply(s), 12);
  assert.ok(s.items.every((i) => walkable(i.x, i.z)));
  const ids = s.items.map((i) => i.id);
  s = JSON.parse(JSON.stringify(s));
  assert.ok(validateState(s));
  assert.equal(advanceFoodSupply(s), 0);
  assert.deepEqual(
    s.items.map((i) => i.id),
    ids,
  );
  s.day++;
  assert.equal(advanceFoodSupply(s), 0);
});

test("daily supply caps uncollected parcels and archives only credited seed displays", () => {
  const s = createState();
  for (let day = 2; day <= 60; day++) {
    s.day = day;
    s.time = 360;
    advanceFoodSupply(s);
    for (const item of s.items) item.deposited = true;
  }
  assert.ok(s.items.length <= 36);
  assert.equal(s.foodSupply.arrivals, s.foodSupply.archived + s.items.length);
  assert.ok(validateState(s));
  s.foodSupply.lastDay = s.day + 1;
  assert.equal(validateState(s), false);
});

test("legacy saves adopt the routine without an immediate duplicate scatter", () => {
  const s = createState();
  delete s.foodSupply;
  s.day = 8;
  s.time = 720;
  assert.equal(advanceFoodSupply(s), 0);
  s.day++;
  assert.equal(advanceFoodSupply(s), 12);
});

test("low food releases the teaching reserve and workers deliver an actual seed", () => {
  const s = createState();
  s.colony.food = 0;
  s.items.push({
    id: s.nextItem++,
    kind: "seed",
    x: 13,
    z: -31,
    deposited: false,
  });
  assert.equal(reservedSeeds(s), 0);
  for (let i = 0; i < 1000; i++) tick(s, 0.2, { canWalk: walkable });
  assert.equal(s.colony.seedsDelivered, 1);
  assert.equal(s.items[0].deposited, true);
  assert.equal(s.colony.food, 1);
});
