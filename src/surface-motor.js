import { Vector3 } from "three/webgpu";
import { projectContact, transportHeading } from "./contact.js";

export function attachSurface(density, position, forward) {
  const contact = projectContact(density, position, { maxTravel: 0.8 });
  if (!contact) return null;
  const heading = forward
    .clone()
    .addScaledVector(contact.normal, -forward.dot(contact.normal));
  if (heading.lengthSq() < 1e-6) return null;
  return { ...contact, forward: heading.normalize() };
}

export function moveOnSurface(
  density,
  frame,
  distance,
  turn = 0,
  solidDensity = density,
) {
  let result = {
    position: frame.position.clone(),
    normal: frame.normal.clone(),
    forward: frame.forward.clone().applyAxisAngle(frame.normal, turn),
  };
  const penetration = (f) => {
    const right = f.forward.clone().cross(f.normal);
    let maximum = -Infinity;
    for (const along of [-0.75, 0, 0.75])
      for (const side of [-0.22, 0, 0.22]) {
        const body = f.position
          .clone()
          .addScaledVector(f.normal, 0.43)
          .addScaledVector(f.forward, along)
          .addScaledVector(right, side);
        maximum = Math.max(maximum, solidDensity(body.x, body.y, body.z));
      }
    return maximum;
  };
  if (penetration(result) > Math.max(0.025, penetration(frame) + 1e-5))
    result.forward.copy(frame.forward);
  const steps = Math.max(1, Math.ceil(Math.abs(distance) / 0.04));
  for (let i = 0; i < steps; i++) {
    const candidate = result.position
      .clone()
      .addScaledVector(result.forward, distance / steps);
    const contact = projectContact(density, candidate, { maxTravel: 0.2 });
    if (
      !contact ||
      contact.position.distanceTo(result.position) > 0.12 ||
      contact.normal.dot(result.normal) < 0.5
    )
      break;
    const next = {
      ...contact,
      forward: transportHeading(result.forward, result.normal, contact.normal),
    };
    if (penetration(next) > Math.max(0.025, penetration(result) + 1e-5)) break;
    result = next;
  }
  return result;
}

export const serializeFrame = (frame) => ({
  position: frame.position.toArray(),
  normal: frame.normal.toArray(),
  forward: frame.forward.toArray(),
});
export function restoreFrame(value) {
  if (
    !value ||
    ![value.position, value.normal, value.forward].every(
      (v) => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite),
    )
  )
    return null;
  const frame = {
    position: new Vector3().fromArray(value.position),
    normal: new Vector3().fromArray(value.normal),
    forward: new Vector3().fromArray(value.forward),
  };
  if (frame.normal.lengthSq() < 0.5 || frame.forward.lengthSq() < 0.5)
    return null;
  frame.normal.normalize();
  frame.forward.addScaledVector(frame.normal, -frame.forward.dot(frame.normal));
  if (frame.forward.lengthSq() < 1e-6) return null;
  frame.forward.normalize();
  return frame;
}
