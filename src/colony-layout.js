export const restingChambers = {
  westRest: { x: -13, z: -6, name: "The fern sleeping chamber" },
  eastRest: { x: 13, z: -6, name: "The moss sleeping chamber" },
};

export function restingExit(chamber) {
  const centre = restingChambers[chamber];
  return { x: centre.x + (centre.x < 0 ? 5 : -5), z: centre.z };
}

export function restingPlace(id) {
  const chamber = id % 2 ? "eastRest" : "westRest";
  const slot = Math.floor(id / 2) % 12;
  const centre = restingChambers[chamber];
  return {
    chamber,
    x: centre.x + ((slot % 6) - 2.5) * 2.15,
    z: centre.z + (slot < 6 ? -2.7 : 2.7),
    yaw: slot < 6 ? Math.PI : 0,
  };
}
