import test from "node:test";
import assert from "node:assert/strict";
import { Mesh, SphereGeometry, Quaternion, Vector3 } from "three/webgpu";
import {
  ellipsoidTop,
  supportedBodyHeight,
  settleGroundHeight,
  stanceHeightCeiling,
} from "../src/prop-support.js";
import { cameraEllipsoid } from "../src/camera-props.js";
import { bodySamples } from "../src/body-clearance.js";

test("seed upper contacts stay on a rotated non-uniform ellipsoid", () => {
  const mesh = new Mesh(new SphereGeometry(0.22));
  mesh.position.set(1, 0.45, -3);
  mesh.scale.set(1, 0.7, 1.9);
  mesh.rotation.set(0.3, 0.7, 0.2);
  const top = ellipsoidTop(mesh),
    solid = cameraEllipsoid(mesh);
  for (const [x, z] of [
    [1, -3],
    [1.05, -3.1],
    [0.95, -2.9],
  ]) {
    const y = top(x, z);
    assert.ok(Number.isFinite(y));
    assert.ok(Math.abs(solid(x, y, z)) < 1e-7);
    assert.ok(solid(x, y + 0.01, z) < 0);
  }
  assert.equal(top(10, 10), -Infinity);
});

test("ground descent settles over time while preserving clearance and stance reach", () => {
  const legs = [
    { hip: new Vector3(0.2, 0.45, 0), foot: new Vector3(1.03, 0, 0) },
  ];
  const rotation = new Quaternion();
  const ceiling = stanceHeightCeiling(0, 0, rotation, legs);
  let y = settleGroundHeight(0.6, 0, 1 / 60, ceiling);
  assert.ok(y > 0 && y < 0.6);
  assert.ok(new Vector3(0.2, y + 0.45, 0).distanceTo(legs[0].foot) <= 1.240001);
  for (let i = 0; i < 90; i++) {
    const next = settleGroundHeight(y, 0, 1 / 60, ceiling);
    assert.ok(next <= y && next >= 0);
    y = next;
  }
  assert.equal(y, 0);
  assert.equal(settleGroundHeight(0, 0.6, 1 / 60, ceiling), 0.6);
  legs[0].swing = true;
  assert.equal(stanceHeightCeiling(0, 0, rotation, legs), Infinity);
});

test("unconstrained settling is independent of frame subdivision", () => {
  const one = settleGroundHeight(0.6, 0.1, 0.1);
  const two = settleGroundHeight(settleGroundHeight(0.6, 0.1, 0.05), 0.1, 0.05);
  assert.ok(Math.abs(one - two) < 1e-12);
});

test("ground posture lifts the sampled body clear of a seed pile without raising bare-floor posture", () => {
  const mesh = new Mesh(new SphereGeometry(0.4));
  mesh.position.set(0, 0.25, 0.8);
  const top = ellipsoidTop(mesh),
    solid = cameraEllipsoid(mesh);
  const support = (x, z) => Math.max(0, top(x, z));
  for (const yaw of [0, 0.5, 1.2, Math.PI]) {
    const rotation = new Quaternion().setFromAxisAngle(
      new Vector3(0, 1, 0),
      yaw,
    );
    const y = supportedBodyHeight(0, 0, 0, rotation, support);
    for (const [side, height, forward] of bodySamples) {
      const p = new Vector3(side, height, -forward).applyQuaternion(rotation);
      assert.ok(solid(p.x, y + p.y, p.z) <= 0);
    }
    assert.equal(supportedBodyHeight(5, 5, 0, rotation, support), 0);
  }
});
