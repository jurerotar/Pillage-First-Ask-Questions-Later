import type { ApiHandler } from 'app/interfaces/api';
import type {
  UnitResearch,
  UnitResearchModel,
} from 'app/interfaces/models/game/unit-research';
import { unitResearchApiResource } from 'app/(game)/api/api-resources/unit-research-api-resource';

export const getResearchedUnits: ApiHandler<
  UnitResearch[],
  'villageId'
> = async (_queryClient, database, { params }) => {
  const { villageId: villageIdParam } = params;
  const villageId = Number.parseInt(villageIdParam);

  const unitResearchModels = database.selectObjects(
    'SELECT unit_id, village_id FROM unit_research WHERE village_id = ?;',
    [villageId],
  ) as UnitResearchModel[];

  return unitResearchModels.map(unitResearchApiResource);
};
