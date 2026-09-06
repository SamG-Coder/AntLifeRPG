export function ensureBedding(state) {
  if (!state.home || typeof state.home !== "object")
    state.home = { decorations: 0 };
  if (state.home.beddingInitialized) return;
  state.home.beddingInitialized = true;
  for (let i = 0; i < 4; i++)
    state.items.push({
      id: state.nextItem++,
      kind: "leaf",
      x: 11 + i * 1.1,
      z: -27 - (i % 2) * 1.4,
      deposited: false,
      yaw: i * 1.7,
    });
}

export function beddingCount(state) {
  return state.items.filter((i) => i.kind === "leaf" && i.homePlaced).length;
}

export function validBedding(state) {
  return (
    (state.home?.beddingInitialized === undefined ||
      typeof state.home.beddingInitialized === "boolean") &&
    state.items.every(
      (i) =>
        (i.yaw === undefined || Number.isFinite(i.yaw)) &&
        (i.homePlaced === undefined || typeof i.homePlaced === "boolean") &&
        (!i.homePlaced ||
          (i.kind === "leaf" &&
            !i.deposited &&
            i.owner == null &&
            i.id !== state.player?.carrying &&
            Math.hypot(i.x, i.z) < 4.5)),
    )
  );
}
