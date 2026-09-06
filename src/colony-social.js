import { breakReason } from "./daily-life.js";
import { advanceGrooming } from "./grooming.js";

const near = (a, b) => Math.hypot(a.x - b.x, a.z - b.z) <= 2.8;
const available = (n, time) =>
  n.workVersion && !(n.greetingRemaining > 0) && !breakReason(n, time);
function finish(a, b, day, completed) {
  for (const [worker, other] of [
    [a, b],
    [b, a],
  ]) {
    if (!worker) continue;
    if (worker.encounterKind === "groom") {
      worker.groomRemaining = 0;
      if (completed) {
        worker.sharedGroomingBouts = (worker.sharedGroomingBouts ?? 0) + 1;
        worker.lastSharedGroomDay = day;
      }
    }
    if (completed && other) {
      worker.bonds ??= [];
      let bond = worker.bonds.find((entry) => entry.id === other.id);
      if (!bond) {
        bond = { id: other.id, meetings: 0, lastDay: 0 };
        worker.bonds.push(bond);
      }
      if (bond.lastDay !== day) {
        bond.meetings++;
        bond.lastDay = day;
      }
    }
    worker.encounterPartner = null;
    worker.encounterKind = null;
    worker.encounterRemaining = 0;
    worker.socialCooldown = 45 + (worker.id % 5) * 4;
  }
}

export function clearScentPath(a, b, density, height) {
  const ay = height(a.x, a.z) + 0.65,
    by = height(b.x, b.z) + 0.65;
  const steps = Math.max(
    1,
    Math.ceil(Math.hypot(a.x - b.x, ay - by, a.z - b.z) / 0.12),
  );
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (
      density(
        a.x + (b.x - a.x) * t,
        ay + (by - ay) * t,
        a.z + (b.z - a.z) * t,
      ) >= 0
    )
      return false;
  }
  return true;
}

export function encounterPreference(a, b) {
  const familiarity = Math.min(
    3,
    a.bonds?.find((bond) => bond.id === b.id)?.meetings ?? 0,
  );
  return familiarity * 0.35 - Math.hypot(a.x - b.x, a.z - b.z);
}

export function updateWorkerEncounters(
  state,
  dt,
  canMeet = () => true,
  hasWork = () => false,
) {
  const workers = state.npcs;
  const idle = (n) =>
    n.task === "off-duty" && !n.path?.length && !n.cargo && !hasWork(n);
  const sharedBreak = (a, b) =>
    idle(a) &&
    idle(b) &&
    a.lastSharedGroomDay !== state.day &&
    b.lastSharedGroomDay !== state.day &&
    ((a.cleanliness ?? 78) < 85 || (b.cleanliness ?? 78) < 85) &&
    a.bonds?.some((bond) => bond.id === b.id) &&
    b.bonds?.some((bond) => bond.id === a.id);
  for (const n of workers)
    n.socialCooldown = Math.max(0, (n.socialCooldown ?? 20 + n.id * 0.7) - dt);
  const visited = new Set();
  for (const a of workers) {
    if (!(a.encounterRemaining > 0) || visited.has(a.id)) continue;
    const b = workers.find((n) => n.id === a.encounterPartner);
    visited.add(a.id);
    if (b) visited.add(b.id);
    if (
      !b ||
      b.encounterPartner !== a.id ||
      !available(a, state.time) ||
      !available(b, state.time) ||
      !near(a, b) ||
      !canMeet(a, b) ||
      (a.encounterKind === "groom" && (!idle(a) || !idle(b)))
    ) {
      finish(a, b?.encounterPartner === a.id ? b : null, state.day, false);
      continue;
    }
    if (a.encounterKind === "groom") {
      advanceGrooming(a, Math.min(dt, a.encounterRemaining));
      advanceGrooming(b, Math.min(dt, a.encounterRemaining));
    }
    a.encounterRemaining = Math.max(0, a.encounterRemaining - dt);
    b.encounterRemaining = a.encounterRemaining;
    if (!a.encounterRemaining) finish(a, b, state.day, true);
  }
  let active = workers.filter((n) => n.encounterRemaining > 0).length / 2;
  for (const a of workers) {
    if (active >= 2) break;
    if (
      !available(a, state.time) ||
      (a.socialCooldown > 0 && !idle(a)) ||
      a.encounterRemaining > 0
    )
      continue;
    const b = workers
      .filter(
        (n) =>
          n.id !== a.id &&
          available(n, state.time) &&
          (n.socialCooldown === 0 || sharedBreak(a, n)) &&
          !(n.encounterRemaining > 0) &&
          near(a, n) &&
          canMeet(a, n) &&
          (sharedBreak(a, n) ||
            (a.socialCooldown === 0 &&
              !a.bonds?.some(
                (bond) => bond.id === n.id && bond.lastDay === state.day,
              ))),
      )
      .sort(
        (left, right) =>
          encounterPreference(a, right) - encounterPreference(a, left) ||
          left.id - right.id,
      )[0];
    if (!b) continue;
    const together = sharedBreak(a, b);
    for (const [worker, other] of [
      [a, b],
      [b, a],
    ]) {
      worker.encounterPartner = other.id;
      worker.encounterKind = together ? "groom" : "scent";
      worker.encounterRemaining = together ? 8 : 2.4;
      worker.groomRemaining = together ? 8 : 0;
    }
    active++;
  }
}

export function validWorkerBonds(worker, ids) {
  if (
    worker.encounterKind != null &&
    !["scent", "groom"].includes(worker.encounterKind)
  )
    return false;
  if (
    worker.sharedGroomingBouts !== undefined &&
    (!Number.isInteger(worker.sharedGroomingBouts) ||
      worker.sharedGroomingBouts < 0)
  )
    return false;
  if (
    worker.lastSharedGroomDay !== undefined &&
    (!Number.isInteger(worker.lastSharedGroomDay) ||
      worker.lastSharedGroomDay < 1)
  )
    return false;
  if (
    worker.encounterRemaining !== undefined &&
    (!Number.isFinite(worker.encounterRemaining) ||
      worker.encounterRemaining < 0 ||
      worker.encounterRemaining > (worker.encounterKind === "groom" ? 8 : 2.4))
  )
    return false;
  if (
    worker.socialCooldown !== undefined &&
    (!Number.isFinite(worker.socialCooldown) || worker.socialCooldown < 0)
  )
    return false;
  if (
    worker.encounterPartner != null &&
    (!ids.has(worker.encounterPartner) || worker.encounterPartner === worker.id)
  )
    return false;
  return (
    worker.bonds === undefined ||
    (Array.isArray(worker.bonds) &&
      worker.bonds.length <= ids.size - 1 &&
      new Set(worker.bonds.map((b) => b?.id)).size === worker.bonds.length &&
      worker.bonds.every(
        (b) =>
          b &&
          b.id !== worker.id &&
          ids.has(b.id) &&
          Number.isInteger(b.meetings) &&
          b.meetings >= 1 &&
          Number.isInteger(b.lastDay) &&
          b.lastDay >= 1,
      ))
  );
}
