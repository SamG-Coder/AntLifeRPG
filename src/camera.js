import * as T from "three/webgpu";
import { height, field, caveDensity } from "./world.js";
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
      this.camera.position.lerp(desired, 1 - Math.exp(-dt * 18));
      this.camera.lookAt(
        desired
          .clone()
          .addScaledVector(forward, 6)
          .add(new T.Vector3(0, -Math.sin(this.pitch) * 3, 0)),
      );
    } else {
      let d = this.distance;
      while (
        d > 1.15 &&
        field(
          target.x + Math.sin(this.yaw) * d,
          target.z + Math.cos(this.yaw) * d,
        ) > -0.2
      )
        d -= 0.15;
      desired = target
        .clone()
        .add(
          new T.Vector3(
            Math.sin(this.yaw) * d,
            Math.sin(this.pitch) * d + 1.1,
            Math.cos(this.yaw) * d,
          ),
        );
      for (let t = 0.05; t <= 1; t += 0.025) {
        const probe = target.clone().lerp(desired, t);
        if (caveDensity(probe.x, probe.y, probe.z) > -0.3) {
          desired = target.clone().lerp(desired, Math.max(0.1, t - 0.05));
          break;
        }
      }
      desired.y = Math.max(desired.y, height(desired.x, desired.z) + 0.32);
      if (
        caveDensity(
          this.camera.position.x,
          this.camera.position.y,
          this.camera.position.z,
        ) > -0.1
      )
        this.camera.position.copy(desired);
      else this.camera.position.lerp(desired, 1 - Math.exp(-dt * 8));
      this.camera.lookAt(target.clone().addScaledVector(forward, 0.7));
    }
  }
}
