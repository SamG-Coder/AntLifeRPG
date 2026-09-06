import test from "node:test";
import assert from "node:assert/strict";
import { workerStep } from "../src/worker-steering.js";
import { walkable } from "../src/world.js";
import { createState, tick } from "../src/simulation.js";

test("a colony with terrain-constrained steering delivers every nursery parcel", () => {
  const state = createState();
  state.player.x = 0;
  state.player.z = -14;
  for (let i = 0; i < 1800; i++) tick(state, 0.5, { canWalk: walkable });
  assert.equal(state.removed.length, 105);
  assert.equal(state.colony.soilDelivered, 105);
  assert.equal(
    state.items.filter((i) => i.kind === "soil" && !i.deposited).length,
    0,
  );
  assert.ok(state.npcs.every((n) => walkable(n.x, n.z)));
});

test("the nursery footprint includes every excavation parcel and displaced workers recover", () => {
  for (let x = 0; x < 7; x++)
    for (let z = 0; z < 3; z++)
      assert.ok(walkable(-16.3 + x * 0.67, -28.5 - z * 0.6));
  const n = { id: 0, x: 2.2, z: 0 },
    target = { x: 0, z: 4 };
  for (let i = 0; i < 200; i++)
    Object.assign(
      n,
      workerStep(n, target, 0.05, [n], null, (x) => Math.abs(x) < 1.8),
    );
  assert.ok(Math.abs(n.x) < 1.8);
  assert.ok(Math.hypot(n.x, n.z - 4) < 0.1);
});

test("opposing workers pass with lateral clearance and reach their destinations", () => {
  const a = { id: 0, x: -4, z: 0 },
    b = { id: 1, x: 4, z: 0 };
  const targets = [
    { x: 4, z: 0 },
    { x: -4, z: 0 },
  ];
  let minimum = Infinity;
  for (let i = 0; i < 500; i++) {
    for (const [n, target] of [
      [a, targets[0]],
      [b, targets[1]],
    ]) {
      const d = Math.hypot(n.x - target.x, n.z - target.z);
      if (d > 0.1)
        Object.assign(
          n,
          workerStep(
            n,
            target,
            Math.min(0.05, d),
            [a, b],
            null,
            (_x, z) => Math.abs(z) < 2,
          ),
        );
    }
    minimum = Math.min(minimum, Math.hypot(a.x - b.x, a.z - b.z));
  }
  assert.ok(minimum > 1.1, `closest approach ${minimum}`);
  assert.ok(Math.hypot(a.x - 4, a.z) < 0.15);
  assert.ok(Math.hypot(b.x + 4, b.z) < 0.15);
});

test("steering goes around a standing player without leaving a narrow walkable corridor", () => {
  const n = { id: 0, x: 0, z: -4 },
    target = { x: 0, z: 4 },
    player = { x: 0, z: 0 };
  let minimum = Infinity;
  for (let i = 0; i < 500; i++) {
    const d = Math.hypot(n.x, n.z - 4);
    if (d > 0.1)
      Object.assign(
        n,
        workerStep(
          n,
          target,
          Math.min(0.05, d),
          [n],
          player,
          (x) => Math.abs(x) < 1.8,
        ),
      );
    assert.ok(Math.abs(n.x) < 1.8);
    minimum = Math.min(minimum, Math.hypot(n.x, n.z));
  }
  assert.ok(minimum > 1.1);
  assert.ok(Math.hypot(n.x, n.z - 4) < 0.15);
});
