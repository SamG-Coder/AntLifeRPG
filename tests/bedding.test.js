import test from "node:test";
import assert from "node:assert/strict";
import { ensureBedding, beddingCount } from "../src/bedding.js";
import {
  createState,
  pickup,
  deposit,
  validateState,
  sites,
} from "../src/simulation.js";
import { currentDuty } from "../src/duties.js";
import { itemScentRoute } from "../src/item-route.js";
import { walkable } from "../src/world.js";
import { leafScrapGeometry } from "../src/leaf-scrap.js";

test("bedding survives gathering, placement, reload and rearrangement without delivery credit", () => {
  let s = createState();
  ensureBedding(s);
  const ids = s.items.map((i) => i.id);
  ensureBedding(s);
  assert.deepEqual(
    s.items.map((i) => i.id),
    ids,
  );
  assert.ok(s.items.every((i) => walkable(i.x, i.z)));
  const item = s.items[0];
  pickup(s, item);
  assert.equal(currentDuty(s).destination, "home");
  deposit(s, { x: 2, z: 1 });
  assert.equal(beddingCount(s), 1);
  assert.equal(item.deposited, false);
  assert.equal(s.player.deliveries, 0);
  assert.equal(s.player.seeds, 0);
  assert.equal(s.colony.food, 45);
  s = JSON.parse(JSON.stringify(s));
  assert.ok(validateState(s));
  ensureBedding(s);
  assert.equal(s.items.length, 4);
  Object.assign(s.player, sites.home);
  assert.notEqual(itemScentRoute(s, "leaf", walkable).itemId, item.id);
  pickup(s, s.items[0]);
  assert.equal(beddingCount(s), 0);
  deposit(s, { x: -2, z: 2 });
  assert.equal(beddingCount(s), 1);
  assert.deepEqual([s.items[0].x, s.items[0].z], [-2, 2]);
  s.items[0].x = 20;
  assert.equal(validateState(s), false);
});

test("a leaf outside home remains an ordinary recoverable parcel", () => {
  const s = createState();
  ensureBedding(s);
  pickup(s, s.items[0]);
  deposit(s, sites.store);
  assert.equal(beddingCount(s), 0);
  assert.ok(pickup(s, s.items[0]));
  const geometry = leafScrapGeometry();
  assert.ok(
    [
      ...geometry.attributes.position.array,
      ...geometry.attributes.normal.array,
    ].every(Number.isFinite),
  );
  geometry.dispose();
});
