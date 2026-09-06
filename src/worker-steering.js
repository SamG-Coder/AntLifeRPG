// Local ground steering, using root-position clearance rather than full body
// collision. A slight right-hand preference breaks symmetric head-on choices.
export function workerStep(
  worker,
  target,
  step,
  workers,
  player,
  canWalk = () => true,
) {
  const dx = target.x - worker.x,
    dz = target.z - worker.z;
  const distance = Math.hypot(dx, dz);
  if (!distance) return { x: worker.x, z: worker.z };
  // Older overlap correction could push a saved worker beyond the boundary.
  // Recover toward nearby valid ground before normal local avoidance resumes.
  if (!canWalk(worker.x, worker.z)) {
    for (let radius = 0.2; radius <= 4; radius += 0.2) {
      let recovery = null,
        score = Infinity;
      for (let i = 0; i < 24; i++) {
        const angle = (i * Math.PI) / 12;
        const p = {
          x: worker.x + Math.cos(angle) * radius,
          z: worker.z + Math.sin(angle) * radius,
        };
        if (!canWalk(p.x, p.z)) continue;
        const d = Math.hypot(p.x - target.x, p.z - target.z);
        if (d < score) {
          score = d;
          recovery = p;
        }
      }
      if (recovery) {
        const fraction = Math.min(1, step / radius);
        return {
          x: worker.x + (recovery.x - worker.x) * fraction,
          z: worker.z + (recovery.z - worker.z) * fraction,
        };
      }
    }
    return { x: worker.x, z: worker.z };
  }
  const ux = dx / distance,
    uz = dz / distance;
  const neighbours = workers.filter(
    (n) =>
      n.id !== worker.id && Math.hypot(n.x - worker.x, n.z - worker.z) < 3.5,
  );
  if (
    player &&
    !player.attachment &&
    Math.hypot(player.x - worker.x, player.z - worker.z) < 3.5
  )
    neighbours.push(player);
  const look = Math.min(distance, 1.8);
  let best = { x: worker.x, z: worker.z },
    bestScore = -Infinity;
  for (const angle of [0, 0.35, -0.35, 0.7, -0.7, 1.05, -1.05, 1.4, -1.4]) {
    const c = Math.cos(angle),
      s = Math.sin(angle);
    const vx = ux * c - uz * s,
      vz = uz * c + ux * s;
    const candidate = { x: worker.x + vx * step, z: worker.z + vz * step };
    if (
      !canWalk(candidate.x, candidate.z) ||
      ![0.5, 1].every((t) =>
        canWalk(worker.x + vx * look * t, worker.z + vz * look * t),
      )
    )
      continue;
    let clearance = 1.5;
    for (const n of neighbours) {
      const rx = n.x - worker.x,
        rz = n.z - worker.z;
      const ahead = rx * vx + rz * vz;
      if (ahead <= 0) continue;
      const t = Math.min(look, ahead);
      clearance = Math.min(clearance, Math.hypot(rx - vx * t, rz - vz * t));
    }
    const score =
      c * 1.5 +
      clearance * 2 -
      Math.abs(angle) * 0.15 +
      (angle > 0 ? 0.025 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}
