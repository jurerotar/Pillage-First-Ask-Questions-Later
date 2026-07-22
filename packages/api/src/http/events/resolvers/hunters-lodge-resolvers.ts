import { z } from 'zod';
import {
  ANIMAL_CAGE_ITEM_ID,
  getHunterLodgeCatchableAnimals,
} from '@pillage-first/game-assets/utils/hunters-lodge';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { randomArrayElement } from '@pillage-first/utils/random';
import { insertAnimalCagesIntoHeroInventoryQuery } from '../../../queries/hero-queries';
import { selectVillageAndFirstOasisTileIdsQuery } from '../../../queries/map-queries';
import { insertReport } from '../../../utils/report';
import { addTroops } from '../../../utils/troops';
import type { Resolver } from '../resolver';

export const animalCageProductionResolver: Resolver<
  GameEvent<'animalCageProduction'>
> = (database, args) => {
  const { cageAmount, villageId } = args;

  database.exec({
    sql: insertAnimalCagesIntoHeroInventoryQuery,
    bind: {
      $village_id: villageId,
      $item_id: ANIMAL_CAGE_ITEM_ID,
      $amount: cageAmount,
    },
  });

  return {
    affectedVillageIds: [villageId],
  };
};

export const huntersLodgeHuntResolver: Resolver<
  GameEvent<'huntersLodgeHunt'>
> = (database, args) => {
  const { huntingPartyLevel, resolvesAt, villageId } = args;

  const huntersLodge = database.selectObject({
    sql: selectVillageAndFirstOasisTileIdsQuery,
    bind: {
      $village_id: villageId,
    },
    schema: z.strictObject({
      villageTileId: z.number(),
      sourceTileId: z.number(),
    }),
  })!;

  const catchableAnimals = getHunterLodgeCatchableAnimals(huntingPartyLevel);
  const unitId = randomArrayElement(catchableAnimals);

  addTroops(database, [
    {
      unitId,
      amount: 1,
      tileId: huntersLodge.villageTileId,
      source: huntersLodge.sourceTileId,
    },
  ]);

  const reportId = insertReport(database, {
    villageId,
    timestamp: resolvesAt,
    type: 'huntingParty',
    outcome: 'huntingParty',
    tags: [],
  });

  const huntingPartyReportId = database.selectValue({
    sql: 'INSERT INTO hunting_party_reports (report_id, village_tile_id) VALUES ($report_id, $village_tile_id) RETURNING id;',
    bind: {
      $report_id: reportId,
      $village_tile_id: huntersLodge.villageTileId,
    },
    schema: z.int(),
  })!;

  database.exec({
    sql: `
      INSERT INTO hunting_party_report_units (hunting_party_report_id, unit_id, amount)
      SELECT $hunting_party_report_id, id, 1 FROM unit_ids WHERE unit = $unit_id;
    `,
    bind: {
      $hunting_party_report_id: huntingPartyReportId,
      $unit_id: unitId,
    },
  });

  return {
    affectedVillageIds: [villageId],
  };
};
