import test from "node:test";
import assert from "node:assert/strict";
import {
  createState,
  tick,
  validateState,
  excavate,
  pickup,
} from "../src/simulation.js";
import { advanceSoilStability } from "../src/soil-stability.js";
import { hasWorkerJob } from "../src/colony.js";
import { advanceFoodSupply, reservedSeeds } from "../src/food-supply.js";
import { walkable } from "../src/world.js";
import { nutrition } from "../src/nutrition.js";

test("twenty colony days fund worker and modeled player meals without starvation", () => {
  const s = createState();
  let playerMeals = 0,
    minimum = 100;
  for (let i = 0; i < 144000; i++) {
    tick(s, 0.25, { canWalk: walkable });
    // Model the player's portion demand independently of browser input.
    if (s.player.hunger < 35 && s.colony.food > 0) {
      s.colony.food--;
      s.player.hunger += nutrition.playerMeal;
      playerMeals++;
    }
    minimum = Math.min(minimum, ...s.npcs.map((n) => n.hunger));
  }
  assert.equal(s.day, 21);
  assert.ok(minimum > 30);
  assert.ok(playerMeals >= 30);
  assert.ok(s.colony.food > 0);
  assert.equal(
    s.colony.food,
    45 +
      s.colony.seedsDelivered -
      playerMeals -
      s.npcs.reduce((sum, n) => sum + (n.meals ?? 0), 0),
  );
  assert.ok(s.items.length <= 154); // 105 soil, six nursery leaves, 24 archived-display seeds and 19 loose seeds.
  assert.ok(validateState(s));
});

test("morning supply arrives once, persists across reload and lies on garden ground", () => {
  let s = createState();
  s.day = 2;
  s.time = 359.9;
  assert.equal(advanceFoodSupply(s), 0);
  s.time = 360;
  assert.equal(advanceFoodSupply(s), 19);
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
    advanceSoilStability(s, 2, excavate);
    for (const item of s.items) item.deposited = true;
  }
  assert.ok(s.items.length <= 43);
  assert.equal(s.foodSupply.arrivals, s.foodSupply.archived + s.items.length);
  assert.ok(validateState(s));
  s.foodSupply.lastDay = s.day + 1;
  assert.equal(validateState(s), false);
});

test("new seeds fall, survive a midair reload, and become available only after landing", () => {
  let s = createState();
  s.day = 2;
  s.time = 360;
  advanceFoodSupply(s);
  const ids = s.items.map((i) => i.id);
  assert.ok(s.items.every((i) => i.fallHeight > 0));
  assert.equal(pickup(s, s.items[0]), false);
  assert.equal(hasWorkerJob(s, s.npcs[1]), false);
  advanceSoilStability(s, 0.2, excavate);
  assert.ok(s.items.every((i) => i.fallVelocity < 0));
  s = JSON.parse(JSON.stringify(s));
  assert.ok(validateState(s));
  advanceSoilStability(s, 2, excavate);
  assert.deepEqual(
    s.items.map((i) => i.id),
    ids,
  );
  assert.ok(s.items.every((i) => i.fallHeight === 0 && i.fallVelocity === 0));
  assert.ok(hasWorkerJob(s, s.npcs[1]));
  assert.ok(pickup(s, s.items[0]));
});

test("legacy saves adopt the routine without an immediate duplicate scatter", () => {
  const s = createState();
  delete s.foodSupply;
  s.day = 8;
  s.time = 720;
  assert.equal(advanceFoodSupply(s), 0);
  s.day++;
  assert.equal(advanceFoodSupply(s), 19);
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
