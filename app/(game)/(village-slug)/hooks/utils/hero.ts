export const calculateHeroLevel = (currentExp: number) => {
  let level = 0;
  let expForNextLevel = 0;

  while (true) {
    const nextExp = 50 * (level + 1);
    if (currentExp < expForNextLevel + nextExp) {
      break;
    }

    expForNextLevel += nextExp;
    level++;
  }

  const totalExpForNextLevel = expForNextLevel + 50 * (level + 1);
  const expToNextLevel = totalExpForNextLevel - currentExp;

  return { level, expToNextLevel };
};
