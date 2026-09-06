import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three/webgpu";
import { climbDensity, caveDensity, height } from "../src/world.js";
import { bodyPenetration } from "../src/body-clearance.js";
import {
  attachSurface,
  moveOnSurface,
  serializeFrame,
  restoreFrame,
} from "../src/surface-motor.js";

test("surface motor travels around a curved object through vertical and inverted contacts", () => {
  const sphere = (x, y, z) => 2 - Math.hypot(x, y, z);
  let frame = attachSurface(sphere, new Vector3(0, 2, 0), new Vector3(1, 0, 0));
  let vertical = false,
    inverted = false;
  for (let i = 0; i < 315; i++) {
    const previous = frame;
    frame = moveOnSurface(sphere, frame, 0.04);
    assert.ok(Math.abs(frame.position.length() - 2) < 1e-4);
    assert.ok(Math.abs(frame.forward.dot(frame.normal)) < 1e-7);
    assert.ok(frame.position.distanceTo(previous.position) < 0.041);
    if (Math.abs(frame.normal.y) < 0.02) vertical = true;
    if (frame.normal.y < -0.99) inverted = true;
  }
  assert.ok(vertical && inverted);
  assert.ok(frame.position.distanceTo(new Vector3(0, 2, 0)) < 0.05);
});
test("attached frames survive serialization and reject invalid orientation", () => {
  const f = attachSurface(
    (x) => -x,
    new Vector3(0, 2, 3),
    new Vector3(0, 1, 0),
  );
  assert.deepEqual(
    serializeFrame(restoreFrame(JSON.parse(JSON.stringify(serializeFrame(f))))),
    JSON.parse(JSON.stringify(serializeFrame(f))),
  );
  assert.equal(
    restoreFrame({
      position: [0, 0, 0],
      normal: [0, 0, 0],
      forward: [0, 1, 0],
    }),
    null,
  );
});

test("the actual nest contact field supports floor-to-wall-to-ceiling travel", () => {
  let frame = attachSurface(
    climbDensity,
    new Vector3(0, 0, 0),
    new Vector3(1, 0, 0),
  );
  let wall = false,
    ceiling = false;
  for (let i = 0; i < 500; i++) {
    const before = frame.position;
    frame = moveOnSurface(climbDensity, frame, 0.03, 0, (x, y, z) =>
      Math.max(caveDensity(x, y, z), height(x, z) - y),
    );
    assert.ok(frame.position.distanceTo(before) < 0.12);
    assert.ok(Math.abs(climbDensity(...frame.position.toArray())) < 1e-4);
    assert.ok(
      bodyPenetration(
        (x, y, z) => Math.max(caveDensity(x, y, z), height(x, z) - y),
        frame,
      ) <= 0.0251,
    );
    if (Math.abs(frame.normal.y) < 0.3) wall = true;
    if (frame.normal.y < -0.9) ceiling = true;
  }
  assert.ok(wall && ceiling);
});

test("reverse travel protects the abdomen and keeps clearance posture serializable", () => {
  const floor = (_x, y) => -y,
    obstacle = (x, y) => Math.max(-y, -x - 2);
  let frame = attachSurface(floor, new Vector3(), new Vector3(1, 0, 0));
  for (let i = 0; i < 100; i++)
    frame = moveOnSurface(floor, frame, -0.04, 0, obstacle);
  assert.ok(frame.position.x > -1.1 && frame.position.x < -0.3);
  assert.ok(bodyPenetration(obstacle, frame) <= 0.0251);
  const restored = restoreFrame(
    JSON.parse(JSON.stringify(serializeFrame(frame))),
  );
  assert.equal(restored.bodyLift, frame.bodyLift);
  assert.equal(restored.bodyPitch, frame.bodyPitch);
});

test("body clearance stops surface travel before a separate solid obstacle", () => {
  const floor = (_x, y) => -y,
    obstacle = (x, y) => Math.max(-y, x - 2);
  let f = attachSurface(floor, new Vector3(), new Vector3(1, 0, 0));
  for (let i = 0; i < 100; i++) f = moveOnSurface(floor, f, 0.04, 0, obstacle);
  assert.ok(f.position.x > 0.75 && f.position.x < 1.2);
  assert.ok(bodyPenetration(obstacle, f) < 0.026);
});
