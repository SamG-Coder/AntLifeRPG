export const nutrition = {
  playerDrain: 0.024,
  workerDrain: 0.018,
  playerMeal: 25,
  workerMeal: 55,
  minutesPerSecond: 0.8,
};

export function dailyFoodDemand(workerCount) {
  const secondsPerDay = 1440 / nutrition.minutesPerSecond;
  return Math.ceil(
    secondsPerDay *
      ((workerCount * nutrition.workerDrain) / nutrition.workerMeal +
        nutrition.playerDrain / nutrition.playerMeal),
  );
}
