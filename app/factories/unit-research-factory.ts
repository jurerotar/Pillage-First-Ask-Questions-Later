import type { Tribe } from 'app/interfaces/models/game/tribe';
import type { UnitResearch } from 'app/interfaces/models/game/unit-research';
import type { Village } from 'app/interfaces/models/game/village';
import { getUnitsByTribe } from 'app/(game)/(village-slug)/utils/units';

export const newVillageUnitResearchFactory = (villageId: Village['id'], tribe: Tribe): UnitResearch[] => {
  const unitsByTribe = getUnitsByTribe(tribe);
  const researchableUnits = unitsByTribe.filter((unit) => !unit.id.includes('SETTLER'));

  return researchableUnits.map((unit) => {
    return {
      unitId: unit.id,
      villageId,
      isResearched: unit.tier === 'tier-1',
    };
  });
};
