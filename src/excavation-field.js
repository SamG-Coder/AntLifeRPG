export function excavationDensity(removed) {
  const holes = removed.map((id) => {
    const [x, y, z] = id.split(":").map(Number);
    return [-16.3 + x * 0.67, y * 0.58 + 0.2, -28.5 - z * 0.6];
  });
  return (x, y, z) => {
    let value = Math.min(
      x + 16.8,
      -11.8 - x,
      y + 0.1,
      3.1 - y,
      z + 30.2,
      -28.12 - z,
    );
    value += Math.sin(x * 8 + y * 5) * Math.sin(z * 9 - y * 3) * 0.065;
    for (const h of holes) {
      // A cavity cannot lower a density already below its minimum (-radius).
      const reach = value + 0.56;
      if (reach <= 0) break;
      const dx = x - h[0],
        dy = y - h[1],
        dz = z - h[2];
      if (
        Math.abs(dx) >= reach ||
        Math.abs(dy) >= reach ||
        Math.abs(dz) >= reach
      )
        continue;
      const squared = dx * dx + dy * dy + dz * dz;
      if (squared < reach * reach) value = Math.sqrt(squared) - 0.56;
    }
    return value;
  };
}
