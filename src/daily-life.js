// Deliberately stylised game rhythms, not a species-specific biological model.
export function onDuty(worker, minutes) {
  if (worker.role === "forager") return minutes >= 360 && minutes < 1080;
  const local = (minutes + (Math.floor(worker.id / 3) % 3) * 480) % 1440;
  return local >= 360;
}

export function updateNeeds(worker, dt) {
  worker.hunger ??= 80 + (worker.id % 5) * 3;
  worker.hunger = Math.max(0, worker.hunger - dt * 0.018);
  const settled = worker.task === "off-duty" && !worker.path?.length;
  worker.energy = Math.max(
    0,
    Math.min(
      100,
      worker.energy + dt * (settled ? 0.22 : worker.cargo ? -0.045 : -0.025),
    ),
  );
  if (worker.energy < 25) worker.recovering = true;
  if (worker.energy >= 85) worker.recovering = false;
}

export function breakReason(worker, minutes) {
  if (worker.hunger < 35) return "meal";
  if (worker.recovering) return "fatigue";
  if (!onDuty(worker, minutes)) return "sleep";
  return null;
}

export function activityLabel(worker) {
  if (worker.task === "off-duty") {
    if (worker.path?.length)
      return worker.breakReason === "meal"
        ? "Returning for food"
        : "Returning to rest";
    return (
      {
        meal: "Waiting for food",
        fatigue: "Recovering",
        sleep: "Resting between shifts",
      }[worker.breakReason] ?? "Available for work"
    );
  }
  return (
    {
      carry: "Hauling a load",
      loosen: "Loosening soil",
      excavate: "Excavating",
      forage: "Gathering seeds",
      collect: "Collecting soil",
      "await-load": "Waiting for a load",
      commute: "Travelling to work",
      rest: "Pausing after delivery",
    }[worker.task] ?? "Waking"
  );
}
