import { scentRoute } from "./navigation.js";
import { updateNeeds, breakReason, onDuty } from "./daily-life.js";
import { restingPlace } from "./colony-layout.js";
import { startGrooming, advanceGrooming } from "./grooming.js";
import { updateWorkerEncounters } from "./colony-social.js";

export function soilCellPosition(id) {
  const [ix, iy, iz] = id.split(":").map(Number);
  return { x: -16.3 + ix * 0.67, y: iy * 0.58 + 0.2, z: -28.5 - iz * 0.6 };
}

function go(n, destination, position) {
  n.path = scentRoute(n, destination);
  if (["home", "store", "spoil"].includes(destination) && n.path.length) {
    const end = n.path.at(-1),
      angle = n.id * 2.39996;
    n.path[n.path.length - 1] = {
      x: end.x + Math.cos(angle) * 1.35,
      z: end.z + Math.sin(angle) * 1.35,
    };
  }
  if (position) n.path.push(position);
  n.destination = destination;
}

function restAwayFromWork(n) {
  const place = restingPlace(n.id);
  if (n.breakReason === "meal") go(n, "store");
  else {
    go(n, place.chamber, { x: place.x, z: place.z });
  }
  n.cell = null;
  n.task = "off-duty";
}

function hasDigWork(state) {
  for (let iz = 0; iz < 3; iz++)
    for (let iy = 0; iy < 2; iy++)
      for (let ix = 0; ix < 7; ix++)
        if (!state.removed.includes(`${ix}:${iy}:${iz}`)) return true;
  return false;
}

