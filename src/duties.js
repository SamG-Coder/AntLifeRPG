const nurseryCells = [];
for (let x = 0; x < 7; x++)
  for (let y = 0; y < 5; y++)
    for (let z = 0; z < 3; z++) nurseryCells.push(`${x}:${y}:${z}`);

export function nurseryProgress(state) {
  const removed = new Set(state.removed);
  return {
    opened: nurseryCells.filter((id) => removed.has(id)).length,
    loose: state.items.filter((i) => i.kind === "soil" && !i.deposited).length,
    falling: state.items.filter((i) => i.kind === "soil" && i.fallHeight > 0)
      .length,
    collectable: state.items.filter(
      (i) =>
        i.kind === "soil" &&
        !i.deposited &&
        !(i.fallHeight > 0) &&
        i.owner == null &&
        i.id !== state.player.carrying,
    ).length,
  };
}

export function recordNurseryCompletion(state) {
  const progress = nurseryProgress(state);
  if (state.nurseryCleared || progress.opened !== 105 || progress.loose)
    return false;
  state.nurseryCleared = {
    day: state.day,
    time: state.time,
    playerLoads: state.player.deliveries,
    crewLoads: state.colony.soilDelivered,
  };
  return true;
}

export function currentDuty(state) {
  const carried = state.items.find((i) => i.id === state.player.carrying);
  if (carried)
    return {
      id: "deliver",
      title: carried.kind === "seed" ? "Bring food home" : "Finish this load",
      text:
        carried.kind === "seed"
          ? "Carry your seed to the communal store and press E."
          : "Bring soil to the spoil bed. Press E to deposit it.",
      destination: carried.kind === "seed" ? "store" : "spoil",
      progress: "Your mandibles are full.",
    };
  if (state.player.hunger < 35)
    return {
      id: "eat",
      title: "Time for a meal",
      text: "Eat at the communal store before returning to work.",
      destination: "store",
      progress: `${state.colony.food} shared food portions`,
    };
  if (state.player.energy < 25)
    return {
      id: "rest",
      title: "Rest beneath the leaf",
      text: "Return to your chamber and press R at your bed.",
      destination: "home",
      progress: "The crew can carry on while you recover.",
    };
  const p = nurseryProgress(state);
  if (p.opened < 105)
    return {
      id: "excavate",
      title: "A little room to grow",
      text: "Loosen exposed nursery soil with Q, then carry it to the spoil bed.",
      destination: "dig",
      progress: `${p.opened} / 105 parcels loosened · ${state.player.deliveries} loads delivered by you`,
    };
  if (p.loose)
    return {
      id: "clear",
      title: "Clear the nursery floor",
      text:
        p.falling === p.loose
          ? "The last loose parcels are settling. Collect them after they land."
          : p.collectable === 0
            ? "The crew is hauling the last loads. You can watch the nursery or visit your nestmates."
            : "The face is open. Lift loose soil with E and carry it to the spoil bed.",
      destination: "dig",
      progress: `${p.loose} soil loads remain · ${p.falling} falling`,
    };
  const seeds = state.items.filter(
    (i) => i.kind === "seed" && !i.deposited && i.owner == null,
  );
  if (seeds.length)
    return {
      id: "forage",
      title: "Food for the next shift",
      text: "Follow the surface scent, lift a seed with E, and bring it to the store.",
      destination: "surface",
      progress: `Nursery cleared · ${seeds.length} ${seeds.length === 1 ? "seed" : "seeds"} available · ${state.player.seeds} delivered by you`,
    };
  return {
    id: "leisure",
    title: "A moment of your own",
    text: "Visit your nestmates, groom your antennae with L, or explore the colony.",
    destination: "westRest",
    progress: `Nursery cleared · ${state.player.deliveries} soil loads and ${state.player.seeds} seeds delivered by you`,
  };
}

export function validNurseryCompletion(state) {
  const n = state.nurseryCleared;
  return (
    n === undefined ||
    (n &&
      Number.isInteger(n.day) &&
      n.day > 0 &&
      Number.isFinite(n.time) &&
      n.time >= 0 &&
      n.time < 1440 &&
      [n.playerLoads, n.crewLoads].every((v) => Number.isInteger(v) && v >= 0))
  );
}
