import { deliveryDestination } from "./simulation.js";

export function prepareLoadDrop(state, canPlace = () => true) {
  const player = state.player;
  const item = state.items.find((i) => i.id === player.carrying);
  if (!item) return null;
  const position = {
    x: player.x - Math.sin(player.yaw),
    z: player.z - Math.cos(player.yaw),
  };
  const destination = deliveryDestination(item, position);
  const blocked = !canPlace(item, position);
  return {
    item,
    position,
    destination,
    blocked,
    text: blocked
      ? "E · No clear space for your load — turn or move away"
      : destination === "dig"
        ? "E · Lay leaf lining in the nursery"
        : destination === "home"
          ? "E · Lay out your leaf bedding"
          : destination === "spoil"
            ? "E · Deposit soil in the spoil bed"
            : destination === "store"
              ? "E · Deliver seed to the store"
              : "E · Put down your load",
  };
}

export function loadDropMessage(item) {
  if (item.nurserySlot !== undefined && item.deposited)
    return "A softer nursery floor. Your leaf stays here as part of the chamber lining.";
  if (item.homePlaced)
    return "A leaf scrap of your own. Lift it again whenever you want to rearrange your chamber.";
  if (!item.deposited) return "You set down your load.";
  return item.kind === "seed"
    ? "Your seed joins the communal store. One more food portion for the colony."
    : "A little more room for the colony. Your crew notices.";
}
