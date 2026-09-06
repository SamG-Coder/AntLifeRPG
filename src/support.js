import { reachableFoot } from "./foot-contact.js";

// This is a geometric foothold feasibility check, not a force/adhesion model.
export function surfaceSupport(density, frame) {
  const right = frame.forward.clone().cross(frame.normal);
  const up = frame.normal.clone().applyAxisAngle(right, frame.bodyPitch ?? 0);
  const forward = frame.forward
    .clone()
    .applyAxisAngle(right, frame.bodyPitch ?? 0);
  const root = frame.position
    .clone()
    .addScaledVector(frame.normal, frame.bodyLift ?? 0);
  const contacts = [];
  for (const side of [-1, 1])
    for (let index = 0; index < 3; index++) {
      const hip = root
        .clone()
        .addScaledVector(right, side * 0.2)
        .addScaledVector(up, 0.45)
        .addScaledVector(forward, 0.28 - index * 0.25);
      const preferred = root
        .clone()
        .addScaledVector(right, side * 1.03)
        .addScaledVector(forward, 0.82 - index * 0.78);
      const foot = reachableFoot(
        density,
        hip,
        preferred,
        1.24,
        right.clone().multiplyScalar(side),
      );
      if (foot) contacts.push({ side, index, foot });
    }
  const bothSides =
    contacts.some((c) => c.side < 0) && contacts.some((c) => c.side > 0);
  return { contacts, supported: contacts.length >= 3 && bothSides };
}

export function canStartRecovery(legs, index, moving) {
  if (legs.some((leg) => leg.recovery)) return false;
  // During walking, recover in the active swing tripod. At rest, lift one foot.
  return !moving || legs[index].swing;
}
