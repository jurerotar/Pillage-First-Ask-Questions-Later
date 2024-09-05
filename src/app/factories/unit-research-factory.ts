import { units } from 'assets/units';
import type { Tribe } from 'interfaces/models/game/tribe';
import type { UnitResearch } from 'interfaces/models/game/unit-research';
import type { Village } from 'interfaces/models/game/village';

type UnitResearchFactoryProps = {
  initialVillageId: Village['id'];
  tribe: Tribe;
};

export const unitResearchFactory = ({ initialVillageId, tribe }: UnitResearchFactoryProps): UnitResearch[] => {
  const unitsByTribe = units.filter((unit) => unit.tribe === tribe);

  return unitsByTribe.map((unit) => {
    return {
      unitId: unit.id,
      researchedIn: [...(unit.researchCost === null ? [initialVillageId] : [])],
    };
  });
};
