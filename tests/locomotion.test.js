import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three/webgpu";
import { solveKnee } from "../src/math.js";
test("leg solver preserves both bone lengths for reachable foot contacts", () => {
  for (let i = 0; i < 40; i++) {
    const hip = new Vector3(0.2, 0.45, -0.2),
      foot = new Vector3(
        0.45 + i * 0.008,
        Math.sin(i) * 0.025,
        -0.4 + i * 0.02,
      ),
      knee = solveKnee(hip, foot, new Vector3(1, 0.9, 0.1));
    assert.ok(Math.abs(hip.distanceTo(knee) - 0.57) < 1e-8);
    assert.ok(Math.abs(foot.distanceTo(knee) - 0.57) < 1e-8);
  }
});
