import test from "node:test";
import assert from "node:assert/strict";
import {
  Mesh,
  MeshBasicMaterial,
  DoubleSide,
  Raycaster,
  PerspectiveCamera,
  Vector3,
} from "three/webgpu";
import { implicitSurface } from "../src/terrain.js";
import { CameraRig } from "../src/camera.js";
import { height, caveDensity } from "../src/world.js";

test("sampled collision field agrees with the emitted triangles across tetrahedra", () => {
  const original = (x, y, z) => x * x + y * y * 0.8 + z * z * 0.6 - 1.5;
  const surface = implicitSurface(
    original,
    [
      [0, 0, 0],
      [2, 2, 2],
    ],
    0.4,
  );
  const positions = surface.geometry.attributes.position;
  assert.ok(positions.count > 100);
  for (let i = 0; i < positions.count; i += 3) {
    for (const weights of [
      [1 / 3, 1 / 3, 1 / 3],
      [0.1, 0.3, 0.6],
      [1, 0, 0],
    ]) {
      const p = new Vector3();
      for (let j = 0; j < 3; j++)
        p.addScaledVector(
          new Vector3().fromBufferAttribute(positions, i + j),
          weights[j],
        );
      assert.ok(Math.abs(surface.density(...p.toArray())) < 2e-6);
    }
  }
  for (const x of [-0.01, 2.1])
    assert.equal(surface.density(x, 0.4, 0.8), original(x, 0.4, 0.8));
  assert.ok(Number.isFinite(surface.density(2, 2, 2)));
  surface.geometry.dispose();
});

test("garden camera transition stays clear of rendered cave triangles using their sampled field", () => {
  // Region aligned to the world mesh's [-23, -.1, -42] origin and .42 grid.
  const surface = implicitSurface(
    caveDensity,
    [
      [2.2, -0.1, -31.5],
      [11, 7, -18],
    ],
    0.42,
  );
  const mesh = new Mesh(
    surface.geometry,
    new MeshBasicMaterial({ side: DoubleSide }),
  );
  mesh.updateMatrixWorld();
  function blockedFrames(field) {
    const camera = new PerspectiveCamera(53, 1476 / 1272, 0.04, 130);
    camera.position.set(0, 3, -9);
    const rig = new CameraRig(camera, { addEventListener() {} }, (x, y, z) =>
      Math.max(field(x, y, z), height(x, z) - y),
    );
    let blocked = 0;
    for (let frame = 0; frame < 660; frame++) {
      const t = Math.min(1, frame / 600);
      rig.yaw += (-0.6528 - rig.yaw) / 12;
      rig.update({ x: 13 * t, z: -14 - 17 * t }, 1 / 60);
      camera.updateMatrixWorld();
      const ray = new Raycaster(
        camera.position,
        camera.getWorldDirection(new Vector3()),
        camera.near,
        2,
      );
      if (ray.intersectObject(mesh).length) blocked++;
    }
    return blocked;
  }
  assert.ok(
    blockedFrames(caveDensity) > 0,
    "the former analytical field must reproduce the visible obstruction",
  );
  assert.equal(blockedFrames(surface.density), 0);
  surface.geometry.dispose();
  mesh.material.dispose();
});
