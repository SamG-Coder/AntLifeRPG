import * as T from "three/webgpu";
export function random(seed = 417) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
export function capsuleBetween(a, b, r, material) {
  const mesh = new T.Mesh(
    new T.CylinderGeometry(r * 0.68, r, a.distanceTo(b), 7),
    material,
  );
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(
    new T.Vector3(0, 1, 0),
    b.clone().sub(a).normalize(),
  );
  mesh.castShadow = true;
  return mesh;
}
export function setSegment(mesh, a, b) {
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.scale.y = a.distanceTo(b);
  mesh.quaternion.setFromUnitVectors(
    new T.Vector3(0, 1, 0),
    b.clone().sub(a).normalize(),
  );
}
export function solveKnee(hip, foot, bend, length = 0.57) {
  const axis = foot.clone().sub(hip),
    distance = axis.length();
  axis.normalize();
  const plane = bend.clone().addScaledVector(axis, -bend.dot(axis));
  if (plane.lengthSq() < 1e-8)
    plane.set(0, 1, 0).addScaledVector(axis, -axis.y);
  plane.normalize();
  const altitude = Math.sqrt(
    Math.max(0, length * length - distance * distance * 0.25),
  );
  return hip.clone().lerp(foot, 0.5).addScaledVector(plane, altitude);
}
