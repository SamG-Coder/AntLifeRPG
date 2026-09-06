import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three/webgpu";
import { surfaceSupport, canStartRecovery } from "../src/support.js";
import { attachSurface, moveOnSurface } from "../src/surface-motor.js";

test("support finds reachable feet on both sides of floor and ceiling poses", () => {
  for (const sign of [-1, 1]) {
    const frame = {
      position: new Vector3(),
      normal: new Vector3(0, sign, 0),
      forward: new Vector3(0, 0, -1),
    };
    const support = surfaceSupport((_x, y) => -sign * y, frame);
    assert.ok(support.supported);
    assert.equal(support.contacts.length, 6);
  }
});
test("climbing rejects a body-clear pose supported on only one side", () => {
  const floor = (_x, y) => -y,
    ledge = (x, y) => Math.min(x, -y);
  const frame = attachSurface(floor, new Vector3(), new Vector3(0, 0, -1));
  assert.equal(surfaceSupport(ledge, frame).supported, false);
  const next = moveOnSurface(floor, frame, 0.1, 0, ledge);
  assert.ok(next.position.distanceTo(frame.position) < 1e-6);
});
test("recovery scheduling permits one active step and stays within the swing tripod", () => {
  const legs = Array.from({ length: 6 }, (_, i) => ({
    swing: i % 2 === 0,
    recovery: null,
  }));
  assert.equal(canStartRecovery(legs, 0, true), true);
  assert.equal(canStartRecovery(legs, 1, true), false);
  assert.equal(canStartRecovery(legs, 1, false), true);
  legs[2].recovery = {};
  assert.equal(canStartRecovery(legs, 0, false), false);
});
