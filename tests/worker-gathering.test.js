import test from "node:test";
import assert from "node:assert/strict";
import {
  createState,
  tick,
  pickup,
  deposit,
  validateState,
} from "../src/simulation.js";
import { walkable } from "../src/world.js";
import { advanceNurseryLining } from "../src/nursery-lining.js";

function waitingCrew(role) {
  const s = createState();
  for (const n of s.npcs.filter((n) => n.role === role)) {
    Object.assign(n, {
      workVersion: 1,
      task: role === "forager" ? "forage" : "collect",
      x: 13,
      z: -27,
      path: [],
      wait: 0,
    });
  }
  return s;
}

function seedGarden() {
  const s = waitingCrew("forager");
  for (let i = 0; i < 9; i++)
    s.items.push({
      id: s.nextItem++,
      kind: "seed",
      x: 10 + (i % 3) * 2,
      z: -31 - Math.floor(i / 3),
      deposited: false,
    });
  tick(s, 0.05, { canWalk: walkable });
  return s;
}

test("walking foragers choose distinct seeds without taking cargo or consuming the player reserve", () => {
  const s = seedGarden();
  const targets = s.npcs
    .filter((n) => n.gatherItem != null)
    .map((n) => n.gatherItem);
  assert.equal(targets.length, 6);
  assert.equal(new Set(targets).size, 6);
  assert.ok(
    s.items.filter((i) => i.kind === "seed").every((i) => i.owner == null),
  );
  assert.equal(
    s.items.filter((i) => i.kind === "seed" && !targets.includes(i.id)).length,
    3,
  );
  assert.ok(validateState(JSON.parse(JSON.stringify(s))));
});

test("a player can take a targeted seed and the resumed worker releases it without duplicate ownership", () => {
  let s = seedGarden();
  const worker = s.npcs.find((n) => n.gatherItem != null);
  const id = worker.gatherItem;
  assert.ok(
    pickup(
      s,
      s.items.find((i) => i.id === id),
    ),
  );
  s = JSON.parse(JSON.stringify(s));
  assert.ok(validateState(s));
  tick(s, 0.05, { canWalk: walkable });
  assert.equal(s.player.carrying, id);
  assert.ok(s.npcs.every((n) => n.gatherItem !== id && n.cargo !== id));
  assert.ok(validateState(s));
});

test("meal breaks release targets, and moving a loose target updates its approach", () => {
  const s = seedGarden();
  const worker = s.npcs.find((n) => n.gatherItem != null);
  const id = worker.gatherItem;
  assert.ok(
    pickup(
      s,
      s.items.find((i) => i.id === id),
    ),
  );
  assert.ok(deposit(s, { x: 13, z: -29 }));
  tick(s, 0.05, { canWalk: walkable });
  assert.deepEqual(worker.path.at(-1), { x: 13, z: -29 });
  worker.hunger = 1;
  tick(s, 0.05, { canWalk: walkable });
  assert.equal(worker.gatherItem, null);
  assert.equal(worker.task, "off-duty");
});

test("nursery carriers spread across six leaf targets and legacy saves need no target migration", () => {
  const s = waitingCrew("carrier");
  s.nurseryCleared = { day: 1, time: 420, playerLoads: 0, crewLoads: 105 };
  advanceNurseryLining(s);
  assert.ok(validateState(s));
  tick(s, 0.05, { canWalk: walkable });
  const workers = s.npcs.filter(
    (n) => n.role === "carrier" && n.gatherItem != null,
  );
  assert.equal(workers.length, 6);
  assert.equal(new Set(workers.map((n) => n.gatherItem)).size, 6);
  const saved = JSON.parse(JSON.stringify(s));
  assert.ok(validateState(saved));
  saved.npcs[2].gatherItem = saved.npcs[5].gatherItem;
  assert.equal(validateState(saved), false);
});
