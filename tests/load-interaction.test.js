import test from "node:test";
import assert from "node:assert/strict";
import { createState, deposit, pickup, sites } from "../src/simulation.js";
import { prepareLoadDrop, loadDropMessage } from "../src/load-interaction.js";

function carrying(kind, position, yaw = 0) {
  const state = createState();
  Object.assign(state.player, position, { yaw });
  const item = { id: state.nextItem++, kind, ...position, deposited: false };
  state.items.push(item);
  pickup(state, item);
  return state;
}

test("delivery prompt agrees with the actual drop at both sides of a store boundary", () => {
  for (const [z, yaw, expected] of [
    [-11.5, Math.PI, null],
    [-10.5, 0, "store"],
  ]) {
    const state = carrying("seed", { x: 0, z }, yaw);
    const drop = prepareLoadDrop(state);
    const food = state.colony.food;
    assert.equal(drop.destination, expected);
    deposit(state, drop.position);
    assert.equal(drop.item.deposited, expected === "store");
    assert.equal(state.colony.food, food + (expected ? 1 : 0));
    assert.equal(state.player.seeds, expected ? 1 : 0);
    assert.equal(state.player.carrying, null);
    assert.match(
      loadDropMessage(drop.item),
      expected ? /One more food portion/ : /set down/,
    );
  }
});

test("wrong-kind parcels remain recoverable without promising or awarding a delivery", () => {
  for (const [kind, site] of [
    ["seed", sites.spoil],
    ["soil", sites.store],
  ]) {
    const state = carrying(kind, site);
    const drop = prepareLoadDrop(state);
    assert.equal(drop.destination, null);
    assert.match(drop.text, /Put down/);
    deposit(state, drop.position);
    assert.equal(state.colony.food, 45);
    assert.equal(state.player.seeds, 0);
    assert.equal(state.player.deliveries, 0);
    assert.equal(drop.item.deposited, false);
    assert.match(loadDropMessage(drop.item), /set down/);
    assert.ok(pickup(state, drop.item));
  }
});

test("a soil handoff uses the same placement for its prompt and colony credit", () => {
  const state = carrying("soil", sites.spoil);
  const drop = prepareLoadDrop(state);
  assert.match(drop.text, /Deposit soil/);
  deposit(state, drop.position);
  assert.equal(state.player.deliveries, 1);
  assert.match(loadDropMessage(drop.item), /crew notices/);
  assert.equal(prepareLoadDrop(state), null);
});
