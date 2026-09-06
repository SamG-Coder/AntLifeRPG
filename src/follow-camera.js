import { clipToFreeSpace } from "./contact.js";

// Keep the requested orbit whenever it has room. In a corner, search around
// the ant's own up axis so the same rule works on walls and ceilings.
export function resolveFollowCamera(
  density,
  target,
  forward,
  up,
  distance,
  pitch,
  previousOffset = 0,
) {
  const sample = (offset, lift = 1) => {
    const direction = forward.clone().applyAxisAngle(up, offset);
    const requested = target
      .clone()
      .addScaledVector(direction, -distance)
      .addScaledVector(up, (Math.sin(pitch) * distance + 1.1) * lift);
    const position = clipToFreeSpace(density, target, requested);
    return { position, offset, lift, clearance: position.distanceTo(target) };
  };
  const direct = sample(0);
  const comfort = Math.min(3.5, distance);
  if (direct.clearance >= comfort) return direct;
  let best = previousOffset ? sample(previousOffset) : direct;
  // A modest switching margin prevents equal left/right openings from flickering.
  const score = (candidate) =>
    Math.min(candidate.clearance, comfort) -
    Math.abs(candidate.offset) * 0.18 -
    (1 - candidate.lift) * 0.12;
  for (const angle of [
    0,
    Math.PI / 6,
    -Math.PI / 6,
    Math.PI / 3,
    -Math.PI / 3,
    Math.PI / 2,
    -Math.PI / 2,
    (Math.PI * 2) / 3,
    (-Math.PI * 2) / 3,
    Math.PI,
  ]) {
    for (const lift of [1, 0.35]) {
      const candidate =
        angle === 0 && lift === 1 ? direct : sample(angle, lift);
      if (score(candidate) > score(best) + 0.18) best = candidate;
    }
  }
  return best;
}
