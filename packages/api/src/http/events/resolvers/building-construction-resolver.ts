import { z } from 'zod';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { createBuildingPlaceholder } from '../../../utils/building-placeholder';
import { assertBuildingConstructionRequirementsAreMet } from '../../../utils/building-requirements';
import { getVillageTileId } from '../../../utils/village';
import { defineEventResolver, type Resolver } from '../resolver';
import { validateBuildingQueue } from './building-event-helpers';

const resolveBuildingConstruction: Resolver<
  GameEvent<'buildingConstruction'>
> = (database, args, createEvents) => {
  const {
    villageId,
    buildingFieldId,
    buildingId,
    level,
    previousLevel,
    startsAt,
  } = args;

  createBuildingPlaceholder(database, villageId, buildingFieldId, buildingId);

  createEvents<'buildingLevelChange'>(database, {
    villageId,
    level,
    previousLevel,
    startsAt,
    buildingFieldId,
    buildingId,
    type: 'buildingLevelChange',
  });

  return {
    affectedVillageIds: [villageId],
    affectedTileIds: [getVillageTileId(database, villageId)],
  };
};

export const buildingConstructionResolver =
  defineEventResolver<'buildingConstruction'>(
    (database, event) => ({
      validate: () => {
        const { villageId, buildingFieldId, buildingId } = event;
        validateBuildingQueue(database, villageId, buildingFieldId);

        const isBuildingFieldOccupied = database.selectValue({
          sql: `
            SELECT EXISTS (
              SELECT 1
              FROM
                building_fields
              WHERE
                village_id = $village_id
                AND field_id = $building_field_id
                AND level > 0
            ) AS is_occupied;
          `,
          bind: {
            $village_id: villageId,
            $building_field_id: buildingFieldId,
          },
          schema: z.coerce.boolean(),
        });

        if (isBuildingFieldOccupied) {
          throw new Error('Building field is already occupied');
        }

        assertBuildingConstructionRequirementsAreMet(
          database,
          villageId,
          buildingId,
          { buildingFieldId },
        );
      },
      duration: () => 0,
    }),
    resolveBuildingConstruction,
  );
