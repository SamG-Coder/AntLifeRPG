import { TubeGeometry } from "three/webgpu";

export function taperedRootGeometry(curve, radius, segments = 24) {
  const geometry = new TubeGeometry(curve, segments, radius, 7, false);
  const positions = geometry.attributes.position;
  for (let ring = 0; ring <= segments; ring++) {
    const t = ring / segments;
    const centre = curve.getPointAt(t);
    const taper = 0.035 + 0.965 * (1 - t) ** 0.85;
    for (let side = 0; side <= 7; side++) {
      const i = ring * 8 + side;
      positions.setXYZ(
        i,
        centre.x + (positions.getX(i) - centre.x) * taper,
        centre.y + (positions.getY(i) - centre.y) * taper,
        centre.z + (positions.getZ(i) - centre.z) * taper,
      );
    }
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
