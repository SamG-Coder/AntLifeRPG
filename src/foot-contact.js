import { projectContact } from "./contact.js";

// Alternate projection onto the soil and the leg's reach sphere. Multiple seeds
// allow a closer patch of a curved wall to replace an unreachable nominal step.
export function reachableFoot(
  density,
  hip,
  preferred,
  maxReach = 1.24,
  outward = null,
) {
  for (const fraction of [0, 0.35, 0.7, 1]) {
    let point = preferred.clone().lerp(hip, fraction);
    for (let i = 0; i < 6; i++) {
      const contact = projectContact(density, point, { maxTravel: 1.5 });
      if (!contact) break;
      point = contact.position.clone().addScaledVector(contact.normal, 0.025);
      if (outward) {
        const side = point.clone().sub(hip).dot(outward);
        if (side < 0.1) {
          point.addScaledVector(outward, 0.1 - side);
          continue;
        }
      }
      if (point.distanceTo(hip) <= maxReach) return point;
      point
        .sub(hip)
        .clampLength(0, maxReach - 0.025)
        .add(hip);
    }
  }
  return null;
}

export function recoveryStep(start, end, normal, elapsed, duration = 0.18) {
  const t = Math.max(0, Math.min(1, elapsed / duration));
  return start
    .clone()
    .lerp(end, t * t * (3 - 2 * t))
    .addScaledVector(normal, Math.sin(t * Math.PI) * 0.1);
}
