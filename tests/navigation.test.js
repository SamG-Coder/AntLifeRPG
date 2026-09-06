import test from "node:test";
import assert from "node:assert/strict";
import { scentRoute } from "../src/navigation.js";
import { sites } from "../src/simulation.js";
test("scent route reaches excavation through the communal store", () => {
  const route = scentRoute(sites.home, "dig");
  assert.equal(route[1].name, sites.store.name);
  assert.deepEqual(route.at(-1), { x: -14, z: -27 });
});
test("scent route returns a carrier from dig to spoil without crossing solid soil", () => {
  const route = scentRoute(sites.dig, "spoil");
  assert.equal(route.length, 2);
  assert.deepEqual(route.at(-1), sites.spoil);
});
