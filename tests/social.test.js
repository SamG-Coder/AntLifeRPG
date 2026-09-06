import test from "node:test";
import assert from "node:assert/strict";
import { createState, greet, tick } from "../src/simulation.js";

test("greeting pauses an owned delivery, preserves its route and resumes work", () => {
  const s = createState();
  const n = s.npcs[0];
  s.npcs = [n];
  Object.assign(n, {
    x: -10,
    z: -21,
    workVersion: 1,
    task: "carry",
    cargo: 1,
    path: [{ x: -8, z: -19 }],
    wait: 0,
  });
  Object.assign(s.player, { x: -10, z: -20 });
  s.items = [
    { id: 1, kind: "soil", owner: n.id, x: n.x, z: n.z, deposited: false },
  ];
  assert.equal(greet(s, n), true);
  tick(s, 1);
  assert.equal(n.x, -10);
  assert.equal(n.z, -21);
  assert.equal(n.cargo, 1);
  assert.equal(n.path.length, 1);
  assert.equal(greet(s, n), null);
  for (let i = 0; i < 100; i++) tick(s, 0.05);
  assert.equal(s.colony.soilDelivered, 1);
  assert.equal(s.items[0].owner, null);
  assert.equal(n.trust, 1);
});

test("greetings require proximity and never grant repeated daily trust", () => {
  const s = createState();
  const n = s.npcs[0];
  assert.equal(greet(s, n), null);
  n.x = s.player.x;
  n.z = s.player.z + 1.5;
  assert.equal(greet(s, n), true);
  n.greetingRemaining = 0;
  assert.equal(greet(s, n), false);
  assert.equal(n.trust, 1);
  s.player.x += 10;
  tick(s, 0.05);
  assert.equal(n.greetingRemaining, 0);
});
