import test from "node:test";
import assert from "node:assert/strict";
import {
  unsupportedSoil,
  advanceSoilStability,
} from "../src/soil-stability.js";
import {
  createState,
  excavate,
  pickup,
  validateState,
} from "../src/simulation.js";

test("adjacent supporting material retains an overhang until its support neighbourhood is removed", () => {
  const holes = ["3:0:1"];
  assert.equal(unsupportedSoil(holes), null);
  holes.push("2:0:1", "4:0:1", "3:0:0", "3:0:2");
  assert.equal(unsupportedSoil(holes), "3:1:1");
});

test("undermined upper parcels become unique falling loads, settle and become collectable", () => {
  let state = createState();
  for (let y = 0; y < 2; y++)
    for (let z = 0; z < 3; z++)
      for (let x = 0; x < 7; x++) state.removed.push(`${x}:${y}:${z}`);
  advanceSoilStability(state, 0.4, excavate);
  assert.equal(state.items.length, 1);
  assert.ok(state.items[0].fallHeight > 0);
  assert.equal(pickup(state, state.items[0]), false);
  state = JSON.parse(JSON.stringify(state));
  assert.ok(validateState(state));
  advanceSoilStability(state, 40, excavate);
  assert.equal(state.removed.length, 105);
  assert.equal(state.soilFalls, 63);
  assert.equal(state.items.length, 63);
  assert.equal(new Set(state.items.map((item) => item.cell)).size, 63);
  assert.ok(
    state.items.every(
      (item) => item.fallHeight === 0 && item.fallVelocity === 0,
    ),
  );
  assert.ok(pickup(state, state.items[0]));
  state.items[1].fallHeight = NaN;
  assert.equal(validateState(state), false);
});

test("falling motion agrees across frame subdivisions and survives a midair save", () => {
  const state = createState();
  const item = excavate(state, "0:4:0", { x: -16.3, z: -28.5 });
  item.fallHeight = 2;
  item.fallVelocity = 0;
  const other = JSON.parse(JSON.stringify(state));
  advanceSoilStability(state, 0.5, excavate);
  for (let i = 0; i < 10; i++) advanceSoilStability(other, 0.05, excavate);
  assert.ok(Math.abs(item.fallHeight - 1.5) < 1e-9);
  assert.ok(Math.abs(item.fallHeight - other.items[0].fallHeight) < 1e-9);
  assert.equal(item.fallVelocity, other.items[0].fallVelocity);
});
