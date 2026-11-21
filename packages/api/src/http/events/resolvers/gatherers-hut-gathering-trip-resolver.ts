import { z } from 'zod';
import {
  calculateGatherersHutGatheringDuration,
  calculateGatherersHutGatheringResources,
  calculateGatherersHutPartySize,
} from '@pillage-first/game-assets/utils/gatherers-hut';
import { getUnitDefinition } from '@pillage-first/game-assets/utils/units';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { speedSchema } from '@pillage-first/types/models/server';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { playableTribeSchema } from '@pillage-first/types/models/tribe';
import { selectVillageEventExistsByTypeQuery } from '../../../queries/event-queries';
import { requireVillageBuildingLevel } from '../../../utils/buildings';
import { assessGatheredResourceCountQuestCompletion } from '../../../utils/quests';
import { insertGatheringExpeditionReport } from '../../../utils/report';
import { addTroops, removeTroops } from '../../../utils/troops';
import { addResourceSiteResourcesAt } from '../../../utils/village';
import { defineEventResolver, type Resolver } from '../resolver';

const resolveGatherersHutGatheringTrip: Resolver<
  GameEvent<'gatherersHutGatheringTrip'>
> = (database, args) => {
  const { resolvesAt, troops, villageId } = args;

  let sentTroopAmount = 0;

  for (const troop of troops) {
    sentTroopAmount += troop.amount;
  }

  const loot = calculateGatherersHutGatheringResources(sentTroopAmount);

  addTroops(database, troops);

  const village = database.selectObject({
    sql: `
      SELECT v.tile_id, v.player_id, p.tribe_id
      FROM villages v JOIN players p ON p.id = v.player_id
      WHERE v.id = $village_id;
    `,
    bind: { $village_id: villageId },
    schema: z.strictObject({
      tile_id: tileIdSchema,
      player_id: z.number(),
      tribe_id: z.int(),
    }),
  })!;

  addResourceSiteResourcesAt(database, village.tile_id, resolvesAt, loot);

  insertGatheringExpeditionReport(database, {
    villageId,
    timestamp: resolvesAt,
    villageTileId: village.tile_id,
    tribeId: village.tribe_id,
    loot,
    units: troops,
  });

  assessGatheredResourceCountQuestCompletion(
    database,
    resolvesAt,
    village.player_id,
  );

  database.exec({
    sql: `
      INSERT INTO gatherers_hut_expeditions (village_id, completed)
      VALUES ($village_id, 1)
      ON CONFLICT(village_id) DO UPDATE SET
        completed = completed + 1;
    `,
    bind: {
      $village_id: villageId,
    },
  });

  return {
    affectedVillageIds: [villageId],
    affectedTileIds: [village.tile_id],
  };
};

