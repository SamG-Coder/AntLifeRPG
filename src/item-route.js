import { sites, distance } from "./simulation.js";

export function collectableItem(state, item, kind) {
  return (
    !!item &&
    (kind === "nursery-leaf"
      ? item.kind === "leaf" && item.nurserySlot !== undefined
      : item.kind === kind &&
        (kind !== "leaf" || item.nurserySlot === undefined)) &&
    !item.deposited &&
    !item.homePlaced &&
    item.owner == null &&
    item.id !== state.player.carrying &&
    !(item.fallHeight > 0)
  );
}

function clearGround(a, b, canWalk) {
  const steps = Math.max(1, Math.ceil(distance(a, b) / 0.15));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (!canWalk(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false;
  }
  return true;
}

// Search the small chamber graph, then attach each available parcel to it.
// Parcel ownership stays with the simulation; following a scent is no reservation.
export function itemScentRoute(
  state,
  kind,
  canWalk,
  origin = state.player,
  accept = () => true,
) {
  const nodes = [origin, ...Object.values(sites)];
  const costs = nodes.map(() => Infinity),
    paths = nodes.map(() => []);
  const visited = new Set();
  costs[0] = 0;
  for (let step = 0; step < nodes.length; step++) {
    let next = -1;
    for (let i = 0; i < nodes.length; i++)
      if (
        !visited.has(i) &&
        Number.isFinite(costs[i]) &&
        (next < 0 || costs[i] < costs[next])
      )
        next = i;
    if (next < 0) break;
    visited.add(next);
    for (let i = 1; i < nodes.length; i++) {
      const cost = costs[next] + distance(nodes[next], nodes[i]);
      if (
        visited.has(i) ||
        cost >= costs[i] ||
        !clearGround(nodes[next], nodes[i], canWalk)
      )
        continue;
      costs[i] = cost;
      paths[i] = [...paths[next], { x: nodes[i].x, z: nodes[i].z }];
    }
  }
  let best = null;
  for (const item of state.items) {
    if (!collectableItem(state, item, kind) || !accept(item)) continue;
    for (let i = 0; i < nodes.length; i++) {
      const cost = costs[i] + distance(nodes[i], item);
      if (
        !Number.isFinite(cost) ||
        (best && cost >= best.cost) ||
        !clearGround(nodes[i], item, canWalk)
      )
        continue;
      best = {
        itemId: item.id,
        kind,
        cost,
        route: [...paths[i], { x: item.x, z: item.z }],
      };
    }
  }
  return best;
}
