// A short unobstructed transfer path from the worker's head to the parcel.
export function clearParcelPath(
  worker,
  parcel,
  density,
  groundHeight,
  headHeight,
) {
  if (Math.hypot(worker.x - parcel.x, worker.z - parcel.z) > 1.8) return false;
  const fromY = headHeight ?? groundHeight(worker.x, worker.z) + 0.65;
  const toY =
    groundHeight(parcel.x, parcel.z) + (parcel.kind === "leaf" ? 0.09 : 0.2);
  const steps = Math.max(
    1,
    Math.ceil(
      Math.hypot(worker.x - parcel.x, fromY - toY, worker.z - parcel.z) / 0.08,
    ),
  );
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (
      density(
        worker.x + (parcel.x - worker.x) * t,
        fromY + (toY - fromY) * t,
        worker.z + (parcel.z - worker.z) * t,
      ) >= 0
    )
      return false;
  }
  return true;
}
