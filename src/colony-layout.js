export const restingChambers = {
  westRest: { x: -13, z: -6, name: "The fern sleeping chamber" },
  eastRest: { x: 13, z: -6, name: "The moss sleeping chamber" },
};

export function restingPlace(id) {
  const chamber = id % 2 ? "eastRest" : "westRest";
  const slot = Math.floor(id / 2) % 12;
  const centre = restingChambers[chamber];
  return {
    chamber,
    x: centre.x + ((slot % 4) - 1.5) * 2.7,
    z: centre.z + (Math.floor(slot / 4) - 1) * 2.7,
  };
}
