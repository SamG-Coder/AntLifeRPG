import test from "node:test";
import assert from "node:assert/strict";
import { excavationDensity } from "../src/excavation-field.js";

test("bounded cavity evaluation preserves the original excavation field inside and outside the face", () => {
  const holes = [],
    removed = [];
  for (let x = 0; x < 7; x++)
    for (let y = 0; y < 5; y++)
      for (let z = 0; z < 3; z++) {
        if ((x + y + z) % 3 === 0) continue;
        removed.push(`${x}:${y}:${z}`);
        holes.push([-16.3 + x * 0.67, y * 0.58 + 0.2, -28.5 - z * 0.6]);
      }
  const density = excavationDensity(removed);
  for (let x = -18; x < -10; x += 0.31)
    for (let y = -1; y < 4; y += 0.29)
      for (let z = -32; z < -26; z += 0.33) {
        let expected = Math.min(
          x + 16.8,
          -11.8 - x,
          y + 0.1,
          3.1 - y,
          z + 30.2,
          -28.12 - z,
        );
        expected += Math.sin(x * 8 + y * 5) * Math.sin(z * 9 - y * 3) * 0.065;
        for (const h of holes)
          expected = Math.min(
            expected,
            Math.hypot(x - h[0], y - h[1], z - h[2]) - 0.56,
          );
        assert.ok(Math.abs(density(x, y, z) - expected) < 1e-12);
      }
});
