import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three/webgpu";
import { resolveFollowCamera } from "../src/follow-camera.js";

test("follow camera preserves the requested orbit in open space", () => {
  const target = new Vector3(0, 1, 0),
    forward = new Vector3(0, 0, -1),
    up = new Vector3(0, 1, 0);
  const result = resolveFollowCamera(
    (_x, y) => -y,
    target,
    forward,
    up,
    5,
    0.2,
    1,
  );
  assert.equal(result.offset, 0);
  assert.ok(
    result.position.distanceTo(new Vector3(0, 2.1 + Math.sin(0.2) * 5, 5)) <
      1e-6,
  );
});

test("a close rear wall selects a clear side view with a collision-free sightline", () => {
  for (const sign of [1, -1]) {
    const target = new Vector3(0, sign, 0),
      forward = new Vector3(0, 0, -1),
      up = new Vector3(0, sign, 0);
    const density = (_x, y, z) => Math.max(-sign * y, z - 1);
    const result = resolveFollowCamera(density, target, forward, up, 5, 0.2);
    assert.ok(result.clearance > 2.4);
    assert.notEqual(result.offset, 0);
    for (let i = 0; i <= 100; i++) {
      const p = target.clone().lerp(result.position, i / 100);
      assert.ok(density(...p.toArray()) < -0.2499);
    }
    const stable = resolveFollowCamera(
      density,
      target,
      forward,
      up,
      5,
      0.2,
      result.offset,
    );
    assert.equal(stable.offset, result.offset);
  }
});

test("a low tunnel lowers the follow orbit instead of crowding the ant", () => {
  const target = new Vector3(0, 0.63, 0);
  const density = (_x, y) => Math.max(-y, y - 2.2);
  const result = resolveFollowCamera(
    density,
    target,
    new Vector3(0, 0, -1),
    new Vector3(0, 1, 0),
    5.5,
    0.28,
  );
  assert.equal(result.offset, 0);
  assert.equal(result.lift, 0.35);
  assert.ok(result.clearance > 5);
  assert.ok(density(...result.position.toArray()) < -0.25);
});
