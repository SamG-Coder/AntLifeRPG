import { sites, distance } from "./simulation.js";
const links = {
  home: ["store"],
  store: ["home", "dig", "surface"],
  dig: ["store", "spoil"],
  spoil: ["dig"],
  surface: ["store"],
};
export function scentRoute(position, destination) {
  if (!sites[destination]) return [];
  const nearest = Object.keys(sites).sort(
    (a, b) => distance(position, sites[a]) - distance(position, sites[b]),
  )[0];
  const queue = [[nearest]],
    seen = new Set();
  while (queue.length) {
    const path = queue.shift(),
      node = path.at(-1);
    if (node === destination) {
      const route = path.map((n) => ({ ...sites[n] }));
      if (destination === "dig") route.push({ x: -14, z: -27 });
      return route;
    }
    if (seen.has(node)) continue;
    seen.add(node);
    for (const next of links[node]) queue.push([...path, next]);
  }
  return [];
}
