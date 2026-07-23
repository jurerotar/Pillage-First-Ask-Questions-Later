import { z } from 'zod';
import { calculateGatherersHutGatheringResources } from '@pillage-first/game-assets/utils/gatherers-hut';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { insertReport } from '../../../utils/report';
import { addTroops } from '../../../utils/troops';
import { addVillageResourcesAt } from '../../../utils/village';
import type { Resolver } from '../resolver';

export const gatherersHutGatheringTripResolver: Resolver<
  GameEvent<'gatherersHutGatheringTrip'>
> = (database, args) => {
  const { resolvesAt, troops, villageId } = args;

  let sentTroopAmount = 0;

  for (const troop of troops) {
    sentTroopAmount += troop.amount;
  }

  const loot = calculateGatherersHutGatheringResources(sentTroopAmount);

  addTroops(database, troops);

  addVillageResourcesAt(database, villageId, resolvesAt, loot);

  const village = database.selectObject({
    sql: `
      SELECT v.tile_id, p.tribe_id
      FROM villages v JOIN players p ON p.id = v.player_id
      WHERE v.id = $village_id;
    `,
    bind: { $village_id: villageId },
    schema: z.strictObject({
      tile_id: z.int(),
      tribe_id: z.int(),
    }),
  })!;

  const reportId = insertReport(database, {
    villageId,
    timestamp: resolvesAt,
    type: 'gatheringExpedition',
    outcome: 'gatheringExpedition',
    tags: [],
  });

  const gatheringExpeditionReportId = database.selectValue({
    sql: `
      INSERT INTO gathering_expedition_reports (
        report_id, village_tile_id, tribe_id,
        loot_wood, loot_clay, loot_iron, loot_wheat
      ) VALUES (
        $report_id, $village_tile_id, $tribe_id,
        $loot_wood, $loot_clay, $loot_iron, $loot_wheat
      ) RETURNING id;
    `,
    bind: {
      $report_id: reportId,
      $village_tile_id: village.tile_id,
      $tribe_id: village.tribe_id,
      $loot_wood: loot[0]!,
      $loot_clay: loot[1]!,
      $loot_iron: loot[2]!,
      $loot_wheat: loot[3]!,
    },
    schema: z.int(),
  })!;

  database.exec({
    sql: `
      INSERT INTO gathering_expedition_report_units (
        gathering_expedition_report_id,
        unit_id,
        amount
      )
      SELECT
        $report_detail_id,
        unit_ids.id,
        json_extract(troop.value, '$.amount')
      FROM json_each($troops) AS troop
      JOIN unit_ids
        ON unit_ids.unit = json_extract(troop.value, '$.unitId');
    `,
    bind: {
      $report_detail_id: gatheringExpeditionReportId,
      $troops: JSON.stringify(troops),
    },
  });

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
  };
};
