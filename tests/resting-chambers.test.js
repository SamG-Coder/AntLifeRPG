import test from "node:test";
import assert from "node:assert/strict";
import { createState, tick, distance, sites } from "../src/simulation.js";
import { restingPlace } from "../src/colony-layout.js";
import { field } from "../src/world.js";
import { scentRoute } from "../src/navigation.js";

test("all resting places have body clearance and connected walkable routes", () => {
  const places = Array.from({ length: 24 }, (_, i) => restingPlace(i));
  for (const [i, p] of places.entries()) {
    assert.ok(field(p.x, p.z) < -1.4);
    for (const q of places.slice(i + 1)) assert.ok(distance(p, q) > 2.6);
    for (const origin of Object.values(sites)) {
      const route = [origin, ...scentRoute(origin, p.chamber), p];
      for (let j = 1; j < route.length; j++)
        for (let t = 0; t <= 1; t += 0.02) {
          const a = route[j - 1],
            b = route[j];
          assert.ok(field(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t) < -0.4);
        }
    }
  }
});

test("saved idle crews leave the store for their individual beds", () => {
  const s = createState();
  for (let z = 0; z < 3; z++)
    for (let y = 0; y < 2; y++)
      for (let x = 0; x < 7; x++) s.removed.push(`${x}:${y}:${z}`);
  for (const n of s.npcs)
    Object.assign(n, {
      workVersion: 1,
      task: "off-duty",
      destination: "store",
      path: [],
      x: Math.cos(n.id) * 3,
      z: -14 + Math.sin(n.id) * 3,
    });
  for (let i = 0; i < 4000; i++) tick(s, 0.05);
  for (const n of s.npcs) {
    assert.ok(distance(n, sites.store) > 7);
    assert.ok(
      distance(n, restingPlace(n.id)) < 0.5,
      `${n.name} did not settle at its bed`,
    );
  }
});
