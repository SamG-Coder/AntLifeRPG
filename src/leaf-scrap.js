import * as T from "three/webgpu";

export function leafScrapGeometry() {
  const vertices = [],
    uv = [],
    indices = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12,
      width = Math.sin(t * Math.PI) * 0.3;
    for (const side of [-1, 0, 1]) {
      vertices.push(
        side * width,
        Math.sin(t * Math.PI) * 0.09 + Math.abs(side) * 0.05,
        (t - 0.5) * 1.25,
      );
      uv.push((side + 1) / 2, t);
    }
  }
  for (let i = 0; i < 12; i++)
    for (let j = 0; j < 2; j++) {
      const a = i * 3 + j;
      indices.push(a, a + 3, a + 1, a + 1, a + 3, a + 4);
    }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
