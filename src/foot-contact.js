import { projectContact } from "./contact.js";

// Alternate projection onto the soil and the leg's reach sphere. Multiple seeds
// allow a closer patch of a curved wall to replace an unreachable nominal step.
export function reachableFoot(density, hip, preferred, maxReach = 1.24) {
  for (const fraction of [0, 0.35, 0.7, 1]) {
    let point = preferred.clone().lerp(hip, fraction);
    for (let i = 0; i < 6; i++) {
      const contact = projectContact(density, point, { maxTravel: 1.5 });
      if (!contact) break;
      point = contact.position.clone().addScaledVector(contact.normal, 0.025);
      if (point.distanceTo(hip) <= maxReach) return point;
      point
        .sub(hip)
        .clampLength(0, maxReach - 0.025)
        .add(hip);
    }
  }
  return null;
}
