import { Vector3, Quaternion } from "three/webgpu";

// Density is positive in solid material. Normals point into traversable space.
export function densityGradient(density, point, epsilon = 0.01) {
  const { x, y, z } = point;
  return new Vector3(
    density(x + epsilon, y, z) - density(x - epsilon, y, z),
    density(x, y + epsilon, z) - density(x, y - epsilon, z),
    density(x, y, z + epsilon) - density(x, y, z - epsilon),
  ).multiplyScalar(0.5 / epsilon);
}

export function projectContact(
  density,
  point,
  { level = 0, maxTravel = 1, iterations = 20 } = {},
) {
  const position = point.clone();
  let travelled = 0;
  for (let i = 0; i < iterations; i++) {
    const value = density(position.x, position.y, position.z) - level;
    const gradient = densityGradient(density, position);
    if (!Number.isFinite(value) || gradient.lengthSq() < 1e-12) return null;
    if (Math.abs(value) < 1e-5)
      return { position, normal: gradient.normalize().negate() };
    const correction = gradient.multiplyScalar(-value / gradient.lengthSq());
    correction.clampLength(0, Math.min(0.25, maxTravel - travelled));
    if (correction.lengthSq() < 1e-14) return null;
    travelled += correction.length();
    position.add(correction);
  }
  return null;
}

/** Bounded sampling handles non-distance implicit fields; features thinner than step need a smaller step. */
export function clipToFreeSpace(
  density,
  start,
  end,
  { level = -0.25, step = 0.08 } = {},
) {
  let origin = start.clone();
  if (density(origin.x, origin.y, origin.z) >= level) {
    const recovery = projectContact(density, origin, {
      level: level - 0.001,
      maxTravel: 1,
    });
    if (!recovery) return origin;
    origin = recovery.position;
  }
  const count = Math.max(1, Math.ceil(origin.distanceTo(end) / step));
  let previous = origin.clone();
  for (let i = 1; i <= count; i++) {
    const point = origin.clone().lerp(end, i / count);
    if (density(point.x, point.y, point.z) >= level) {
      let outside = previous,
        inside = point;
      for (let j = 0; j < 12; j++) {
        const middle = outside.clone().lerp(inside, 0.5);
        if (density(middle.x, middle.y, middle.z) >= level) inside = middle;
        else outside = middle;
      }
      return outside;
    }
    previous = point;
  }
  return end.clone();
}

/** Parallel-transport heading through a changed contact normal, including walls and ceilings. */
export function transportHeading(forward, oldNormal, newNormal) {
  const rotation = new Quaternion().setFromUnitVectors(
    oldNormal.clone().normalize(),
    newNormal.clone().normalize(),
  );
  const tangent = forward.clone().applyQuaternion(rotation);
  tangent.addScaledVector(
    newNormal,
    -tangent.dot(newNormal) / newNormal.lengthSq(),
  );
  return tangent.normalize();
}
