import test from "node:test";
import assert from "node:assert/strict";
import { Mesh, SphereGeometry, Vector3 } from "three/webgpu";
import { cameraEllipsoid, cameraCapsule } from "../src/camera-props.js";
import { clipToFreeSpace } from "../src/contact.js";

test("camera envelopes follow translated rotated and stretched seed meshes", () => {
  const mesh = new Mesh(new SphereGeometry(1, 12, 8));
  mesh.position.set(2, 1, 3);
  mesh.scale.set(1, 0.7, 2);
  mesh.rotation.y = Math.PI / 2;
  const density = cameraEllipsoid(mesh);
  assert.ok(density(2, 1, 3) > 0);
  assert.ok(density(3.8, 1, 3) > 0);
  assert.ok(density(2, 1, 4.2) < 0);
  const position = clipToFreeSpace(
    density,
    new Vector3(-3, 1, 3),
    new Vector3(2, 1, 3),
  );
  assert.ok(position.x < 0);
  assert.ok(density(...position.toArray()) < -0.2499);
});

test("large root capsules obstruct camera paths and recover an enclosed camera target", () => {
  const density = cameraCapsule(
    new Vector3(0, -2, 0),
    new Vector3(0, 2, 0),
    0.5,
  );
  const clipped = clipToFreeSpace(
    density,
    new Vector3(-2, 0, 0),
    new Vector3(2, 0, 0),
  );
  assert.ok(clipped.x < -0.7499);
  const escaped = clipToFreeSpace(
    density,
    new Vector3(0.2, 0, 0),
    new Vector3(2, 0, 0),
  );
  assert.ok(density(...escaped.toArray()) < -0.25);
});
