import test from "node:test";
import assert from "node:assert/strict";
import { restingPlace, restingChambers } from "../src/colony-layout.js";
import { bodySamples } from "../src/body-clearance.js";
import { walkable } from "../src/world.js";
import { scentRoute } from "../src/navigation.js";

test("resting beds contain the body and nominal feet while leaving a central aisle", () => {
  const feet = [-1, 1].flatMap((side) =>
    [0, 1, 2].map((i) => [side * 1.03, 0, -0.82 + i * 0.78]),
  );
  for (let id = 0; id < 24; id++) {
    const bed = restingPlace(id),
      centre = restingChambers[bed.chamber];
    for (const [side, , along] of [...bodySamples, ...feet]) {
      const x = bed.x + side * Math.cos(bed.yaw) + along * Math.sin(bed.yaw);
      const z = bed.z - side * Math.sin(bed.yaw) + along * Math.cos(bed.yaw);
      assert.ok(walkable(x, z), `worker ${id} contact ${x}, ${z}`);
      assert.ok(Math.abs(z - centre.z) > 1.2);
    }
    for (let other = id + 2; other < 24; other += 2) {
      const b = restingPlace(other);
      if (b.z === bed.z) assert.ok(Math.abs(b.x - bed.x) >= 2.14);
    }
  }
});

test("resting chamber routes use the central aisle before the store corridor", () => {
  for (const [key, centre] of Object.entries(restingChambers)) {
    const outgoing = scentRoute(centre, "store");
    assert.equal(outgoing[1].z, centre.z);
    assert.equal(Math.abs(outgoing[1].x - centre.x), 5);
    const incoming = scentRoute({ x: 0, z: -14 }, key);
    assert.deepEqual(incoming.at(-2), outgoing[1]);
  }
});
