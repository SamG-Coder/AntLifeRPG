// A walking target is an intention, not cargo: the player may still lift it.
export function gatherableBy(state, worker, item) {
  return (
    !!item &&
    !item.deposited &&
    !item.homePlaced &&
    item.owner == null &&
    !(item.fallHeight > 0) &&
    item.id !== state.player.carrying &&
    !state.npcs.some(
      (other) => other.id !== worker.id && other.gatherItem === item.id,
    )
  );
}

export function refreshGatherTarget(state, worker) {
  if (worker.gatherItem == null) return;
  const item = state.items.find((i) => i.id === worker.gatherItem);
  if (worker.cargo || !gatherableBy(state, worker, item)) {
    worker.gatherItem = null;
    if (!worker.cargo) worker.path = [];
  } else if (
    worker.path?.length &&
    Math.hypot(worker.path.at(-1).x - item.x, worker.path.at(-1).z - item.z) >
      0.1
  ) {
    worker.path = [];
  }
}

export function validGatherTargets(state) {
  const targets = state.npcs
    .filter((n) => n.gatherItem != null)
    .map((n) => n.gatherItem);
  return (
    targets.every(
      (id) => Number.isInteger(id) && id > 0 && id < state.nextItem,
    ) && new Set(targets).size === targets.length
  );
}
