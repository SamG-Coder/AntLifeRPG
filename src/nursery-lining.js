export const nurseryLeafCount = 6;

export function nurseryLeafPlace(slot) {
  return { x: -16 + (slot % 3) * 2, z: -25.5 - Math.floor(slot / 3) * 1.7 };
}

export function advanceNurseryLining(state) {
  if (!state.nurseryCleared) return;
  if (!state.nurseryLining) {
    state.nurseryLining = { startedDay: state.day };
    for (let slot = 0; slot < nurseryLeafCount; slot++)
      state.items.push({
        id: state.nextItem++,
        kind: "leaf",
        nurserySlot: slot,
        x: 10.5 + (slot % 3) * 1.5,
        z: -32.5 - Math.floor(slot / 3) * 1.5,
        yaw: slot * 1.7,
        deposited: false,
      });
  }
  if (
    !state.nurseryLining.completedDay &&
    nurseryLiningProgress(state).placed === nurseryLeafCount
  )
    state.nurseryLining.completedDay = state.day;
}

export function nurseryLiningProgress(state) {
  const leaves = state.items.filter((i) => i.nurserySlot !== undefined);
  return {
    placed: leaves.filter((i) => i.deposited).length,
    player: leaves.filter((i) => i.deposited && i.deliveredBy === "player")
      .length,
    crew: leaves.filter((i) => i.deposited && Number.isInteger(i.deliveredBy))
      .length,
    available: leaves.filter(
      (i) => !i.deposited && i.owner == null && i.id !== state.player.carrying,
    ).length,
  };
}

export function validNurseryLining(state) {
  const leaves = state.items.filter((i) => i.nurserySlot !== undefined);
  const lining = state.nurseryLining;
  if (lining === undefined) return leaves.length === 0;
  return (
    !!lining &&
    !!state.nurseryCleared &&
    Number.isInteger(lining.startedDay) &&
    lining.startedDay > 0 &&
    lining.startedDay <= state.day &&
    (lining.completedDay === undefined ||
      (Number.isInteger(lining.completedDay) &&
        lining.completedDay >= lining.startedDay &&
        lining.completedDay <= state.day &&
        leaves.every((i) => i.deposited))) &&
    leaves.length === nurseryLeafCount &&
    new Set(leaves.map((i) => i.nurserySlot)).size === nurseryLeafCount &&
    leaves.every(
      (i) =>
        i.kind === "leaf" &&
        Number.isInteger(i.nurserySlot) &&
        i.nurserySlot >= 0 &&
        i.nurserySlot < nurseryLeafCount &&
        !i.homePlaced &&
        (!i.deposited ||
          (i.owner == null &&
            i.id !== state.player.carrying &&
            Math.hypot(i.x + 14, i.z + 25) < 4 &&
            (i.deliveredBy === "player" ||
              state.npcs.some((n) => n.id === i.deliveredBy)))),
    )
  );
}
