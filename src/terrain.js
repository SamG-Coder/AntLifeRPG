import * as T from "three/webgpu";
// A bounded implicit surface, polygonised with six consistently split tetrahedra per cell.
// Density samples are shared; geometric normals come from the scalar-field gradient.
export function implicitMesh(density, bounds, step = 0.45) {
  const [min, max] = bounds;
  const nx = Math.ceil((max[0] - min[0]) / step),
    ny = Math.ceil((max[1] - min[1]) / step),
    nz = Math.ceil((max[2] - min[2]) / step);
  const sx = nx + 1,
    sy = ny + 1,
    values = new Float32Array(sx * sy * (nz + 1)),
    idx = (x, y, z) => x + sx * (y + sy * z);
  for (let z = 0; z <= nz; z++)
    for (let y = 0; y <= ny; y++)
      for (let x = 0; x <= nx; x++)
        values[idx(x, y, z)] = density(
          min[0] + x * step,
          min[1] + y * step,
          min[2] + z * step,
        );
  const offsets = [
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
    ],
    tets = [
      [0, 5, 1, 6],
      [0, 1, 2, 6],
      [0, 2, 3, 6],
      [0, 3, 7, 6],
      [0, 7, 4, 6],
      [0, 4, 5, 6],
    ],
    positions = [],
    normals = [];
  function vertex(p) {
    positions.push(...p);
    const e = 0.025;
    const n = new T.Vector3(
      density(p[0] + e, p[1], p[2]) - density(p[0] - e, p[1], p[2]),
      density(p[0], p[1] + e, p[2]) - density(p[0], p[1] - e, p[2]),
      density(p[0], p[1], p[2] + e) - density(p[0], p[1], p[2] - e),
    )
      .normalize()
      .negate();
    normals.push(n.x, n.y, n.z);
  }
  function triangle(a, b, c) {
    const ab = new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]),
      ac = new T.Vector3(c[0] - a[0], c[1] - a[1], c[2] - a[2]);
    const normal = ab.cross(ac);
    const center = a.map((v, i) => (v + b[i] + c[i]) / 3);
    const e = 0.01;
    const grad = new T.Vector3(
      density(center[0] + e, center[1], center[2]) -
        density(center[0] - e, center[1], center[2]),
      density(center[0], center[1] + e, center[2]) -
        density(center[0], center[1] - e, center[2]),
      density(center[0], center[1], center[2] + e) -
        density(center[0], center[1], center[2] - e),
    );
    vertex(a);
    if (normal.dot(grad) > 0) {
      vertex(c);
      vertex(b);
    } else {
      vertex(b);
      vertex(c);
    }
  }
  for (let z = 0; z < nz; z++)
    for (let y = 0; y < ny; y++)
      for (let x = 0; x < nx; x++) {
        const v = offsets.map((o) => values[idx(x + o[0], y + o[1], z + o[2])]);
        if (v.every((a) => a > 0) || v.every((a) => a <= 0)) continue;
        const p = offsets.map((o) => [
          min[0] + (x + o[0]) * step,
          min[1] + (y + o[1]) * step,
          min[2] + (z + o[2]) * step,
        ]);
        const edge = (a, b) => {
          const t = v[a] / (v[a] - v[b]);
          return p[a].map((q, i) => q + (p[b][i] - q) * t);
        };
        for (const tet of tets) {
          const inside = tet.filter((i) => v[i] <= 0),
            outside = tet.filter((i) => v[i] > 0);
          if (!inside.length || !outside.length) continue;
          if (inside.length === 1 || outside.length === 1) {
            const single = inside.length === 1 ? inside[0] : outside[0],
              other = inside.length === 1 ? outside : inside;
            triangle(...other.map((i) => edge(single, i)));
          } else {
            const a = edge(inside[0], outside[0]),
              b = edge(inside[0], outside[1]),
              c = edge(inside[1], outside[0]),
              d = edge(inside[1], outside[1]);
            triangle(a, b, c);
            triangle(b, d, c);
          }
        }
      }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  g.setAttribute("normal", new T.Float32BufferAttribute(normals, 3));
  return g;
}
