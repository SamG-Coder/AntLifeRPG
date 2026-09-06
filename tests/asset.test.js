import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("shipped ant GLB has valid geometry and its anatomical source components", () => {
  const bytes = fs.readFileSync(
    new URL("../public/assets/worker-ant.glb", import.meta.url),
  );
  assert.equal(bytes.toString("ascii", 0, 4), "glTF");
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  const length = bytes.readUInt32LE(12);
  const gltf = JSON.parse(bytes.toString("utf8", 20, 20 + length));
  const names = gltf.nodes.map((n) => n.name).join(" ");
  for (const part of [
    "Mesosoma",
    "Gaster",
    "Head",
    "Mandible",
    "Antenna",
    "Coxa",
  ])
    assert.ok(names.includes(part), part);
  assert.equal(gltf.nodes.filter((n) => n.name?.startsWith("Coxa")).length, 6);
  for (const mesh of gltf.meshes)
    for (const primitive of mesh.primitives) {
      assert.ok(primitive.attributes.POSITION !== undefined);
      assert.ok(primitive.attributes.NORMAL !== undefined);
      assert.ok(gltf.accessors[primitive.attributes.POSITION].count > 0);
    }
});
