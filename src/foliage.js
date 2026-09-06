import * as T from "three/webgpu";
// Leaf venation is deliberately generated at macro scale, not a broad green fill.
export function leafTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 512, 512);
  g.addColorStop(0, "#5c712c");
  g.addColorStop(0.45, "#819447");
  g.addColorStop(1, "#3d5123");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = "#a5ad65";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.stroke();
  for (let i = 0; i < 17; i++)
    for (const side of [-1, 1]) {
      const y = i * 32;
      ctx.strokeStyle = "#bac17b66";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(256, y);
      ctx.bezierCurveTo(
        256 + side * 90,
        y + 20,
        256 + side * 200,
        y + 65,
        256 + side * 260,
        y + 95,
      );
      ctx.stroke();
      for (let j = 1; j < 8; j++) {
        ctx.strokeStyle = "#bdc58b22";
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(256 + side * j * 29, y + j * 10);
        ctx.lineTo(256 + side * (j + 2) * 29, y + j * 10 + 30);
        ctx.stroke();
      }
    }
  for (let i = 0; i < 24000; i++) {
    const x = (i * 97.37) % 512,
      y = (i * 37.91) % 512;
    ctx.fillStyle = i % 3 ? "#c8ce7b0a" : "#1a2a130d";
    ctx.fillRect(x, y, 1, 1);
  }
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  return t;
}