export const gatherersHutGatheringTripResolver =
  defineEventResolver<'gatherersHutGatheringTrip'>(
    (database, event) => ({
      validate: () => {
        const { villageId, troops } = event;

        const gatherersHutLevel = requireVillageBuildingLevel(
          database,
          villageId,
          'GATHERERS_HUT',
          "Gatherer's Hut does not exist",
        );

        const hasOngoingGatheringTrip = database.selectValue({
          sql: selectVillageEventExistsByTypeQuery,
          bind: {
            $village_id: villageId,
            $type: 'gatherersHutGatheringTrip',
          },
          schema: z.coerce.boolean(),
        });

        if (hasOngoingGatheringTrip) {
          throw new Error("Gatherer's Hut is busy");
        }

        const { villageTileId, playerTribe } = database.selectObject({
          sql: `
            SELECT
              v.tile_id AS villageTileId,
              ti.tribe AS playerTribe
            FROM
              villages v
              JOIN players p ON p.id = v.player_id
              JOIN tribe_ids ti ON ti.id = p.tribe_id
            WHERE
              v.id = $village_id;
          `,
          bind: { $village_id: villageId },
          schema: z.strictObject({
            villageTileId: tileIdSchema,
            playerTribe: playableTribeSchema,
          }),
        })!;

        let troopAmount = 0;
        const troopAmountsByUnitId = new Map<string, number>();

        for (const troop of troops) {
          const unit = getUnitDefinition(troop.unitId);

          if (unit.id === 'HERO') {
            throw new Error('Gathering trips can only include regular troops');
          }

          if (unit.tribe !== playerTribe) {
            throw new Error(
              "Gathering trips can only include troops from player's tribe",
            );
          }

          if (
            troop.tileId !== villageTileId ||
            troop.sourceTileId !== villageTileId
          ) {
            throw new Error(
              'Gathering trips can only include idle home troops',
            );
          }

          troopAmount += troop.amount;
          troopAmountsByUnitId.set(
            troop.unitId,
            (troopAmountsByUnitId.get(troop.unitId) ?? 0) + troop.amount,
          );
        }

        const maxPartySize = calculateGatherersHutPartySize(gatherersHutLevel);

        if (troopAmount > maxPartySize) {
          throw new Error("Gatherer's Hut party size exceeded");
        }

        if (troopAmountsByUnitId.size === 1) {
          const [unitId, amount] = troopAmountsByUnitId.entries().next().value!;
          const availableTroops =
            database.selectValue({
              sql: `
                SELECT t.amount
                FROM
                  troops t
                  JOIN unit_ids ui ON ui.id = t.unit_id
                WHERE
                  ui.unit = $unit_id
                  AND t.tile_id = $tile_id
                  AND t.source_tile_id = $tile_id;
              `,
              bind: {
                $unit_id: unitId,
                $tile_id: villageTileId,
              },
              schema: z.number(),
            }) ?? 0;

          if (amount > availableTroops) {
            throw new Error('Not enough idle troops available');
          }
          return;
        }

        const hasUnavailableTroops = database.selectValue({
          sql: `
            WITH requested_troops AS (
              SELECT
                unit_ids.id AS unit_id,
                json_extract(troop.value, '$.amount') AS amount
              FROM
                json_each($troops) AS troop
                JOIN unit_ids
                  ON unit_ids.unit = json_extract(troop.value, '$.unitId')
            )
            SELECT EXISTS (
              SELECT 1
              FROM
                requested_troops
                LEFT JOIN troops
                  ON troops.unit_id = requested_troops.unit_id
                  AND troops.tile_id = $tile_id
                  AND troops.source_tile_id = $tile_id
              WHERE
                COALESCE(troops.amount, 0) < requested_troops.amount
            );
          `,
          bind: {
            $troops: JSON.stringify(
              [...troopAmountsByUnitId].map(([unitId, amount]) => ({
                unitId,
                amount,
              })),
            ),
            $tile_id: villageTileId,
          },
          schema: z.coerce.boolean(),
        })!;

        if (hasUnavailableTroops) {
          throw new Error('Not enough idle troops available');
        }
      },
      duration: () => {
        const isInstantUnitTravelEnabled = database.selectValue({
          sql: 'SELECT is_instant_unit_travel_enabled FROM developer_settings',
          schema: z.coerce.boolean(),
        });

        if (isInstantUnitTravelEnabled) {
          return 0;
        }

        const { completedGatheringTripCount, seed, speed } =
          database.selectObject({
            sql: `
              SELECT
                (
                  SELECT seed
                  FROM
                    servers
                  LIMIT 1
                ) AS seed,
                (
                  SELECT speed
                  FROM
                    servers
                  LIMIT 1
                ) AS speed,
                COALESCE((
                  SELECT completed
                  FROM
                    gatherers_hut_expeditions
                  WHERE
                    village_id = $village_id
                ), 0) AS completedGatheringTripCount;
            `,
            bind: {
              $village_id: event.villageId,
            },
            schema: z.strictObject({
              seed: z.string(),
              speed: speedSchema,
              completedGatheringTripCount: z.number(),
            }),
          })!;

        return calculateGatherersHutGatheringDuration(
          seed,
          speed,
          event.villageId,
          completedGatheringTripCount,
        );
      },
      afterInsert: () => {
        removeTroops(database, event.troops);
      },
    }),
    resolveGatherersHutGatheringTrip,
  );
