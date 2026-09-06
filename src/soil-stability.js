// Initial loose-soil rule: a parcel needs material directly below it or one
// adjacent supporting column. It is not a cohesive-earth stress solver.
export function unsupportedSoil(removed) {
  const holes = new Set(removed);
  for (let y = 1; y < 5; y++)
    for (let z = 0; z < 3; z++)
      for (let x = 0; x < 7; x++) {
        const id = `${x}:${y}:${z}`;
        if (holes.has(id)) continue;
        const supported = [
          [0, 0],
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ].some(([dx, dz]) => {
          const sx = x + dx,
            sz = z + dz;
          return (
            sx >= 0 &&
            sx < 7 &&
            sz >= 0 &&
            sz < 3 &&
            !holes.has(`${sx}:${y - 1}:${sz}`)
          );
        });
        if (!supported) return id;
      }
  return null;
}

export function advanceSoilStability(state, dt, excavate) {
  for (let remaining = dt; remaining > 1e-8;) {
    const step = Math.min(0.05, remaining);
    remaining -= step;
    for (const item of state.items) {
      if (!(item.fallHeight > 0)) continue;
      const velocity = item.fallVelocity ?? 0;
      item.fallHeight = Math.max(
        0,
        item.fallHeight + velocity * step - 2 * step * step,
      );
      item.fallVelocity = item.fallHeight > 0 ? velocity - 4 * step : 0;
    }
    state.soilClock = (state.soilClock ?? 0) + step;
    if (state.soilClock < 0.35) continue;
    state.soilClock -= 0.35;
    const cell = unsupportedSoil(state.removed);
    if (!cell) continue;
    const [x, y, z] = cell.split(":").map(Number);
    const item = excavate(state, cell, {
      x: -16.3 + x * 0.67,
      z: -28.5 - z * 0.6,
    });
    if (item) {
      item.fallHeight = y * 0.58;
      item.fallVelocity = 0;
      state.soilFalls = (state.soilFalls ?? 0) + 1;
    }
  }
}

export function validSoilMotion(state) {
  return (
    (state.soilClock === undefined ||
      (Number.isFinite(state.soilClock) &&
        state.soilClock >= 0 &&
        state.soilClock < 0.350001)) &&
    (state.soilFalls === undefined ||
      (Number.isInteger(state.soilFalls) && state.soilFalls >= 0)) &&
    state.items.every(
      (item) =>
        (item.fallHeight === undefined ||
          (Number.isFinite(item.fallHeight) &&
            item.fallHeight >= 0 &&
            item.fallHeight <= 3)) &&
        (item.fallVelocity === undefined ||
          (Number.isFinite(item.fallVelocity) &&
            item.fallVelocity <= 0 &&
            item.fallVelocity >= -10)) &&
        (!(item.fallHeight > 0) ||
          (item.kind === "soil" &&
            !item.deposited &&
            item.owner == null &&
            item.id !== state.player.carrying)),
    )
  );
}