/** NPC cargo refers to the same persistent item table used by the player. */
export function updateColony(state, dt, { sites, distance, excavate }) {
  state.colony ??= { soilDelivered: 0, seedsDelivered: 0, food: 45 };
  updateWorkerEncounters(state, dt);
  for (const n of state.npcs) {
    if (!n.workVersion) {
      n.workVersion = 1;
      n.cargo = null;
      n.task = "commute";
      n.wait = n.id * 0.3;
      go(n, n.role === "forager" ? "surface" : "dig");
    }
    updateNeeds(n, dt);
    if (n.encounterRemaining > 0) continue;
    if (n.greetingRemaining > 0) {
      n.groomRemaining = 0;
      n.greetingRemaining = Math.max(0, n.greetingRemaining - dt);
      if (distance(n, state.player) > 3) n.greetingRemaining = 0;
      else continue;
    }
    n.breakReason = breakReason(n, state.time);
    if (n.breakReason || n.greetingRemaining > 0) n.groomRemaining = 0;
    // An empty store must not strand every hungry forager in a food deadlock.
    if (
      n.breakReason === "meal" &&
      state.colony.food === 0 &&
      n.role === "forager" &&
      onDuty(n, state.time) &&
      !n.recovering
    )
      n.breakReason = null;
    // Finish an owned delivery before leaving work; uncut cells can be released.
    if (!n.cargo && n.breakReason && n.task !== "off-duty") {
      restAwayFromWork(n);
      n.wait = 0;
    }
    if (!n.cargo && n.task === "off-duty") {
      const expected =
        n.breakReason === "meal" ? "store" : restingPlace(n.id).chamber;
      if (n.destination !== expected) restAwayFromWork(n);
      else if (expected !== "store" && !n.path?.length) {
        const bed = restingPlace(n.id);
        if (distance(n, bed) > 0.35) n.path = [{ x: bed.x, z: bed.z }];
      }
    }
    if (n.wait > 0) {
      n.wait -= dt;
      continue;
    }
    if (n.path?.length) {
      const target = n.path[0],
        d = distance(n, target);
      // Junctions are areas to pass through, not a point every worker must occupy.
      if (d < (n.path.length > 1 ? 2 : 0.25)) {
        n.path.shift();
        continue;
      }
      const step = Math.min(d, dt * (n.cargo ? 1.05 : 1.35));
      n.x += ((target.x - n.x) / d) * step;
      n.z += ((target.z - n.z) / d) * step;
      if (n.cargo) {
        const item = state.items.find((i) => i.id === n.cargo);
        if (item) {
          item.x = n.x;
          item.z = n.z;
        }
      }
      continue;
    }
    if (n.cargo) {
      const item = state.items.find((i) => i.id === n.cargo);
      const destination = item?.kind === "seed" ? "store" : "spoil";
      if (item && distance(n, sites[destination]) < 2) {
        item.x = n.x + ((n.id % 3) - 1) * 0.18;
        item.z = n.z;
        item.deposited = true;
        item.owner = null;
        n.cargo = null;
        if (item.kind === "seed") {
          state.colony.seedsDelivered++;
          state.colony.food++;
        } else state.colony.soilDelivered++;
        n.task = "rest";
        n.wait = 4 + (n.id % 5);
        go(n, n.role === "forager" ? "surface" : "dig");
      } else go(n, destination);
      continue;
    }
    if (n.task === "off-duty") {
      if (
        n.hunger < 35 &&
        state.colony.food > 0 &&
        distance(n, sites.store) < 5
      ) {
        state.colony.food--;
        n.hunger = Math.min(100, n.hunger + 55);
        n.meals = (n.meals ?? 0) + 1;
        n.lastMealDay = state.day;
        n.breakReason = breakReason(n, state.time);
        restAwayFromWork(n);
        continue;
      }
      if (n.breakReason) continue;
      const looseLoad = state.items.some(
        (i) =>
          i.kind === "soil" &&
          !i.deposited &&
          i.owner == null &&
          i.id !== state.player.carrying,
      );
      const seeds = state.items.filter(
        (i) =>
          i.kind === "seed" &&
          !i.deposited &&
          i.owner == null &&
          i.id !== state.player.carrying,
      ).length;
      if (n.role === "forager" ? seeds > 3 : looseLoad || hasDigWork(state)) {
        n.groomRemaining = 0;
        n.task = "commute";
        go(n, n.role === "forager" ? "surface" : "dig");
      } else {
        if (n.cleanliness < 85 && !(n.groomRemaining > 0)) startGrooming(n);
        advanceGrooming(n, dt);
      }
      continue;
    }
    if (n.role === "forager") {
      // Leave a few unclaimed seeds so a new player can learn gathering.
      const available = state.items.filter(
        (i) =>
          i.kind === "seed" &&
          !i.deposited &&
          i.owner == null &&
          i.id !== state.player.carrying,
      );
      if (available.length <= 3) {
        restAwayFromWork(n);
        continue;
      }
      const item = available.sort((a, b) => distance(n, a) - distance(n, b))[0];
      if (distance(n, item) > 1) {
        n.path = [{ x: item.x, z: item.z }];
        n.task = "forage";
        continue;
      }
      item.owner = n.id;
      n.cargo = item.id;
      n.task = "carry";
      go(n, "store");
      continue;
    }
    const loose = state.items
      .filter(
        (i) =>
          i.kind === "soil" &&
          !i.deposited &&
          i.owner == null &&
          i.id !== state.player.carrying,
      )
      .sort((a, b) => distance(n, a) - distance(n, b))[0];
    if (loose && distance(n, loose) < 6) {
      if (distance(n, loose) > 1) {
        n.path = [{ x: loose.x, z: loose.z }];
        n.task = "collect";
      } else {
        loose.owner = n.id;
        n.cargo = loose.id;
        n.task = "carry";
        go(n, "spoil");
      }
      continue;
    }
    if (n.role === "carrier") {
      if (!hasDigWork(state) && !loose) {
        restAwayFromWork(n);
        continue;
      }
      n.wait = 3;
      n.task = "await-load";
      continue;
    }
    if (n.task !== "excavate") {
      // The crew begins at the left edge, leaving the central face to the player.
      let cell = null;
      for (let iz = 0; iz < 3 && !cell; iz++)
        for (let iy = 0; iy < 2 && !cell; iy++)
          for (let ix = 0; ix < 7 && !cell; ix++) {
            const id = `${ix}:${iy}:${iz}`;
            if (
              !state.removed.includes(id) &&
              !state.npcs.some((other) => other.cell === id)
            ) {
              cell = id;
            }
          }
      if (!cell) {
        restAwayFromWork(n);
        continue;
      }
      n.cell = cell;
      const p = soilCellPosition(cell);
      n.path = [{ x: p.x, z: p.z + 0.85 }];
      n.task = "excavate";
      n.wait = 1;
      continue;
    }
    const p = soilCellPosition(n.cell);
    const item = excavate(state, n.cell, { x: p.x, z: p.z + 0.65, y: 0 });
    n.cell = null;
    n.task = "loosen";
    n.wait = 10 + (n.id % 6);
    if (item) {
      item.owner = n.id;
      n.cargo = item.id;
      go(n, "spoil");
    }
  }
  // Resolve local crowd overlap without changing IDs, jobs or carried ownership.
  for (let i = 0; i < state.npcs.length; i++)
    for (let j = i + 1; j < state.npcs.length; j++) {
      const a = state.npcs[i],
        b = state.npcs[j],
        d = distance(a, b);
      if (d < 1.4) {
        const dx = d > 0.001 ? (a.x - b.x) / d : (i + j) % 2 ? 1 : -1,
          dz = d > 0.001 ? (a.z - b.z) / d : 0;
        const push = Math.min(0.04, (1.4 - d) * 0.2) * Math.min(1, dt * 20);
        a.x += dx * push;
        a.z += dz * push;
        b.x -= dx * push;
        b.z -= dz * push;
      }
    }
}
