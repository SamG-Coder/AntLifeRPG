import test from "node:test";
import assert from "node:assert/strict";
import { createState, greet, tick } from "../src/simulation.js";
import { clearScentPath } from "../src/colony-social.js";

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
  assert.equal(n.trust, 0);
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
  n.workVersion = 1;
  for (let i = 0; i < 57; i++) tick(s, 0.05);
  assert.equal(greet(s, n), false);
  assert.equal(n.trust, 1);
  s.player.x += 10;
  tick(s, 0.05);
  assert.equal(n.greetingRemaining, 0);
});

test("blocked and interrupted player greetings do not award memories or trust", () => {
  const s = createState(),
    n = s.npcs[0];
  n.x = s.player.x;
  n.z = s.player.z + 1;
  n.workVersion = 1;
  assert.equal(
    greet(s, n, (a, b) =>
      clearScentPath(
        a,
        b,
        (_x, _y, z) => 0.1 - Math.abs(z - 1.5),
        () => 0,
      ),
    ),
    null,
  );
  assert.equal(greet(s, n), true);
  tick(s, 1);
  assert.equal(n.trust, 0);
  tick(s, 0.1, { canMeet: () => false });
  assert.equal(n.greetingRemaining, 0);
  assert.equal(n.memories.length, 0);
  n.x = s.player.x;
  n.z = s.player.z + 1;
  assert.equal(greet(s, n), true);
  s.player.x += 10;
  tick(s, 3);
  assert.equal(n.trust, 0);
});
