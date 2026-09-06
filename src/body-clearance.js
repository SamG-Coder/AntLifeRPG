// Dimensions follow the Blender source in scripts/build_ant.py. Coordinates
// are [side, height, forward]; limbs and flexible antennae are handled separately.
const directions = [];
for (let axis = 0; axis < 3; axis++)
  for (const sign of [-1, 1]) {
    const p = [0, 0, 0];
    p[axis] = sign;
    directions.push(p);
  }
for (const x of [-1, 1])
  for (const y of [-1, 1])
    for (const z of [-1, 1])
      directions.push([x / Math.sqrt(3), y / Math.sqrt(3), z / Math.sqrt(3)]);
export const bodySamples = [
  ...[
    [
      [0, 0.48, -0.94],
      [0.36, 0.32, 0.52],
    ],
    [
      [0, 0.53, 0.68],
      [0.31, 0.26, 0.32],
    ],
    [
      [0, 0.51, 0],
      [0.235, 0.22, 0.45],
    ],
  ].flatMap(([center, radius]) =>
    directions.map((d) => d.map((v, i) => center[i] + v * radius[i])),
  ),
  [-0.12, 0.45, 1.16],
  [0.12, 0.45, 1.16],
];

export function bodyPenetration(density, frame, lift = frame.bodyLift ?? 0) {
  const right = frame.forward.clone().cross(frame.normal);
  const normal = frame.normal
    .clone()
    .applyAxisAngle(right, frame.bodyPitch ?? 0);
  const forward = frame.forward
    .clone()
    .applyAxisAngle(right, frame.bodyPitch ?? 0);
  let maximum = -Infinity;
  for (const [side, height, along] of bodySamples) {
    const p = frame.position
      .clone()
      .addScaledVector(right, side)
      .addScaledVector(frame.normal, lift)
      .addScaledVector(normal, height)
      .addScaledVector(forward, along);
    maximum = Math.max(maximum, density(p.x, p.y, p.z));
  }
  return maximum;
}

// Raise the thorax within leg reach to negotiate a concave contact. The contact
// point stays on the soil; rendering projects the feet back to detailed solids.
export function fitBodyClearance(density, frame) {
  for (const bodyPitch of [0, -0.15, 0.15, -0.3, 0.3, -0.45, 0.45]) {
    const posed = { ...frame, bodyPitch };
    if (bodyPenetration(density, posed, 0) <= 0.024)
      return { ...posed, bodyLift: 0 };
    for (let lift = 0.06; lift <= 0.48001; lift += 0.06) {
      if (bodyPenetration(density, posed, lift) > 0.024) continue;
      let low = lift - 0.06,
        high = lift;
      for (let i = 0; i < 5; i++) {
        const middle = (low + high) / 2;
        if (bodyPenetration(density, posed, middle) > 0.024) low = middle;
        else high = middle;
      }
      return { ...posed, bodyLift: high };
    }
  }
  return null;
}
