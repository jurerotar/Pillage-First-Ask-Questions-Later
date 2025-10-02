import type { Unit } from 'app/interfaces/models/game/unit';
import type { UnitImprovement } from 'app/interfaces/models/game/unit-improvement';
import { getUnitsByTribe } from 'app/assets/utils/units';
import type { Tribe } from 'app/interfaces/models/game/tribe';

const upgradableTiers: Unit['tier'][] = [
  'tier-1',
  'tier-2',
  'tier-3',
  'scout',
  'tier-4',
  'tier-5',
  'siege-ram',
  'siege-catapult',
];

export const unitImprovementFactory = (tribe: Tribe): UnitImprovement[] => {
  const unitsByTribe = getUnitsByTribe(tribe);

  const upgradableUnits = unitsByTribe.filter(({ tier }) => {
    return upgradableTiers.includes(tier);
  });

  return upgradableUnits.map(({ id }) => {
    return {
      unitId: id,
      level: 0,
    };
  });
};
