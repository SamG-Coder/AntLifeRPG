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
