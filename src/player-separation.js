export function separateWorkersFromPlayer(workers, player, dt, canWalk) {
  if (player.attachment) return;
  for (const n of workers) {
    const d = Math.hypot(n.x - player.x, n.z - player.z);
    if (d >= 1.15 || d <= 0.001) continue;
    const force = Math.min(0.06, (1.15 - d) * dt * 4);
    const x = n.x + ((n.x - player.x) / d) * force;
    const z = n.z + ((n.z - player.z) / d) * force;
    if (canWalk(x, z)) {
      n.x = x;
      n.z = z;
    }
  }
}
