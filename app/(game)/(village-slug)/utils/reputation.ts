import { reputationLevels } from 'app/assets/reputation';
import type { ReputationLevel } from 'app/interfaces/models/game/reputation';

// Sort entries by threshold descending
const entries = Array.from(reputationLevels.entries()).toSorted(
  (a, b) => b[1] - a[1],
);

export const getReputationLevel = (value: number): ReputationLevel => {
  for (const [level, threshold] of entries) {
    if (value >= threshold) {
      return level;
    }
  }

  return 'hated';
};
