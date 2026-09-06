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
  if (plane.lengthSq() < 1e-8) {
    plane.set(
      Math.abs(axis.x) < 0.8 ? 1 : 0,
      Math.abs(axis.x) < 0.8 ? 0 : 1,
      0,
    );
    plane.addScaledVector(axis, -plane.dot(axis));
  }
  plane.normalize();
  const altitude = Math.sqrt(
    Math.max(0, length * length - distance * distance * 0.25),
  );
  return hip.clone().lerp(foot, 0.5).addScaledVector(plane, altitude);
}

export function solveLeg(hip, requestedAnkle, bend, length = 0.66) {
  const delta = requestedAnkle.clone().sub(hip);
  if (delta.lengthSq() < 1e-12) delta.set(0, -1e-6, 0);
  delta.clampLength(1e-6, length * 2 - 1e-5);
  const ankle = hip.clone().add(delta);
  return { ankle, knee: solveKnee(hip, ankle, bend, length) };
}
