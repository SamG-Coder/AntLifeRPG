import test from "node:test";
import assert from "node:assert/strict";
import { createState, tick, pickup } from "../src/simulation.js";
test("workers excavate and deliver conserved soil into the shared world", () => {
  const s = createState();
  for (let i = 0; i < 6000; i++) tick(s, 0.05);
  assert.ok(s.removed.length > 0);
  assert.equal(
    s.items.filter((i) => i.kind === "soil").length,
    s.removed.length,
  );
  assert.ok(s.colony.soilDelivered > 0);
  assert.equal(
    s.items.filter((i) => i.kind === "soil" && i.deposited).length,
    s.colony.soilDelivered,
  );
  const loads = s.npcs.map((n) => n.cargo).filter(Boolean);
  assert.equal(new Set(loads).size, loads.length);
  for (const n of s.npcs.filter((n) => n.cargo)) {
    const item = s.items.find((i) => i.id === n.cargo);
    assert.equal(item.owner, n.id);
    assert.equal(pickup(s, item), false);
  }
});
test("foragers transport actual seeds while leaving introductory gathering available", () => {
  const s = createState();
  for (let i = 0; i < 9; i++)
    s.items.push({
      id: s.nextItem++,
      kind: "seed",
      x: 13 + (i % 3) * 0.3,
      z: -31 - Math.floor(i / 3) * 0.3,
      deposited: false,
    });
  for (let i = 0; i < 6000; i++) tick(s, 0.05);
  assert.ok(s.colony.seedsDelivered > 0);
  assert.equal(s.items.filter((i) => i.kind === "seed").length, 9);
  assert.ok(
    s.items.filter((i) => i.kind === "seed" && !i.deposited && i.owner == null)
      .length >= 3,
  );
});
