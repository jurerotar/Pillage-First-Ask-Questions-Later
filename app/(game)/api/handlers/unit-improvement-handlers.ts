import type { ApiHandler } from 'app/interfaces/api';
import type {
  UnitImprovement,
  UnitImprovementModel,
} from 'app/interfaces/models/game/unit-improvement';
import { unitImprovementApiResource } from 'app/(game)/api/api-resources/unit-improvement-api-resource';

export const getUnitImprovements: ApiHandler<UnitImprovement[]> = async (
  _queryClient,
  database,
) => {
  const unitImprovementModel = database.selectObjects(
    'SELECT unit_id, level FROM unit_improvements;',
  ) as UnitImprovementModel[];

  return unitImprovementModel.map(unitImprovementApiResource);
};
