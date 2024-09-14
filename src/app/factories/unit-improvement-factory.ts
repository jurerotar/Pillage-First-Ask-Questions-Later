import type { UnitTier } from 'interfaces/models/game/unit';
import type { UnitImprovement } from 'interfaces/models/game/unit-improvement';

const tiers: UnitTier[] = ['tier-1', 'tier-2', 'tier-3', 'scout', 'tier-4', 'tier-5', 'siege-ram', 'siege-catapult'];

export const unitImprovementFactory = (): UnitImprovement[] => {
  return tiers.map((tier) => {
    return {
      tier,
      level: 0,
    };
  });
};
