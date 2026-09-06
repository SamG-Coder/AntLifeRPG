import { Vector3 } from "three/webgpu";
import { bodySamples } from "./body-clearance.js";

// Intersect a vertical ray with the transformed source sphere. Unlike a world
// bounding sphere, this retains the seed's rotation and non-uniform scale.
export function ellipsoidTop(mesh) {
  mesh.updateWorldMatrix(true, false);
  mesh.geometry.computeBoundingSphere();
  const inverse = mesh.matrixWorld.clone().invert();
  const { center, radius } = mesh.geometry.boundingSphere;
  const e = inverse.elements;
  const direction = new Vector3(e[4], e[5], e[6]);
  const aa = direction.lengthSq();
  const origin = new Vector3();
  return (x, z) => {
    origin.set(x, 0, z).applyMatrix4(inverse).sub(center);
    const bb = origin.dot(direction);
    const discriminant = bb * bb - aa * (origin.lengthSq() - radius * radius);
    return discriminant < 0 ? -Infinity : (-bb + Math.sqrt(discriminant)) / aa;
  };
}

export function supportedBodyHeight(
  x,
  z,
  baseHeight,
  quaternion,
  supportHeight,
) {
  let result = baseHeight;
  const point = new Vector3();
  for (const [side, y, forward] of bodySamples) {
    point.set(side, y, -forward).applyQuaternion(quaternion);
    result = Math.max(
      result,
      supportHeight(x + point.x, z + point.z) + 0.025 - point.y,
    );
  }
  return result;
}

// Only the descent is eased: rising must immediately preserve clearance.
// Existing stance ankles cap the delay so smoothing cannot stretch their legs.
export function settleGroundHeight(
  previous,
  required,
  dt,
  reachCeiling = Infinity,
) {
  const eased =
    required + Math.max(0, previous - required) * Math.exp(-12 * dt);
  const result = Math.max(required, Math.min(eased, reachCeiling));
  return result - required < 0.001 ? required : result;
}

export function stanceHeightCeiling(x, z, quaternion, legs, reach = 1.24) {
  let ceiling = Infinity;
  const hip = new Vector3();
  for (const leg of legs) {
    if (leg.swing || leg.recovery) continue;
    hip.copy(leg.hip).applyQuaternion(quaternion);
    const horizontalSq =
      (x + hip.x - leg.foot.x) ** 2 + (z + hip.z - leg.foot.z) ** 2;
    ceiling = Math.min(
      ceiling,
      leg.foot.y - hip.y + Math.sqrt(Math.max(0, reach * reach - horizontalSq)),
    );
  }
  return ceiling;
}
