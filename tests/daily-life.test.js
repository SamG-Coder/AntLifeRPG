import test from "node:test";
import assert from "node:assert/strict";
import { createState, tick } from "../src/simulation.js";
import { onDuty } from "../src/daily-life.js";

test("foragers rest at night while underground shifts are staggered within a role", () => {
  assert.equal(onDuty({ id: 1, role: "forager" }, 1200), false);
  assert.equal(onDuty({ id: 1, role: "forager" }, 600), true);
  const crew = [0, 3, 6].map((id) => onDuty({ id, role: "excavator" }, 60));
  assert.ok(crew.includes(true) && crew.includes(false));
});

test("a hungry worker physically returns and consumes exactly one shared portion", () => {
  const s = createState();
  s.npcs = [s.npcs[0]];
  const n = s.npcs[0];
  n.x = -14;
  n.z = -25;
  n.hunger = 20;
  tick(s, 0.05);
  assert.equal(s.colony.food, 45);
  assert.equal(n.task, "off-duty");
  for (let i = 0; i < 1800; i++) tick(s, 0.05);
  assert.equal(n.meals, 1);
  assert.equal(s.colony.food, 44);
  assert.ok(n.hunger > 35);
  const restored = JSON.parse(JSON.stringify(s));
  assert.equal(restored.npcs[0].meals, 1);
});

test("nightfall does not abandon or duplicate an owned load", () => {
  const s = createState();
  s.time = 1200;
  s.npcs = [s.npcs[1]];
  const n = s.npcs[0];
  Object.assign(n, {
    x: 13,
    z: -31,
    workVersion: 1,
    task: "carry",
    cargo: 1,
    path: [],
    hunger: 70,
  });
  s.items = [
    { id: 1, kind: "seed", x: 13, z: -31, owner: n.id, deposited: false },
  ];
  for (let i = 0; i < 2400; i++) tick(s, 0.05);
  assert.equal(s.colony.seedsDelivered, 1);
  assert.equal(s.items[0].deposited, true);
  assert.equal(n.cargo, null);
  assert.equal(n.task, "off-duty");
  assert.ok(Math.hypot(n.x, n.z + 14) < 5);
});

test("hungry foragers can replenish an empty food store", () => {
  const s = createState();
  s.npcs = [s.npcs[1]];
  s.npcs[0].hunger = 20;
  s.colony.food = 0;
  for (let i = 0; i < 5; i++)
    s.items.push({
      id: s.nextItem++,
      kind: "seed",
      x: 13 + i * 0.1,
      z: -31,
      deposited: false,
    });
  for (let i = 0; i < 5000; i++) tick(s, 0.05);
  assert.ok(s.colony.seedsDelivered > 0);
  assert.equal(s.npcs[0].meals, 1);
  assert.equal(s.colony.food, s.colony.seedsDelivered - 1);
});
