import test from "node:test";
import assert from "node:assert/strict";
import {
  createState,
  sites,
  distance,
  pickup,
  deposit,
} from "../src/simulation.js";
import { itemScentRoute } from "../src/item-route.js";
import { walkable } from "../src/world.js";

function add(state, kind, point, extra = {}) {
  const item = {
    id: state.nextItem++,
    kind,
    ...point,
    deposited: false,
    ...extra,
  };
  state.items.push(item);
  return item;
}

test("a dropped underground seed is recovered locally instead of visiting the garden", () => {
  const state = createState();
  Object.assign(state.player, sites.home);
  const dropped = add(state, "seed", sites.surface);
  pickup(state, dropped);
  deposit(state, { x: 0, z: -2 });
  add(state, "seed", sites.surface);
  const result = itemScentRoute(state, "seed", walkable);
  assert.equal(result.itemId, dropped.id);
  assert.equal(result.cost, 2);
  assert.deepEqual(result.route, [{ x: 0, z: -2 }]);
});

test("parcel routes stay on real walkable ground between distant chambers", () => {
  for (const start of Object.values(sites)) {
    for (const end of [{ x: -16.3, z: -29.7 }, sites.surface, sites.eastRest]) {
      const state = createState();
      Object.assign(state.player, start);
      add(state, "soil", end);
      const result = itemScentRoute(state, "soil", walkable);
      assert.ok(result, `${start.name} to ${JSON.stringify(end)}`);
      let previous = start;
      for (const point of result.route) {
        const count = Math.max(1, Math.ceil(distance(previous, point) / 0.025));
        for (let i = 0; i <= count; i++) {
          const t = i / count;
          assert.ok(
            walkable(
              previous.x + (point.x - previous.x) * t,
              previous.z + (point.z - previous.z) * t,
            ),
          );
        }
        previous = point;
      }
      assert.deepEqual(result.route.at(-1), { x: end.x, z: end.z });
    }
  }
});

test("claimed, carried, falling, deposited and unreachable loads cannot attract a duty route", () => {
  const state = createState();
  Object.assign(state.player, sites.home);
  add(state, "soil", sites.home, { owner: 0 });
  add(state, "soil", sites.home, { deposited: true });
  add(state, "soil", sites.home, { fallHeight: 0.4 });
  const carried = add(state, "soil", sites.home);
  pickup(state, carried);
  add(state, "soil", { x: 100, z: 100 });
  const available = add(state, "soil", sites.dig);
  assert.equal(itemScentRoute(state, "soil", walkable).itemId, available.id);
  available.owner = 1;
  assert.equal(itemScentRoute(state, "soil", walkable), null);
});
