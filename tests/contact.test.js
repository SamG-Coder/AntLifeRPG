import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three/webgpu";
import {
  projectContact,
  clipToFreeSpace,
  transportHeading,
} from "../src/contact.js";
const near = (a, b, tolerance = 1e-4) =>
  assert.ok(a.distanceTo(b) < tolerance, `${a.toArray()} != ${b.toArray()}`);

test("contacts project onto floors, walls and ceilings with free-space normals", () => {
  for (const [density, point, expected, normal] of [
    [
      (_x, y) => -y,
      new Vector3(1, 0.4, 2),
      new Vector3(1, 0, 2),
      new Vector3(0, 1, 0),
    ],
    [
      (x) => x - 2,
      new Vector3(1.6, 1, 0),
      new Vector3(2, 1, 0),
      new Vector3(-1, 0, 0),
    ],
    [
      (_x, y) => y - 3,
      new Vector3(1, 2.6, 2),
      new Vector3(1, 3, 2),
      new Vector3(0, -1, 0),
    ],
  ]) {
    const result = projectContact(density, point);
    assert.ok(result);
    near(result.position, expected);
    near(result.normal, normal);
  }
});
test("non-distance fields converge and unreachable or flat fields fail explicitly", () => {
  const density = (x, y, z) => 4 * (1 - x * x - y * y - z * z);
  const result = projectContact(density, new Vector3(1.4, 0, 0));
  near(result.position, new Vector3(1, 0, 0));
  near(result.normal, new Vector3(1, 0, 0));
  assert.equal(
    projectContact(() => 1, new Vector3()),
    null,
  );
  assert.equal(
    projectContact((_x, y) => -y, new Vector3(0, 4, 0)),
    null,
  );
});
test("camera segments stop before walls even when both endpoints are free", () => {
  const slab = (x) => 0.2 - Math.abs(x);
  const result = clipToFreeSpace(
    slab,
    new Vector3(-2, 1, 0),
    new Vector3(2, 1, 0),
  );
  assert.ok(result.x < -0.4499 && result.x > -0.451);
  assert.ok(slab(result.x) < -0.25);
  const floor = (_x, y) => -y;
  const corrected = clipToFreeSpace(
    floor,
    new Vector3(0, 0.1, 0),
    new Vector3(1, 0.5, 0),
  );
  assert.ok(corrected.y >= 0.25);
});
test("heading transports from floor through wall onto ceiling without losing tangency", () => {
  let forward = new Vector3(1, 0, 0),
    normal = new Vector3(0, 1, 0);
  for (let i = 1; i <= 180; i++) {
    const angle = (i * Math.PI) / 180,
      next = new Vector3(-Math.sin(angle), Math.cos(angle), 0);
    const moved = transportHeading(forward, normal, next);
    assert.ok(Math.abs(moved.dot(next)) < 1e-8);
    assert.ok(moved.dot(forward) > 0.999);
    forward = moved;
    normal = next;
  }
  near(forward, new Vector3(-1, 0, 0));
});
