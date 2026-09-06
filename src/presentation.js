import { RenderPipeline } from "three/webgpu";
import { pass, vec4, mix, float, renderOutput } from "three/tsl";
import { ao } from "three/addons/tsl/display/GTAONode.js";
import { denoise } from "three/addons/tsl/display/DenoiseNode.js";
import { fxaa } from "three/addons/tsl/display/FXAANode.js";

/** Ground contact and cavity shading, shared by gameplay and unretouched captures. */
export class Presentation {
  constructor(renderer, scene, camera, quality = "balanced") {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.pipeline = new RenderPipeline(renderer);
    this.scenePass = pass(scene, camera, { samples: 0 });
    const sceneColor = this.scenePass.getTextureNode("output"),
      depth = this.scenePass.getTextureNode("depth");
    this.occlusion = ao(depth, null, camera);
    this.occlusion.radius.value = 0.55;
    this.occlusion.thickness.value = 0.3;
    this.occlusion.samples.value = 16;
    const softened = denoise(
      this.occlusion.getTextureNode(),
      depth,
      null,
      camera,
    );
    const shaded = vec4(
      sceneColor.rgb.mul(mix(float(1), softened.r, 0.72)),
      sceneColor.a,
    );
    this.pipeline.outputColorTransform = false;
    this.pipeline.outputNode = fxaa(
      renderOutput(shaded, renderer.toneMapping, renderer.outputColorSpace),
    );
    this.setQuality(quality);
  }
  setQuality(quality) {
    this.quality = ["low", "balanced", "high"].includes(quality)
      ? quality
      : "balanced";
    this.occlusion.resolutionScale = this.quality === "high" ? 1 : 0.5;
  }
  render() {
    if (this.quality === "low") this.renderer.render(this.scene, this.camera);
    else this.pipeline.render();
  }
}
