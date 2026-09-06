import { Vector3 } from "three/webgpu";

// Implicit envelopes preserve orientation/non-uniform scale. All registered
// props obstruct the camera; the store seeds also feed locomotion contacts.
export function cameraEllipsoid(mesh) {
  mesh.updateWorldMatrix(true, false);
  mesh.geometry.computeBoundingSphere();
  const inverse = mesh.matrixWorld.clone().invert();
  const center = mesh.geometry.boundingSphere.center.clone();
  const radius = mesh.geometry.boundingSphere.radius;
  const scale = new Vector3().setFromMatrixScale(mesh.matrixWorld);
  const smallest = Math.min(scale.x, scale.y, scale.z);
  const worldCenter = center.clone().applyMatrix4(mesh.matrixWorld);
  const bound = radius * Math.max(scale.x, scale.y, scale.z) + 1;
  const local = new Vector3();
  return (x, y, z) => {
    if (
      Math.abs(x - worldCenter.x) > bound ||
      Math.abs(y - worldCenter.y) > bound ||
      Math.abs(z - worldCenter.z) > bound
    )
      return -1;
    local.set(x, y, z).applyMatrix4(inverse).sub(center);
    return (radius - local.length()) * smallest;
  };
}

export function cameraCapsule(a, b, radius) {
  const axis = b.clone().sub(a),
    lengthSq = axis.lengthSq();
  const minimum = a
    .clone()
    .min(b)
    .addScalar(-radius - 1);
  const maximum = a
    .clone()
    .max(b)
    .addScalar(radius + 1);
  const point = new Vector3();
  return (x, y, z) => {
    if (
      x < minimum.x ||
      y < minimum.y ||
      z < minimum.z ||
      x > maximum.x ||
      y > maximum.y ||
      z > maximum.z
    )
      return -1;
    point.set(x, y, z).sub(a);
    const t = lengthSq
      ? Math.max(0, Math.min(1, point.dot(axis) / lengthSq))
      : 0;
    return radius - point.addScaledVector(axis, -t).length();
  };
}
