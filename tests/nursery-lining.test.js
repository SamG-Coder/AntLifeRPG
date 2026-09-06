import test from "node:test";
import assert from "node:assert/strict";
import {
  createState,
  tick,
  pickup,
  deposit,
  validateState,
} from "../src/simulation.js";
import {
  advanceNurseryLining,
  nurseryLiningProgress,
  nurseryLeafPlace,
} from "../src/nursery-lining.js";
import { ensureBedding } from "../src/bedding.js";
import { collectableItem, itemScentRoute } from "../src/item-route.js";
import { currentDuty } from "../src/duties.js";
import { walkable } from "../src/world.js";

function clearedState() {
  const s = createState();
  for (let x = 0; x < 7; x++)
    for (let y = 0; y < 5; y++)
      for (let z = 0; z < 3; z++) s.removed.push(`${x}:${y}:${z}`);
  s.nurseryCleared = { day: 1, time: 420, playerLoads: 0, crewLoads: 105 };
  return s;
}

test("clearing starts one persistent lining project with separate personal and colony leaves", () => {
  const unopened = createState();
  advanceNurseryLining(unopened);
  assert.equal(unopened.nurseryLining, undefined);
  const s = clearedState();
  ensureBedding(s);
  advanceNurseryLining(s);
  const saved = JSON.parse(JSON.stringify(s));
  advanceNurseryLining(saved);
  assert.deepEqual(saved, s);
  assert.ok(validateState(saved));
  assert.equal(saved.items.length, 10);
  const trail = itemScentRoute(saved, "nursery-leaf", walkable);
  assert.ok(trail);
  const leaf = saved.items.find((i) => i.id === trail.itemId);
  assert.ok(collectableItem(saved, leaf, "nursery-leaf"));
  assert.equal(collectableItem(saved, leaf, "leaf"), false);
  assert.equal(currentDuty(saved).id, "line-nursery");
  saved.items.at(-1).nurserySlot = 0;
  assert.equal(validateState(saved), false);
});

test("player nursery leaf delivery credits only its real destination and cannot be counted twice", () => {
  const s = clearedState();
  advanceNurseryLining(s);
  const leaf = s.items[0];
  assert.ok(pickup(s, leaf));
  assert.equal(currentDuty(s).destination, "dig");
  assert.ok(deposit(s, { x: 0, z: 0 }));
  assert.equal(leaf.homePlaced, false);
  assert.equal(leaf.deposited, false);
  assert.equal(nurseryLiningProgress(s).player, 0);
  assert.ok(pickup(s, leaf));
  assert.ok(deposit(s, nurseryLeafPlace(0)));
  assert.equal(pickup(s, leaf), false);
  assert.equal(deposit(s, nurseryLeafPlace(0)), false);
  assert.equal(nurseryLiningProgress(s).player, 1);
  assert.equal(s.player.deliveries, 0);
  assert.equal(s.colony.food, 45);
  assert.ok(validateState(s));
  leaf.x = 0;
  assert.equal(validateState(s), false);
});

test("actual excavation crew lines the chamber, preserving leaf ownership across a mid-haul reload", () => {
  let s = createState();
  ensureBedding(s);
  let resumed = false;
  for (let step = 0; step < 8000 && !s.nurseryLining?.completedDay; step++) {
    tick(s, 0.25, { canWalk: walkable });
    if (
      !resumed &&
      s.items.some((i) => i.nurserySlot !== undefined && i.owner != null)
    ) {
      s = JSON.parse(JSON.stringify(s));
      assert.ok(validateState(s));
      resumed = true;
    }
  }
  assert.ok(resumed);
  assert.equal(s.colony.soilDelivered, 105);
  assert.ok(s.nurseryLining.completedDay);
  assert.deepEqual(nurseryLiningProgress(s), {
    placed: 6,
    player: 0,
    crew: 6,
    available: 0,
  });
  for (const leaf of s.items.filter((i) => i.nurserySlot !== undefined)) {
    assert.deepEqual(
      { x: leaf.x, z: leaf.z },
      nurseryLeafPlace(leaf.nurserySlot),
    );
    assert.ok(walkable(leaf.x, leaf.z));
    assert.equal(leaf.owner, null);
  }
  assert.ok(
    s.items
      .filter((i) => i.kind === "leaf" && i.nurserySlot === undefined)
      .every((i) => !i.deposited && i.owner == null),
  );
  assert.ok(validateState(s));
});
