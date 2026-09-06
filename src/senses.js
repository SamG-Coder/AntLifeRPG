import * as T from "three/webgpu";
export class AntSenses {
  constructor(camera) {
    this.root = new T.Group();
    camera.add(this.root);
    this.feelers = [];
    this.mandibles = [];
    const cuticle = new T.MeshStandardMaterial({
      color: 0x52321a,
      roughness: 0.48,
    });
    for (const side of [-1, 1]) {
      const curve = new T.CatmullRomCurve3([
        new T.Vector3(side * 0.17, -0.16, -0.2),
        new T.Vector3(side * 0.25, -0.05, -0.35),
        new T.Vector3(side * 0.2, 0.01, -0.53),
        new T.Vector3(side * 0.1, -0.03, -0.65),
      ]);
      const feeler = new T.Mesh(
        new T.TubeGeometry(curve, 18, 0.008, 6, false),
        cuticle,
      );
      this.root.add(feeler);
      this.feelers.push(feeler);
      const clawCurve = new T.CatmullRomCurve3([
        new T.Vector3(side * 0.085, -0.16, -0.15),
        new T.Vector3(side * 0.11, -0.14, -0.28),
        new T.Vector3(side * 0.025, -0.12, -0.34),
      ]);
      const claw = new T.Mesh(
        new T.TubeGeometry(clawCurve, 12, 0.013, 6, false),
        cuticle,
      );
      this.root.add(claw);
      this.mandibles.push(claw);
    }
  }
  update(first, time, carrying) {
    this.root.visible = first;
    if (!first) return;
    for (let i = 0; i < 2; i++) {
      this.feelers[i].rotation.y = Math.sin(time * 1.8 + i * 2) * 0.12;
      this.feelers[i].rotation.x = Math.sin(time * 1.3 + i) * 0.06;
      this.mandibles[i].visible = carrying;
      this.mandibles[i].rotation.y =
        Math.sin(time * 3) * (carrying ? 0.015 : 0.05);
    }
  }
}
