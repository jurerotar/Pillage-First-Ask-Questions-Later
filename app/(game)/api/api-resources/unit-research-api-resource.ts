import type {
  UnitResearch,
  UnitResearchModel,
} from 'app/interfaces/models/game/unit-research';

export const unitResearchApiResource = (
  unitResearchModel: UnitResearchModel,
): UnitResearch => {
  const { unit_id, village_id } = unitResearchModel;

  return {
    unitId: unit_id,
    villageId: village_id,
  };
};
