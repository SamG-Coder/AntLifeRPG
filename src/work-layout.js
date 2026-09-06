export function nurseryWaitingPlace(worker) {
  const slot =
    Math.floor(worker.id / 3) * 2 + (worker.role === "carrier" ? 1 : 0);
  return {
    x: -14 + ((slot % 4) - 1.5) * 1.8,
    z: -24.4 + (Math.floor(slot / 4) - 1.5) * 1.8,
  };
}

export function reserveExcavationCell(state, worker) {
  const occupied = state.npcs
    .filter(
      (n) => n.id !== worker.id && n.cell && !state.removed.includes(n.cell),
    )
    .map((n) => n.cell.split(":").map(Number));
  for (let z = 0; z < 3; z++)
    for (let y = 0; y < 2; y++)
      for (let x = 0; x < 7; x++) {
        const id = `${x}:${y}:${z}`;
        if (state.removed.includes(id)) continue;
        // A worker's body/legs need more width than a single soil parcel.
        if (occupied.some(([ox]) => Math.abs(ox - x) < 3)) continue;
        return id;
      }
  return null;
}
