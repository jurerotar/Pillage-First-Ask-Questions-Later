import { z } from 'zod';
import {
  calculateHuntersLodgeHuntCost,
  calculateHuntersLodgeHuntDuration,
  getHunterLodgeCatchableAnimals,
} from '@pillage-first/game-assets/utils/hunters-lodge';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { speedSchema } from '@pillage-first/types/models/server';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { randomArrayElement } from '@pillage-first/utils/random';
import { selectVillageEventExistsByTypeQuery } from '../../../queries/event-queries';
import { selectVillageAndFirstOasisTileIdsQuery } from '../../../queries/map-queries';
import { requireVillageBuildingLevel } from '../../../utils/buildings';
import {
  assessCaptureAnimalCountByIdQuestCompletion,
  assessCaptureAnimalKindCountQuestCompletion,
} from '../../../utils/quests';
import { insertHuntingPartyReport } from '../../../utils/report';
import { addTroops } from '../../../utils/troops';
import { defineEventResolver, type Resolver } from '../resolver';

const resolveHuntersLodgeHunt: Resolver<GameEvent<'huntersLodgeHunt'>> = (
  database,
  args,
) => {
  const { huntingPartyLevel, resolvesAt, villageId } = args;

  const huntersLodge = database.selectObject({
    sql: selectVillageAndFirstOasisTileIdsQuery,
    bind: {
      $village_id: villageId,
    },
    schema: z.strictObject({
      villageTileId: tileIdSchema,
      playerId: z.number(),
      sourceTileId: tileIdSchema,
    }),
  })!;

  const catchableAnimals = getHunterLodgeCatchableAnimals(huntingPartyLevel);
  const unitId = randomArrayElement(catchableAnimals);

  addTroops(database, [
    {
      unitId,
      amount: 1,
      tileId: huntersLodge.villageTileId,
      sourceTileId: huntersLodge.sourceTileId,
    },
  ]);

  insertHuntingPartyReport(database, {
    villageId,
    timestamp: resolvesAt,
    villageTileId: huntersLodge.villageTileId,
    unitId,
    amount: 1,
  });

  database.exec({
    sql: `
      INSERT INTO hunting_capture_history (player_id, unit_id, amount)
      SELECT $player_id, ui.id, 1
      FROM unit_ids ui
      WHERE ui.unit = $unit_id
      ON CONFLICT (player_id, unit_id) DO UPDATE SET
        amount = hunting_capture_history.amount + EXCLUDED.amount;
    `,
    bind: {
      $player_id: huntersLodge.playerId,
      $unit_id: unitId,
    },
  });

  assessCaptureAnimalCountByIdQuestCompletion(
    database,
    unitId,
    resolvesAt,
    huntersLodge.playerId,
  );
  assessCaptureAnimalKindCountQuestCompletion(
    database,
    resolvesAt,
    huntersLodge.playerId,
  );

  return {
    affectedVillageIds: [villageId],
    affectedTileIds: [huntersLodge.villageTileId],
  };
};

export const huntersLodgeHuntResolver = defineEventResolver<'huntersLodgeHunt'>(
  (database, event) => ({
    validate: () => {
      const { villageId } = event;
      const huntersLodgeLevel = requireVillageBuildingLevel(
        database,
        villageId,
        'HUNTERS_LODGE',
        "Hunter's Lodge does not exist",
      );

      if (event.huntingPartyLevel > huntersLodgeLevel) {
        throw new Error("Hunter's Lodge level is too low");
      }

      const hasOngoingHunt = database.selectValue({
        sql: selectVillageEventExistsByTypeQuery,
        bind: {
          $village_id: villageId,
          $type: 'huntersLodgeHunt',
        },
        schema: z.coerce.boolean(),
      });

      if (hasOngoingHunt) {
        throw new Error("Hunter's Lodge is busy");
      }
    },
    cost: () => {
      const isFreeHuntingPartiesEnabled = database.selectValue({
        sql: 'SELECT is_free_hunting_parties_enabled FROM developer_settings',
        schema: z.coerce.boolean(),
      });

      if (isFreeHuntingPartiesEnabled) {
        return [0, 0, 0, 0];
      }

      return calculateHuntersLodgeHuntCost(event.huntingPartyLevel);
    },
    duration: () => {
      const isInstantUnitTravelEnabled = database.selectValue({
        sql: 'SELECT is_instant_unit_travel_enabled FROM developer_settings',
        schema: z.coerce.boolean(),
      });

      if (isInstantUnitTravelEnabled) {
        return 0;
      }

      const speed = database.selectValue({
        sql: 'SELECT speed FROM servers LIMIT 1;',
        schema: speedSchema,
      })!;

      return calculateHuntersLodgeHuntDuration(event.huntingPartyLevel, speed);
    },
  }),
  resolveHuntersLodgeHunt,
);
