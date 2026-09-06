import test from "node:test";
import assert from "node:assert/strict";
import { createState, tick, pickup } from "../src/simulation.js";
test("exhausted crews clear the nursery and resume for newly loosened soil", () => {
  const s = createState();
  for (let iz = 0; iz < 3; iz++)
    for (let iy = 0; iy < 2; iy++)
      for (let ix = 0; ix < 7; ix++) s.removed.push(`${ix}:${iy}:${iz}`);
  for (const n of s.npcs) {
    n.x = -14;
    n.z = -26;
  }
  for (let i = 0; i < 2400; i++) tick(s, 0.05);
  assert.ok(s.npcs.every((n) => n.task === "off-duty"));
  assert.ok(s.npcs.every((n) => Math.hypot(n.x + 14, n.z + 25) > 6));
  const id = s.nextItem++;
  s.items.push({ id, kind: "soil", x: -14, z: -27, deposited: false });
  for (let i = 0; i < 2400; i++) tick(s, 0.05);
  assert.equal(s.items.find((i) => i.id === id).deposited, true);
  assert.equal(s.colony.soilDelivered, 1);
});
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
