import { reputationLevels } from '@pillage-first/game-assets/reputation';
import type { ReputationLevel } from '@pillage-first/types/models/reputation';

const entries = [...reputationLevels.entries()];

export const getReputationLevel = (value: number | null): ReputationLevel => {
  if (value === null) {
    return 'player';
  }

  for (let i = entries.length - 1; i >= 0; i -= 1) {
    const [level, threshold] = entries[i];

    if (value >= threshold) {
      return level;
    }
  }

  return 'hated';
};
