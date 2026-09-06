# Ant Life RPG

A worker's life inside a living terrarium. Built with Three.js WebGPU, with automatic WebGL 2 fallback. Development is ongoing; the full vision is in [docs/vision.md](docs/vision.md).

## Run

Node 22 or newer. `npm ci`, then `npm run dev`. `npm run build` creates a static GitHub Pages compatible bundle. `npm test` verifies simulation invariants; `npm run lint` checks source.

## Development approach

Build and visually inspect a small connected colony before scaling up. Physical soil removal must produce conserved loose material. NPC identities and memories belong to the simulation, independently of their rendered bodies. Rendering quality and frame rates must be evaluated in actual gameplay.

The GitHub Actions workflow verifies every pull request and deploys main to Pages. Source assets and reproducible Blender scripts belong in this repository.

## Status

Initial foundation under active construction. This is not the finished vertical slice or the final graphical quality target.
