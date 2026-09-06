import * as T from "three/webgpu";
import { height, caveDensity } from "./world.js";
import { clipToFreeSpace } from "./contact.js";
import { restoreFrame } from "./surface-motor.js";
import { resolveFollowCamera } from "./follow-camera.js";
const cameraDensity = (x, y, z) =>
  Math.max(caveDensity(x, y, z), height(x, z) - y);
export class CameraRig {
  constructor(camera, canvas, density = cameraDensity) {
    this.density = density;
    this.camera = camera;
    this.yaw = 0.2;
    this.pitch = 0.28;
    this.drag = false;
    this.first = false;
    this.distance = 5.5;
    this.obstructionOffset = 0;
    canvas.addEventListener("pointerdown", (e) => {
      this.drag = true;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointerup", () => (this.drag = false));
    canvas.addEventListener("pointermove", (e) => {
      if (this.drag) {
        this.yaw -= e.movementX * 0.004;
        this.pitch = T.MathUtils.clamp(
          this.pitch + e.movementY * 0.003,
          -0.35,
          0.85,
        );
      }
    });
    canvas.addEventListener(
      "wheel",
      (e) => {
        this.distance = T.MathUtils.clamp(
          this.distance + e.deltaY * 0.003,
          2.4,
          8,
        );
      },
      { passive: true },
    );
  }
  update(player, dt, groundY = height(player.x, player.z)) {
    const surface = restoreFrame(player.attachment);
    const up = surface?.normal ?? new T.Vector3(0, 1, 0);
    this.camera.up.copy(up);
    const target = new T.Vector3(player.x, groundY + 0.63, player.z);
    if (surface)
      target
        .copy(surface.position)
        .addScaledVector(up, 0.63 + surface.bodyLift);
    const forward = surface
      ? surface.forward.clone().applyAxisAngle(up, this.yaw)
      : new T.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    let desired;
    if (this.first) {
      desired = target.clone().addScaledVector(forward, 0.69);
      desired.addScaledVector(up, 0.04);
      desired = clipToFreeSpace(this.density, target, desired);
      const smoothed = this.camera.position
        .clone()
        .lerp(desired, 1 - Math.exp(-dt * 18));
      this.camera.position.copy(
        clipToFreeSpace(this.density, target, smoothed),
      );
      this.camera.lookAt(
        desired
          .clone()
          .addScaledVector(forward, 6)
          .addScaledVector(up, -Math.sin(this.pitch) * 3),
      );
    } else {
      const d = this.distance;
      const resolved = resolveFollowCamera(
        this.density,
        target,
        forward,
        up,
        d,
        this.pitch,
        this.obstructionOffset,
      );
      this.obstructionOffset = resolved.offset;
      desired = resolved.position;
      const smoothed = this.camera.position
        .clone()
        .lerp(desired, 1 - Math.exp(-dt * 8));
      this.camera.position.copy(
        clipToFreeSpace(this.density, target, smoothed),
      );
      this.camera.lookAt(target.clone().addScaledVector(forward, 0.7));
    }
  }
}
