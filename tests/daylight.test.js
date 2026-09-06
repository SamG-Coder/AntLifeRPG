import test from "node:test";
import assert from "node:assert/strict";
import { daylightAt } from "../src/daylight.js";
test("surface daylight follows sunrise, noon, sunset and night", () => {
  assert.equal(daylightAt(0), 0);
  assert.equal(daylightAt(360), 0);
  assert.equal(daylightAt(720), 1);
  assert.ok(daylightAt(1080) < 1e-10);
  assert.equal(daylightAt(1260), 0);
  assert.ok(daylightAt(450) > 0 && daylightAt(450) < 1);
  assert.equal(daylightAt(720 + 1440), 1);
});
