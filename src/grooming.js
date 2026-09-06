export function startGrooming(actor) {
  if (
    actor.carrying != null ||
    actor.cargo != null ||
    actor.attachment ||
    actor.groomRemaining > 0
  )
    return false;
  actor.cleanliness ??= 78;
  actor.groomRemaining = 8;
  return true;
}

export function advanceGrooming(actor, dt) {
  if (!(actor.groomRemaining > 0)) return false;
  const spent = Math.min(dt, actor.groomRemaining);
  actor.cleanliness = Math.min(100, (actor.cleanliness ?? 78) + spent * 5);
  actor.groomRemaining = Math.max(0, actor.groomRemaining - spent);
  if (!actor.groomRemaining) {
    actor.groomingBouts = (actor.groomingBouts ?? 0) + 1;
    return true;
  }
  return false;
}

export function validGrooming(actor) {
  return (
    (actor.cleanliness === undefined ||
      (Number.isFinite(actor.cleanliness) &&
        actor.cleanliness >= 0 &&
        actor.cleanliness <= 100)) &&
    (actor.groomRemaining === undefined ||
      (Number.isFinite(actor.groomRemaining) &&
        actor.groomRemaining >= 0 &&
        actor.groomRemaining <= 8)) &&
    (actor.groomingBouts === undefined ||
      (Number.isInteger(actor.groomingBouts) && actor.groomingBouts >= 0))
  );
}
