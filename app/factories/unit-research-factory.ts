import type { Tribe } from 'app/interfaces/models/game/tribe';
import type { UnitResearch } from 'app/interfaces/models/game/unit-research';
import type { Village } from 'app/interfaces/models/game/village';
import { getUnitsByTribe } from 'app/assets/utils/units';

export const newVillageUnitResearchFactory = (
  villageId: Village['id'],
  tribe: Tribe,
): UnitResearch[] => {
  const unitsByTribe = getUnitsByTribe(tribe);

  const tier1Unit = unitsByTribe.find(({ tier }) => tier === 'tier-1')!;

  return [
    {
      villageId,
      unitId: tier1Unit.id,
    },
  ];
};
