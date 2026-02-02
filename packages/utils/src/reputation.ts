import { reputationLevels } from '@pillage-first/game-assets/reputation';
import type { ReputationLevel } from '@pillage-first/types/models/reputation';

// Sort entries by threshold descending
const entries = [...reputationLevels.entries()].toSorted(
  (a, b) => b[1] - a[1],
);

export const getReputationLevel = (value: number | null): ReputationLevel => {
  if (value === null) {
    return 'player';
  }

  for (const [level, threshold] of entries) {
    if (value >= threshold) {
      return level;
    }
  }

  return 'hated';
};
