// Ground parcels and carried parcels share their shape, material and size.
export function applyItemAppearance(mesh, kind, appearances) {
  if (mesh.userData.itemKind === kind) return;
  const appearance = appearances[kind];
  if (!appearance) return;
  mesh.geometry = appearance.geometry;
  mesh.material = appearance.material;
  mesh.scale.set(...appearance.scale);
  mesh.userData.itemKind = kind;
}
