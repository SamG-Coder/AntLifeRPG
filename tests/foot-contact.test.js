import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three/webgpu";
import { reachableFoot } from "../src/foot-contact.js";
import { solveLeg } from "../src/math.js";

test("overextended and collapsed targets preserve both leg lengths", () => {
  const hip = new Vector3(1, 2, 3);
  for (const target of [
    new Vector3(8, -4, 2),
    hip.clone(),
    new Vector3(1, 1, 3),
  ]) {
    const { knee, ankle } = solveLeg(hip, target, new Vector3(1, 1, 0));
    assert.ok(Math.abs(knee.distanceTo(hip) - 0.66) < 1e-6);
    assert.ok(Math.abs(knee.distanceTo(ankle) - 0.66) < 1e-6);
    assert.ok(ankle.distanceTo(hip) <= 1.32);
  }
});

test("a bend direction parallel to the leg still produces a finite folded knee", () => {
  const hip = new Vector3(),
    target = new Vector3(0, 0.4, 0);
  const { knee, ankle } = solveLeg(hip, target, new Vector3(0, 1, 0));
  assert.ok(Math.abs(knee.distanceTo(hip) - 0.66) < 1e-6);
  assert.ok(Math.abs(knee.distanceTo(ankle) - 0.66) < 1e-6);
});

test("unreachable nominal foot placement finds closer floor, wall and ceiling contacts", () => {
  for (const [density, hip, preferred] of [
    [(_x, y) => -y, new Vector3(0, 0.9, 0), new Vector3(2, 0, 0)],
    [(x) => -x, new Vector3(0.9, 0, 0), new Vector3(0, 2, 0)],
    [(_x, y) => y, new Vector3(0, -0.9, 0), new Vector3(2, 0, 0)],
  ]) {
    const foot = reachableFoot(density, hip, preferred);
    assert.ok(foot);
    assert.ok(foot.distanceTo(hip) <= 1.24);
    assert.ok(Math.abs(density(...foot.toArray()) + 0.025) < 1e-5);
  }
  assert.equal(
    reachableFoot((_x, y) => -y, new Vector3(0, 3, 0), new Vector3()),
    null,
  );
});
