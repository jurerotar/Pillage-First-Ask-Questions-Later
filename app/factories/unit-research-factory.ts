import { units } from 'app/(game)/(village-slug)/assets/units';
import type { Tribe } from 'app/interfaces/models/game/tribe';
import type { UnitResearch } from 'app/interfaces/models/game/unit-research';
import type { Village } from 'app/interfaces/models/game/village';

type UnitResearchFactoryProps = {
  initialVillageId: Village['id'];
  tribe: Tribe;
};

export const unitResearchFactory = ({ initialVillageId, tribe }: UnitResearchFactoryProps): UnitResearch[] => {
  const unitsByTribe = units.filter((unit) => unit.tribe === tribe && !unit.id.includes('SETTLER'));

  return unitsByTribe.map((unit) => {
    return {
      unitId: unit.id,
      researchedIn: [...(unit.tier === 'tier-1' ? [initialVillageId] : [])],
    };
  });
};
