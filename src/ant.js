import * as T from "three/webgpu";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { setSegment, solveLeg } from "./math.js";
import { reachableFoot, recoveryStep } from "./foot-contact.js";
import { projectContact } from "./contact.js";
import { mx_noise_float, positionLocal, vec3, bumpMap } from "three/tsl";
let bodyTemplate;
const shell = new T.MeshStandardMaterial({
  color: 0x3b1b0d,
  roughness: 0.34,
  metalness: 0.13,
});
const limbGeometry = new T.CylinderGeometry(0.022, 0.036, 1, 7);
const limbBatches = new WeakMap();
function limbBatch(scene) {
  let batch = limbBatches.get(scene);
  if (!batch) {
    const mesh = new T.InstancedMesh(limbGeometry, shell, 2048);
    mesh.count = 0;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    scene.add(mesh);
    batch = { mesh, next: 0 };
    limbBatches.set(scene, batch);
  }
  return batch;
}
export async function loadAnt() {
  const gltf = await new GLTFLoader().loadAsync(
    `${import.meta.env.BASE_URL}assets/worker-ant.glb`,
  );
  gltf.scene.updateMatrixWorld(true);
  const groups = new Map();
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    const geometry = o.geometry.clone().applyMatrix4(o.matrixWorld);
    geometry.computeBoundingBox();
    const side = o.name.startsWith("Antenna")
      ? Math.sign(geometry.boundingBox.getCenter(new T.Vector3()).x)
      : 0;
    const key = `${o.material.uuid}:${side}`;
    if (!groups.has(key))
      groups.set(key, { material: o.material, geometries: [], side });
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
  const antennaPivots = new Map();
  for (const side of [-1, 1]) {
    const pivot = new T.Group();
    pivot.name = `antenna-${side}`;
    pivot.position.set(side * 0.14, 0.66, -0.85);
    antennaPivots.set(side, pivot);
    bodyTemplate.add(pivot);
  }
  for (const { material, geometries, side } of groups.values()) {
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
    if (side) {
      const pivot = antennaPivots.get(side);
      merged.translate(-pivot.position.x, -pivot.position.y, -pivot.position.z);
      pivot.add(mesh);
    } else bodyTemplate.add(mesh);
  }
}
export class Ant {
  constructor(scene, x, z, height, yaw = 0) {
    this.root = new T.Group();
    this.body = bodyTemplate.clone();
    this.feelers = [-1, 1].map((side) =>
      this.body.getObjectByName(`antenna-${side}`),
    );
    this.animationTime = Math.abs(x * 1.7 + z * 0.4);
    this.root.add(this.body);
    scene.add(this.root);
    this.root.position.set(x, height(x, z), z);
    this.root.rotation.y = yaw;
    this.previousYaw = yaw;
    this.previous = this.root.position.clone();
    this.phase = 0;
    this.legs = [];
    this.height = height;
    this.limbBatch = limbBatch(scene);
    for (let side = -1; side <= 1; side += 2)
      for (let i = 0; i < 3; i++) {
        const hip = new T.Vector3(side * 0.2, 0.45, -0.28 + i * 0.25);
        const foot = new T.Vector3(side * 1.03, 0, -0.82 + i * 0.78)
          .applyAxisAngle(new T.Vector3(0, 1, 0), yaw)
          .add(this.root.position);
        foot.y = height(foot.x, foot.z) + 0.025;
        const segments = [new T.Object3D(), new T.Object3D(), new T.Object3D()];
        for (const m of segments) {
          m.userData.instance = this.limbBatch.next++;
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
    this.limbBatch.mesh.count = this.limbBatch.next;
    this.cargo = new T.Mesh(
      new T.IcosahedronGeometry(0.23, 1),
      new T.MeshStandardMaterial({ color: 0x987040, roughness: 1 }),
    );
    this.cargo.position.set(0, 0.52, -1.18);
    this.cargo.visible = false;
    this.root.add(this.cargo);
  }
  update(
    x,
    z,
    yaw,
    dt,
    carrying = false,
    greeting = false,
    resting = false,
    surface = null,
  ) {
    const groundTravel = surface
      ? surface.position.distanceTo(this.previous)
      : Math.hypot(x - this.previous.x, z - this.previous.z);
    this.restBlend = T.MathUtils.damp(
      this.restBlend ?? 0,
      resting && !greeting && !carrying && groundTravel < 0.001 ? 1 : 0,
      3,
      dt,
    );
    const quiet = 1 - this.restBlend * 0.85;
    this.antennaPhase =
      (this.antennaPhase ?? this.animationTime) +
      dt * (greeting ? 5 : 1.8) * quiet;
    this.animationTime += dt;
    for (let i = 0; i < this.feelers.length; i++) {
      const t = this.antennaPhase;
      this.feelers[i].rotation.y =
        Math.sin(t + i * 2) * (greeting ? 0.28 : 0.08) * quiet;
      this.feelers[i].rotation.x =
        Math.sin(t * 0.7 + i) * (greeting ? 0.12 : 0.04) * quiet -
        this.restBlend * 0.22;
    }
    this.root.position.set(x, this.height(x, z) - this.restBlend * 0.1, z);
    if (surface)
      this.root.position
        .copy(surface.position)
        .addScaledVector(surface.normal, surface.bodyLift ?? 0);
    this.yaw = yaw;
    const epsilon = 0.12;
    const normal = surface
      ? surface.normal.clone()
      : new T.Vector3(
          this.height(x - epsilon, z) - this.height(x + epsilon, z),
          epsilon * 2,
          this.height(x, z - epsilon) - this.height(x, z + epsilon),
        ).normalize();
    const forward = surface
      ? surface.forward.clone()
      : new T.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    forward.addScaledVector(normal, -forward.dot(normal)).normalize();
    const right = forward.clone().cross(normal).normalize();
    if (surface) {
      normal.applyAxisAngle(right, surface.bodyPitch ?? 0);
      forward.applyAxisAngle(right, surface.bodyPitch ?? 0);
    }
    const basis = new T.Matrix4().makeBasis(
      right,
      normal,
      forward.clone().negate(),
    );
    this.root.quaternion.slerp(
      new T.Quaternion().setFromRotationMatrix(basis),
      Math.min(1, dt * 12),
    );
    if (surface && !this.wasAttached)
      this.root.quaternion.setFromRotationMatrix(basis);
    // Posture changes must not advance walking phases or lift planted feet.
    const travel = groundTravel;
    const turn =
      surface && this.previousSurfaceForward
        ? Math.acos(
            T.MathUtils.clamp(forward.dot(this.previousSurfaceForward), -1, 1),
          )
        : Math.abs(
            Math.atan2(
              Math.sin(yaw - this.previousYaw),
              Math.cos(yaw - this.previousYaw),
            ),
          );
    this.phase += (travel + turn * 0.3) * 5.6;
    this.root.updateMatrixWorld(true);
    this.cargo.visible = carrying;
    this.unreachableFeet = 0;
    this.recoveringFeet = 0;
    this.maxLegLengthError = 0;
    for (const leg of this.legs) {
      const phase = (this.phase + leg.group * Math.PI) % (Math.PI * 2);
      const swing = phase < Math.PI;
      const moving = !leg.recovery && (travel > 0.0001 || turn > 0.002);
      const ideal = new T.Vector3(leg.side * 1.03, 0, -0.82 + leg.index * 0.78);
      if (surface) ideal.applyQuaternion(this.root.quaternion);
      else ideal.applyAxisAngle(new T.Vector3(0, 1, 0), yaw);
      ideal.add(this.root.position);
      const ground = (point) => {
        if (surface && this.contactDensity) {
          const contact = projectContact(this.contactDensity, point, {
            maxTravel: 1.5,
          });
          if (contact)
            point.copy(contact.position).addScaledVector(contact.normal, 0.025);
        } else point.y = this.height(point.x, point.z) + 0.025;
      };
      ground(ideal);
      if (surface && !this.wasAttached) leg.foot.copy(ideal);
      if (moving && swing && !leg.swing) {
        leg.start.copy(leg.foot);
        leg.target.copy(ideal).addScaledVector(forward, 0.32);
        ground(leg.target);
      }
      if (moving && swing) {
        const t = phase / Math.PI;
        leg.foot.lerpVectors(leg.start, leg.target, t * t * (3 - 2 * t));
        leg.foot.addScaledVector(normal, Math.sin(t * Math.PI) * 0.17);
      }
      if (moving && !swing && leg.swing) leg.foot.copy(leg.target);
      if (!moving && surface) {
        const planted = leg.foot.clone();
        const density = this.contactDensity?.(planted.x, planted.y, planted.z);
        if (density === undefined || density > 0.04 || density < -0.08)
          ground(planted);
        leg.foot.lerp(planted, Math.min(1, dt * 15));
      }
      if (!moving && !surface)
        leg.foot.y = T.MathUtils.lerp(
          leg.foot.y,
          this.height(leg.foot.x, leg.foot.z) + 0.025,
          Math.min(1, dt * 15),
        );
      leg.swing = moving && swing;
      const hip = leg.hip.clone().applyMatrix4(this.root.matrixWorld);
      if (
        !leg.recovery &&
        (hip.distanceTo(leg.foot) > 1.24 || leg.foot.distanceTo(ideal) > 1.4)
      ) {
        const density =
          surface && this.contactDensity
            ? this.contactDensity
            : (x, y, z) => this.height(x, z) - y;
        const reachable = reachableFoot(
          density,
          hip,
          ideal,
          1.24,
          right.clone().multiplyScalar(leg.side),
        );
        if (reachable && reachable.distanceTo(leg.foot) > 0.06) {
          leg.recovery = {
            start: leg.foot.clone(),
            target: reachable,
            normal: normal.clone(),
            elapsed: 0,
          };
        }
      }
      if (leg.recovery) {
        const step = leg.recovery;
        step.elapsed += dt;
        leg.foot.copy(
          recoveryStep(step.start, step.target, step.normal, step.elapsed),
        );
        this.recoveringFeet++;
        if (step.elapsed >= 0.18) {
          leg.target.copy(step.target);
          leg.start.copy(step.target);
          leg.recovery = null;
          leg.swing = false;
        }
      }
      const requestedAnkle = leg.foot.clone().addScaledVector(normal, 0.065);
      const bend = right
        .clone()
        .multiplyScalar(leg.side)
        .addScaledVector(normal, 0.9)
        .normalize();
      const { knee, ankle } = solveLeg(hip, requestedAnkle, bend, 0.66);
      if (ankle.distanceTo(requestedAnkle) > 0.001) this.unreachableFeet++;
      this.maxLegLengthError = Math.max(
        this.maxLegLengthError,
        Math.abs(hip.distanceTo(knee) - 0.66),
        Math.abs(knee.distanceTo(ankle) - 0.66),
      );
      // If no soil lies within reach, keep a finite unsupported leg instead of
      // stretching its bones to pretend it is planted.
      const renderedFoot = leg.foot.clone().add(ankle).sub(requestedAnkle);
      setSegment(leg.segments[0], hip, knee);
      setSegment(leg.segments[1], knee, ankle);
      setSegment(leg.segments[2], ankle, renderedFoot);
      for (const segment of leg.segments) {
        segment.updateMatrix();
        this.limbBatch.mesh.setMatrixAt(
          segment.userData.instance,
          segment.matrix,
        );
      }
    }
    this.body.position.y =
      travel > 0.0001
        ? Math.sin(this.phase * 2) * 0.012
        : Math.sin(this.animationTime * 1.8) * 0.006 * quiet;
    this.previous.copy(surface ? surface.position : this.root.position);
    this.previousYaw = yaw;
    this.wasAttached = !!surface;
    this.previousSurfaceForward = surface ? forward.clone() : null;
    this.limbBatch.mesh.instanceMatrix.needsUpdate = true;
  }
}
