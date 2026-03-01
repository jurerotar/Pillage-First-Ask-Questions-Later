import type { Tribe } from '@pillage-first/types/models/tribe';
import type { Unit } from '@pillage-first/types/models/unit';
import { getUnitsByTribe } from '../utils/units.ts';

export const newVillageUnitResearchFactory = (tribe: Tribe): Unit['id'][] => {
  const unitsByTribe = getUnitsByTribe(tribe);
  const tier1Unit = unitsByTribe.at(0)!;
  const settlerUnit = unitsByTribe.find((unit) => unit.id.endsWith('SETTLER'))!;

  return [tier1Unit.id, settlerUnit.id];
};
