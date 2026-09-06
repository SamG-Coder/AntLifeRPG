import * as T from "three/webgpu";
import { random, capsuleBetween } from "./math.js";
import { sites } from "./simulation.js";
import { implicitMesh } from "./terrain.js";
import { leafTexture } from "./foliage.js";
import {
  texture as textureNode,
  triplanarTexture,
  positionWorld,
  normalWorld,
  float,
  color,
  mx_noise_float,
  bumpMap,
} from "three/tsl";
const rng = random();
export function height(x, z) {
  const surface =
    T.MathUtils.smoothstep(x, 4, 13) * T.MathUtils.smoothstep(-z, 19, 30);
  return (
    Math.sin(x * 1.3 + z * 0.7) * 0.035 +
    Math.sin(z * 2.5 - x) * 0.022 +
    surface * 3.5
  );
}
function segmentDistance(x, z, a, b) {
  const dx = b.x - a.x,
    dz = b.z - a.z,
    t = T.MathUtils.clamp(
      ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz),
      0,
      1,
    );
  return Math.hypot(x - a.x - t * dx, z - a.z - t * dz);
}
const paths = [
  ["home", "store", 2.6],
  ["store", "dig", 2.5],
  ["store", "surface", 2.9],
  ["dig", "spoil", 2.6],
];
export function field(x, z) {
  let d = Infinity;
  for (const [name, radius] of [
    ["home", 6],
    ["store", 6],
    ["dig", 5],
    ["surface", 9],
    ["spoil", 3],
  ])
    d = Math.min(d, Math.hypot(x - sites[name].x, z - sites[name].z) - radius);
  for (const [a, b, r] of paths)
    d = Math.min(d, segmentDistance(x, z, sites[a], sites[b]) - r);
  return d;
}
export function walkable(x, z) {
  return field(x, z) < -0.45;
}
export function caveDensity(x, y, z) {
  const f = field(x, z);
  const noise =
    Math.sin(x * 3.4 + y * 2.7) * Math.sin(z * 3.1 - y * 2.1) * 0.13 +
    Math.sin(x * 8 + z * 5.1 + y * 7) * 0.04;
  const roof =
    T.MathUtils.smoothstep(x, 3, 9) * T.MathUtils.smoothstep(-z, 21, 29);
  return (
    f +
    Math.pow(Math.max(0, y - height(x, z)) / 3.4, 4) * 3 * (1 - roof) +
    noise
  );
}
function soilTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#776047";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 65000; i++) {
    const v = Math.floor(35 + rng() * 100);
    ctx.fillStyle = `rgba(${v + 22},${v + 5},${v - 14},${0.2 + rng() * 0.5})`;
    const r = rng() * 2.2;
    ctx.beginPath();
    ctx.ellipse(
      rng() * 512,
      rng() * 512,
      r * 1.8,
      r,
      rng() * 6,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  const texture = new T.CanvasTexture(c);
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.repeat.set(13, 13);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}
export function buildWorld(scene, state) {
  const texture = soilTexture();
  const soil = new T.MeshStandardMaterial({
    color: 0xb79b71,
    map: texture,
    bumpMap: texture,
    bumpScale: 0.13,
    roughness: 0.97,
  });
  const rockMat = new T.MeshStandardMaterial({
    color: 0x6e6651,
    roughness: 0.84,
    map: texture,
    bumpMap: texture,
    bumpScale: 0.12,
  });
  const groundGeo = new T.PlaneGeometry(65, 65, 180, 180);
  groundGeo.rotateX(-Math.PI / 2);
  const p = groundGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      z = p.getZ(i) - 17;
    p.setXYZ(i, x, height(x, z) - 0.055, z);
  }
  groundGeo.computeVertexNormals();
  const ground = new T.Mesh(groundGeo, soil);
  ground.receiveShadow = true;
  scene.add(ground);
  const matrix = new T.Object3D(),
    grainGeo = new T.IcosahedronGeometry(1, 0);
  const grains = new T.InstancedMesh(grainGeo, soil, 16000);
  let count = 0;
  for (let i = 0; i < 23000 && count < 16000; i++) {
    const x = rng() * 51 - 24,
      z = rng() * 54 - 42;
    if (field(x, z) > 1) continue;
    const size = 0.012 + rng() ** 4 * 0.1;
    matrix.position.set(x, height(x, z) + size * 0.25, z);
    matrix.rotation.set(rng() * 6, rng() * 6, rng() * 6);
    matrix.scale.set(size * 1.4, size * 0.65, size);
    matrix.updateMatrix();
    grains.setMatrixAt(count, matrix.matrix);
    grains.setColorAt(
      count,
      new T.Color().setHSL(
        0.085 + rng() * 0.045,
        0.18 + rng() * 0.22,
        0.12 + rng() * 0.22,
      ),
    );
    count++;
  }
  grains.count = count;
  grains.receiveShadow = true;
  scene.add(grains);
  const soilNode = new T.MeshStandardNodeMaterial({
    roughness: 0.97,
    side: T.DoubleSide,
  });
  const tex = texture.clone();
  tex.repeat.set(1, 1);
  const tri = triplanarTexture(
    textureNode(tex),
    null,
    null,
    float(1.6),
    positionWorld,
    normalWorld,
  );
  const fine = mx_noise_float(positionWorld.mul(75));
  soilNode.colorNode = tri.rgb
    .mul(color(0xb8a089))
    .mul(mx_noise_float(positionWorld.mul(3)).mul(0.3).add(0.85));
  soilNode.normalNode = bumpMap(fine, 0.065);
  const cave = new T.Mesh(
    implicitMesh(
      caveDensity,
      [
        [-23, -0.1, -42],
        [24, 7, 8],
      ],
      0.42,
    ),
    soilNode,
  );
  cave.castShadow = true;
  cave.receiveShadow = true;
  scene.add(cave);
  const bark = new T.MeshStandardMaterial({
    color: 0x5d4227,
    roughness: 0.9,
    map: texture,
    bumpMap: texture,
    bumpScale: 0.22,
  });
  const root = (points, r) => {
    const curve = new T.CatmullRomCurve3(
      points.map((p) => new T.Vector3(...p)),
    );
    const mesh = new T.Mesh(new T.TubeGeometry(curve, 40, r, 9, false), bark);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  };
  root(
    [
      [-6, 1, -5],
      [-4, 3.4, -6],
      [0, 4.1, -7],
      [3, 2.6, -7],
      [4, 0, -8],
    ],
    0.45,
  );
  root(
    [
      [-5, 3.5, -6],
      [-2, 4.5, -9],
      [1, 5, -16],
      [4, 4, -22],
      [8, 4, -27],
    ],
    0.58,
  );
  root(
    [
      [2, 5, -15],
      [-2, 4, -18],
      [-5, 3.8, -24],
      [-8, 1.8, -27],
      [-9, 0, -28],
    ],
    0.34,
  );
  for (let i = 0; i < 40; i++) {
    const x = -4 + rng() * 8,
      z = -9 - rng() * 16;
    root(
      [
        [x, 3 + rng(), z],
        [x + 0.3, 2.5, z + 0.6],
        [x + 0.5, 1.2 + rng(), z + 1.2],
      ],
      0.018 + rng() * 0.035,
    );
  }
  const leafMap = leafTexture();
  const leafMat = new T.MeshPhysicalMaterial({
    color: 0xb9bd76,
    map: leafMap,
    bumpMap: leafMap,
    bumpScale: 0.045,
    roughness: 0.75,
    side: T.DoubleSide,
    transmission: 0.12,
    thickness: 0.06,
  });
  function leaf(x, y, z, size, angle) {
    const g = new T.BufferGeometry(),
      v = [],
      idx = [],
      uvs = [];
    for (let i = 0; i <= 18; i++) {
      const t = i / 18,
        w = Math.sin(Math.PI * t) * size * 0.29;
      v.push(
        -w,
        Math.sin(t * 3) * size * 0.08,
        t * size,
        w,
        Math.sin(t * 3) * size * 0.08,
        t * size,
      );
      uvs.push(0, t, 1, t);
    }
    for (let i = 0; i < 18; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    g.setAttribute("position", new T.Float32BufferAttribute(v, 3));
    g.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = new T.Mesh(g, leafMat);
    m.position.set(x, y, z);
    m.rotation.y = angle;
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    const vein = capsuleBetween(
      new T.Vector3(x, y + 0.025, z),
      new T.Vector3(
        x + Math.sin(angle) * size,
        y + 0.04,
        z + Math.cos(angle) * size,
      ),
      0.017,
      new T.MeshStandardMaterial({ color: 0x9caa4c, roughness: 0.7 }),
    );
    scene.add(vein);
    return m;
  }
  leaf(-2, 0.03, 1, 3.1, -0.65);
  leaf(-1, 0.08, 1.5, 2.5, -0.3);
  leaf(1, 0.05, -14, 2.7, 0.6);
  // Surface vegetation uses curved, tapered blades with physical translucency.
  for (let i = 0; i < 95; i++) {
    const x = 5 + rng() * 17,
      z = -24 - rng() * 14;
    if (Math.hypot(x - 13, z + 31) > 9) continue;
    const y = height(x, z);
    const h = 3 + rng() * 8;
    const g = new T.BufferGeometry(),
      v = [],
      idx = [];
    const bend = rng() * 2 - 1;
    for (let j = 0; j <= 12; j++) {
      const t = j / 12,
        w = (1 - t) * (0.12 + rng() * 0.1);
      v.push(
        -w + bend * t * t,
        t * h,
        t * t * 2,
        w + bend * t * t,
        t * h,
        t * t * 2,
      );
    }
    for (let j = 0; j < 12; j++) {
      const a = j * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    g.setAttribute("position", new T.Float32BufferAttribute(v, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const uv = [];
    for (let j = 0; j <= 12; j++) uv.push(0, j / 12, 1, j / 12);
    g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    const m = new T.Mesh(g, leafMat);
    m.position.set(x, y, z);
    m.rotation.y = rng() * 6.28;
    m.castShadow = true;
    scene.add(m);
  }
  const moss = new T.InstancedMesh(
    new T.ConeGeometry(0.07, 0.45, 4),
    new T.MeshStandardMaterial({ color: 0x617b31, roughness: 0.9 }),
    2500,
  );
  for (let i = 0; i < 2500; i++) {
    const a = rng() * 6.28,
      r = 3 + rng() * 6,
      x = 13 + Math.cos(a) * r,
      z = -31 + Math.sin(a) * r;
    matrix.position.set(x, height(x, z) + 0.12, z);
    matrix.rotation.set(rng() * 0.4, rng() * 6, rng() * 0.4);
    matrix.scale.setScalar(0.5 + rng());
    matrix.updateMatrix();
    moss.setMatrixAt(i, matrix.matrix);
    moss.setColorAt(
      i,
      new T.Color().setHSL(0.19 + rng() * 0.07, 0.45, 0.13 + rng() * 0.13),
    );
  }
  scene.add(moss);
  for (let i = 0; i < 34; i++) {
    const x = 6 + rng() * 15,
      z = -25 - rng() * 13;
    const r = 0.3 + rng() * 0.9;
    const mesh = new T.Mesh(new T.IcosahedronGeometry(r, 2), rockMat);
    mesh.position.set(x, height(x, z) + r * 0.3, z);
    mesh.scale.set(1.2, 0.7, 1);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
  const water = new T.Mesh(
    new T.SphereGeometry(1, 32, 20),
    new T.MeshPhysicalMaterial({
      color: 0xcadbb8,
      roughness: 0.035,
      metalness: 0.05,
      transmission: 0.85,
      thickness: 0.5,
      ior: 1.333,
      transparent: true,
      opacity: 0.85,
    }),
  );
  water.position.set(15, height(15, -29) + 0.3, -29);
  water.scale.set(1.8, 0.65, 1.5);
  scene.add(water);
  const glass = new T.Mesh(
    new T.PlaneGeometry(58, 24),
    new T.MeshPhysicalMaterial({
      color: 0xbcccb1,
      transparent: true,
      opacity: 0.1,
      roughness: 0.18,
      metalness: 0.25,
      side: T.DoubleSide,
    }),
  );
  glass.position.set(0, 10, -42);
  scene.add(glass);
  const seedMat = new T.MeshStandardMaterial({
    color: 0xb49a55,
    roughness: 0.66,
  });
  const seedGeo = new T.SphereGeometry(0.22, 12, 8);
  for (let i = 0; i < 45; i++) {
    const a = rng() * 6,
      r = rng() * 1.5;
    const m = new T.Mesh(seedGeo, seedMat);
    m.position.set(
      Math.cos(a) * r,
      height(0, -14) + 0.13 + Math.floor(i / 15) * 0.15,
      -14 + Math.sin(a) * r,
    );
    m.scale.set(1, 0.7, 1.9);
    m.rotation.y = rng() * 6;
    m.castShadow = true;
    scene.add(m);
  }
  if (!state.items.some((i) => i.kind === "seed"))
    for (let i = 0; i < 9; i++)
      state.items.push({
        id: state.nextItem++,
        kind: "seed",
        x: 10 + rng() * 5,
        z: -28 - rng() * 5,
        y: 0,
        deposited: false,
      });
  const trail = new T.Group();
  scene.add(trail);
  const scentMat = new T.MeshBasicMaterial({
    color: 0xd2ad63,
    transparent: true,
    opacity: 0.32,
  });
  for (const [a, b] of paths) {
    for (let t = 0; t < 1; t += 0.033) {
      const x = T.MathUtils.lerp(sites[a].x, sites[b].x, t),
        z = T.MathUtils.lerp(sites[a].z, sites[b].z, t);
      const m = new T.Mesh(new T.SphereGeometry(0.035, 5, 4), scentMat);
      m.position.set(x, height(x, z) + 0.12, z);
      trail.add(m);
    }
  }
  const digCells = new Map();
  for (let ix = 0; ix < 7; ix++)
    for (let iy = 0; iy < 5; iy++)
      for (let iz = 0; iz < 3; iz++) {
        const id = `${ix}:${iy}:${iz}`;
        if (state.removed.includes(id)) continue;
        const x = -16.3 + ix * 0.67,
          z = -28.5 - iz * 0.6,
          y = iy * 0.58 + 0.2;
        const m = new T.Object3D();
        m.position.set(x, y, z);
        m.rotation.set(rng(), rng(), rng());
        m.scale.set(1, 0.85, 1);
        m.castShadow = true;
        m.receiveShadow = true;
        m.userData.cell = id;
        digCells.set(id, m);
      }
  let excavationMesh;
  function rebuildExcavation() {
    const holes = state.removed.map((id) => {
      const [ix, iy, iz] = id.split(":").map(Number);
      return [-16.3 + ix * 0.67, iy * 0.58 + 0.2, -28.5 - iz * 0.6];
    });
    const density = (x, y, z) => {
      let value = Math.min(
        x + 16.8,
        -11.8 - x,
        y + 0.1,
        3.1 - y,
        z + 30.2,
        -28.12 - z,
      );
      value += Math.sin(x * 8 + y * 5) * Math.sin(z * 9 - y * 3) * 0.065;
      for (const h of holes)
        value = Math.min(
          value,
          Math.hypot(x - h[0], y - h[1], z - h[2]) - 0.56,
        );
      return value;
    };
    const geometry = implicitMesh(
      density,
      [
        [-17, -0.2, -30.5],
        [-11.5, 3.4, -27.8],
      ],
      0.15,
    );
    if (excavationMesh) {
      excavationMesh.geometry.dispose();
      excavationMesh.geometry = geometry;
    } else {
      excavationMesh = new T.Mesh(geometry, soilNode);
      excavationMesh.castShadow = true;
      excavationMesh.receiveShadow = true;
      scene.add(excavationMesh);
    }
  }
  rebuildExcavation();
  const spoilRing = new T.Mesh(
    new T.TorusGeometry(1.5, 0.045, 6, 45),
    new T.MeshStandardMaterial({ color: 0xa7965c, roughness: 1 }),
  );
  spoilRing.rotation.x = Math.PI / 2;
  spoilRing.position.set(-8, 0.08, -19);
  scene.add(spoilRing);
  const motesGeo = new T.BufferGeometry(),
    motes = [];
  for (let i = 0; i < 500; i++)
    motes.push(rng() * 40 - 18, rng() * 6 + 0.2, -rng() * 40);
  motesGeo.setAttribute("position", new T.Float32BufferAttribute(motes, 3));
  const dust = new T.Points(
    motesGeo,
    new T.PointsMaterial({
      color: 0xd4c3a0,
      size: 0.023,
      transparent: true,
      opacity: 0.4,
    }),
  );
  scene.add(dust);
  return { digCells, soil, seedMat, seedGeo, trail, dust, rebuildExcavation };
}
