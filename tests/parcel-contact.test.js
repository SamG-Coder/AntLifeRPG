import test from "node:test";
import assert from "node:assert/strict";
import { clearParcelPath } from "../src/parcel-contact.js";
import {
  createState,
  pickup,
  deposit,
  validateState,
} from "../src/simulation.js";
import { prepareLoadDrop } from "../src/load-interaction.js";

test("terrain blocks a nearby pickup and a drop without changing cargo ownership", () => {
  const s = createState();
  const item = { id: s.nextItem++, kind: "seed", x: 0, z: 0, deposited: false };
  s.items.push(item);
  const wall = (_x, _y, z) => 0.12 - Math.abs(z - 0.5);
  const reach = (p) => clearParcelPath(s.player, p, wall, () => 0);
  assert.equal(reach(item), false);
  assert.equal(pickup(s, item, reach), false);
  assert.equal(s.player.carrying, null);
  assert.ok(pickup(s, item));
  const place = (_item, p) => reach(p);
  const drop = prepareLoadDrop(s, place);
  assert.equal(drop.blocked, true);
  assert.equal(deposit(s, drop.position, place), false);
  assert.equal(s.player.carrying, item.id);
  assert.equal(item.deposited, false);
  assert.equal(s.colony.food, 45);
});

test("clear slopes and raised supports allow transfer while excessive reach does not", () => {
  const worker = { x: 0, z: 0 },
    item = { x: 1, z: 0, kind: "leaf" };
  const height = (x) => x * 0.3;
  assert.ok(clearParcelPath(worker, item, (x, y) => height(x) - y, height));
  assert.equal(
    clearParcelPath(worker, { ...item, x: 3 }, () => -1, height),
    false,
  );
  const s = createState();
  s.items.push({
    id: s.nextItem++,
    kind: "seed",
    x: 0,
    z: 1,
    deposited: false,
  });
  pickup(s, s.items[0]);
  deposit(s, { x: 0, z: 0, supportOffset: 0.45 });
  const saved = JSON.parse(JSON.stringify(s));
  assert.equal(saved.items[0].supportOffset, 0.45);
  assert.ok(validateState(saved));
  saved.items[0].supportOffset = -1;
  assert.equal(validateState(saved), false);
});
