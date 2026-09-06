import * as T from "three/webgpu";
import { height, caveDensity } from "./world.js";
import { clipToFreeSpace } from "./contact.js";
const cameraDensity = (x, y, z) =>
  Math.max(caveDensity(x, y, z), height(x, z) - y);
export class CameraRig {
  constructor(camera, canvas) {
    this.camera = camera;
    this.yaw = 0.2;
    this.pitch = 0.28;
    this.drag = false;
    this.first = false;
    this.distance = 5.5;
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
  update(player, dt) {
    const target = new T.Vector3(
      player.x,
      height(player.x, player.z) + 0.63,
      player.z,
    );
    const forward = new T.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    let desired;
    if (this.first) {
      desired = target.clone().addScaledVector(forward, 0.69);
      desired.y += 0.04;
      desired = clipToFreeSpace(cameraDensity, target, desired);
      const smoothed = this.camera.position
        .clone()
        .lerp(desired, 1 - Math.exp(-dt * 18));
      this.camera.position.copy(
        clipToFreeSpace(cameraDensity, target, smoothed),
      );
      this.camera.lookAt(
        desired
          .clone()
          .addScaledVector(forward, 6)
          .add(new T.Vector3(0, -Math.sin(this.pitch) * 3, 0)),
      );
    } else {
      const d = this.distance;
      desired = target
        .clone()
        .add(
          new T.Vector3(
            Math.sin(this.yaw) * d,
            Math.sin(this.pitch) * d + 1.1,
            Math.cos(this.yaw) * d,
          ),
        );
      desired = clipToFreeSpace(cameraDensity, target, desired);
      const smoothed = this.camera.position
        .clone()
        .lerp(desired, 1 - Math.exp(-dt * 8));
      this.camera.position.copy(
        clipToFreeSpace(cameraDensity, target, smoothed),
      );
      this.camera.lookAt(target.clone().addScaledVector(forward, 0.7));
    }
  }
}
