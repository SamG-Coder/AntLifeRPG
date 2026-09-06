// A caretaker's daily scatter is a game event in the colony tank.
export function advanceFoodSupply(state) {
  state.foodSupply ??= { lastDay: state.day, arrivals: 0, archived: 0 };
  const supply = state.foodSupply;
  if (state.time < 360 || supply.lastDay >= state.day) return 0;
  supply.lastDay = state.day;
  const loose = state.items.filter(
    (i) => i.kind === "seed" && !i.deposited,
  ).length;
  const count = Math.max(0, 12 - loose);
  for (let i = 0; i < count; i++) {
    const angle = (state.day * 7 + i) * 2.3999632297;
    const radius = 1.2 + (i % 4) * 0.65;
    state.items.push({
      id: state.nextItem++,
      kind: "seed",
      deposited: false,
      x: 13 + Math.cos(angle) * radius,
      z: -31 + Math.sin(angle) * radius,
      y: 0,
    });
  }
  supply.arrivals += count;
  // Delivered parcels have already become portions in the shared reserve.
  // Retain recent display parcels; cumulative delivery counters remain intact.
  const stored = state.items.filter((i) => i.kind === "seed" && i.deposited);
  const archived = new Set(
    stored.slice(0, Math.max(0, stored.length - 24)).map((i) => i.id),
  );
  state.items = state.items.filter((i) => !archived.has(i.id));
  supply.archived += archived.size;
  return count;
}

export function reservedSeeds(state) {
  return (state.colony?.food ?? 45) > 6 ? 3 : 0;
}

export function validFoodSupply(state) {
  const s = state.foodSupply;
  return (
    s === undefined ||
    (!!s &&
      Number.isInteger(s.lastDay) &&
      s.lastDay > 0 &&
      s.lastDay <= state.day &&
      [s.arrivals, s.archived].every((n) => Number.isInteger(n) && n >= 0))
  );
}
