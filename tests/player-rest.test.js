import test from "node:test";
import assert from "node:assert/strict";
import {
  createState,
  restAtHome,
  tick,
  validateState,
} from "../src/simulation.js";
import { walkable } from "../src/world.js";

test("rest advances two hours with one nutrition cost and the same colony evolution", () => {
  const state = createState();
  state.player.energy = 30;
  const other = JSON.parse(JSON.stringify(state));
  const result = restAtHome(state, { canWalk: walkable });
  for (let i = 0; i < 600; i++) tick(other, 0.25, { canWalk: walkable });
  assert.equal(result.ok, true);
  assert.ok(Math.abs(state.time - 540) < 1e-8);
  assert.ok(Math.abs(state.player.hunger - 82.4) < 1e-8);
  assert.equal(state.player.energy, 100);
  assert.deepEqual(state.npcs, other.npcs);
  assert.deepEqual(state.items, other.items);
  assert.deepEqual(state.colony, other.colony);
  assert.ok(validateState(state));
});

test("rest rejects a held load or a distant bed without advancing the colony", () => {
  for (const player of [{ carrying: 99 }, { x: 10 }, { attachment: {} }]) {
    const s = createState();
    Object.assign(s.player, player);
    const before = JSON.stringify(s);
    assert.equal(restAtHome(s).ok, false);
    assert.equal(JSON.stringify(s), before);
  }
});

test("rest crossing dawn produces one supply and lets its seeds land", () => {
  const s = createState();
  s.day = 2;
  s.time = 300;
  const result = restAtHome(s, { canWalk: walkable });
  assert.equal(result.arrivals, 19);
  assert.equal(s.foodSupply.lastDay, 2);
  assert.ok(
    s.items.filter((i) => i.kind === "seed").every((i) => i.fallHeight === 0),
  );
  assert.equal(restAtHome(s).arrivals, 0);
});
