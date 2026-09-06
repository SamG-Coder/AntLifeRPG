import * as T from "three/webgpu";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { setSegment, solveKnee } from "./math.js";
import { mx_noise_float, positionLocal, vec3, bumpMap } from "three/tsl";
let bodyTemplate;
const shell = new T.MeshStandardMaterial({
  color: 0x3b1b0d,
  roughness: 0.34,
  metalness: 0.13,
});
const limbGeometry = new T.CylinderGeometry(0.022, 0.036, 1, 7);
export async function loadAnt() {
  const gltf = await new GLTFLoader().loadAsync(
    `${import.meta.env.BASE_URL}assets/worker-ant.glb`,
  );
  gltf.scene.updateMatrixWorld(true);
  const groups = new Map();
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    const key = o.material.uuid;
    if (!groups.has(key))
      groups.set(key, { material: o.material, geometries: [] });
    const geometry = o.geometry.clone().applyMatrix4(o.matrixWorld);
    // Authored lofts have no UV unwrap; keep material batches attribute-compatible.
    if (!geometry.attributes.uv)
      geometry.setAttribute(
        "uv",
        new T.BufferAttribute(
          new Float32Array(geometry.attributes.position.count * 2),
          2,
        ),
      );
    for (const key of Object.keys(geometry.attributes))
      if (!["position", "normal", "uv"].includes(key))
        geometry.deleteAttribute(key);
    groups.get(key).geometries.push(geometry);
  });
  bodyTemplate = new T.Group();
  for (const { material, geometries } of groups.values()) {
    let renderedMaterial = material;
    if (material.name.includes("cuticle")) {
      renderedMaterial = new T.MeshStandardNodeMaterial();
      renderedMaterial.copy(material);
      renderedMaterial.roughnessNode = mx_noise_float(positionLocal.mul(55))
        .mul(0.08)
        .add(0.43);
      renderedMaterial.normalNode = bumpMap(
        mx_noise_float(positionLocal.mul(vec3(140, 200, 55))),
        0.004,
      );
    }
    const merged = mergeGeometries(geometries);
    if (!merged)
      throw new Error(`Could not merge ant material ${material.name}`);
    const mesh = new T.Mesh(merged, renderedMaterial);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    bodyTemplate.add(mesh);
  }
}
export class Ant {
  constructor(scene, x, z, height) {
    this.root = new T.Group();
    this.body = bodyTemplate.clone();
    this.root.add(this.body);
    scene.add(this.root);
    this.root.position.set(x, height(x, z), z);
    this.previous = this.root.position.clone();
    this.phase = 0;
    this.legs = [];
    this.height = height;
    for (let side = -1; side <= 1; side += 2)
      for (let i = 0; i < 3; i++) {
        const hip = new T.Vector3(side * 0.2, 0.45, -0.28 + i * 0.25);
        const foot = new T.Vector3(
          x + side * 0.73,
          height(x + side * 0.73, z) + 0.025,
          z - 0.5 + i * 0.52,
        );
        const segments = [
          new T.Mesh(limbGeometry, shell),
          new T.Mesh(limbGeometry, shell),
          new T.Mesh(limbGeometry, shell),
        ];
        for (const m of segments) {
          m.castShadow = true;
          scene.add(m);
        }
        this.legs.push({
          side,
          index: i,
          hip,
          foot,
          start: foot.clone(),
          target: foot.clone(),
          swing: false,
          segments,
          group: (i + (side === 1 ? 1 : 0)) % 2,
        });
      }
    this.cargo = new T.Mesh(
      new T.IcosahedronGeometry(0.23, 1),
      new T.MeshStandardMaterial({ color: 0x987040, roughness: 1 }),
    );
    this.cargo.position.set(0, 0.52, -1.18);
    this.cargo.visible = false;
    this.root.add(this.cargo);
  }
  update(x, z, yaw, dt, carrying = false) {
    this.root.position.set(x, this.height(x, z), z);
    this.root.rotation.y = yaw;
    this.yaw = yaw;
    const epsilon = 0.12;
    const normal = new T.Vector3(
      this.height(x - epsilon, z) - this.height(x + epsilon, z),
      epsilon * 2,
      this.height(x, z - epsilon) - this.height(x, z + epsilon),
    ).normalize();
    const forward = new T.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    forward.addScaledVector(normal, -forward.dot(normal)).normalize();
    const right = forward.clone().cross(normal).normalize();
    const basis = new T.Matrix4().makeBasis(
      right,
      normal,
      forward.clone().negate(),
    );
    this.root.quaternion.slerp(
      new T.Quaternion().setFromRotationMatrix(basis),
      Math.min(1, dt * 12),
    );
    const travel = this.root.position.distanceTo(this.previous);
    this.phase += travel * 5.6;
    this.root.updateMatrixWorld(true);
    this.cargo.visible = carrying;
    for (const leg of this.legs) {
      const phase = (this.phase + leg.group * Math.PI) % (Math.PI * 2);
      const swing = phase < Math.PI;
      const moving = travel > 0.0001;
      const ideal = new T.Vector3(leg.side * 0.78, 0, -0.58 + leg.index * 0.52)
        .applyAxisAngle(new T.Vector3(0, 1, 0), yaw)
        .add(this.root.position);
      ideal.y = this.height(ideal.x, ideal.z) + 0.025;
      if (moving && swing && !leg.swing) {
        leg.start.copy(leg.foot);
        leg.target
          .copy(ideal)
          .add(new T.Vector3(-Math.sin(yaw) * 0.32, 0, -Math.cos(yaw) * 0.32));
        leg.target.y = this.height(leg.target.x, leg.target.z) + 0.025;
      }
      if (moving && swing) {
        const t = phase / Math.PI;
        leg.foot.lerpVectors(leg.start, leg.target, t * t * (3 - 2 * t));
        leg.foot.y += Math.sin(t * Math.PI) * 0.17;
      }
      if (!moving)
        leg.foot.y = T.MathUtils.lerp(
          leg.foot.y,
          this.height(leg.foot.x, leg.foot.z) + 0.025,
          Math.min(1, dt * 15),
        );
      if (leg.foot.distanceTo(ideal) > 1.4) leg.foot.copy(ideal);
      leg.swing = moving && swing;
      const hip = leg.hip.clone().applyMatrix4(this.root.matrixWorld);
      const ankle = leg.foot.clone().add(new T.Vector3(0, 0.065, 0));
      const bend = new T.Vector3(
        leg.side * Math.cos(yaw),
        0.9,
        -leg.side * Math.sin(yaw),
      ).normalize();
      const knee = solveKnee(hip, ankle, bend);
      setSegment(leg.segments[0], hip, knee);
      setSegment(leg.segments[1], knee, ankle);
      setSegment(leg.segments[2], ankle, leg.foot);
    }
    this.body.position.y =
      travel > 0.0001
        ? Math.sin(this.phase * 2) * 0.012
        : Math.sin(performance.now() * 0.0018) * 0.006;
    this.previous.copy(this.root.position);
  }
}
