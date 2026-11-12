import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/api/testing';
import { reportTypeSchema } from '@pillage-first/types/models/report';
import { createControllerArgs } from '../../http/controllers/__tests__/utils/controller-args';
import {
  getReportGenerationSettings,
  updateReportGenerationSettings,
} from '../../http/controllers/report-generation-controllers';
import {
  type CreateNewBattleReport,
  insertBattleReport,
  insertGatheringExpeditionReport,
  insertReport,
  insertTradeReport,
  insertUnitResearchReport,
} from '../report';

describe('report generation settings', () => {
  test('skips battle reports when disabled and resumes when re-enabled', async () => {
    using database = await prepareTestDatabase();

    const [origin, target] = database.selectObjects({
      sql: 'SELECT id, tile_id, player_id FROM villages ORDER BY id LIMIT 2;',
      schema: z.strictObject({
        id: z.int(),
        tile_id: z.int(),
        player_id: z.int(),
      }),
    });

    const participant = (village: typeof origin) => ({
      playerId: village.player_id,
      tileId: village.tile_id,
      hero: null,
      units: [],
    });

    const input: CreateNewBattleReport = {
      villageId: origin.id,
      timestamp: 200,
      outcome: 'attackerNoLoss',
      originTileId: origin.tile_id,
      targetTileId: target.tile_id,
      isRaid: false,
      loot: [0, 0, 0, 0],
      attackerPoints: 0,
      defenderPoints: 0,
      loyaltyBefore: null,
      loyaltyAfter: null,
      conquest: null,
      villageDestroyed: false,
      trapsDestroyed: 0,
      rescuedUnits: [],
      capturedAnimals: [],
      stolenItems: [],
      siegeResults: [],
      reinforcements: [],
      attacker: participant(origin),
      defender: participant(target),
    };

    expect(insertBattleReport(database, input)).toBeDefined();

    const counts = () =>
      database.selectObject({
        sql: `
          SELECT
            (SELECT COUNT(*) FROM reports) AS reports,
            (SELECT COUNT(*) FROM battle_reports) AS battles,
            (SELECT COUNT(*) FROM battle_report_participants) AS participants;
        `,
        schema: z.strictObject({
          reports: z.int(),
          battles: z.int(),
          participants: z.int(),
        }),
      });

    const countBefore = counts();

    updateReportGenerationSettings(
      database,
      createControllerArgs<'/me/report-generation', 'patch'>({
        context: { playerId: origin.player_id },
        body: { disabledFilters: ['battle'] },
      }),
    );

    expect(insertBattleReport(database, input)).toBeUndefined();
    expect(counts()).toEqual(countBefore);

    updateReportGenerationSettings(
      database,
      createControllerArgs<'/me/report-generation', 'patch'>({
        context: { playerId: origin.player_id },
        body: { disabledFilters: [] },
      }),
    );

    expect(insertBattleReport(database, input)).toBeDefined();
  });

  test.each([
    'attackerNoLoss',
    'defenderNoLoss',
    'scoutAttackerNoLoss',
    'scoutDefenderNoLoss',
  ] as const)(
    'suppresses loss-free outcome %s while allowing losses',
    async (outcome) => {
      using database = await prepareTestDatabase();

      updateReportGenerationSettings(
        database,
        createControllerArgs<'/me/report-generation', 'patch'>({
          body: { disabledFilters: ['noLoss'] },
        }),
      );

      const input = {
        villageId: 1,
        timestamp: 100,
        type: outcome.startsWith('scout')
          ? ('scouting' as const)
          : ('battle' as const),
        tags: [],
      };

      const selectValue = vi.spyOn(database, 'selectValue');

      expect(insertReport(database, { ...input, outcome })).toBeUndefined();
      expect(selectValue).toHaveBeenCalledTimes(1);

      selectValue.mockRestore();

      expect(
        insertReport(database, { ...input, outcome: 'attackerSomeLoss' }),
      ).toBeDefined();
    },
  );

  test('suppresses own village trades but allows trades with other players', async () => {
    using database = await prepareTestDatabase();

    const origin = database.selectObject({
      sql: 'SELECT id, tile_id FROM villages WHERE player_id = 1 LIMIT 1;',
      schema: z.object({ id: z.int(), tile_id: z.int() }),
    })!;

    const target = database.selectObject({
      sql: 'SELECT id, tile_id, player_id FROM villages WHERE player_id != 1 LIMIT 1;',
      schema: z.object({ id: z.int(), tile_id: z.int(), player_id: z.int() }),
    })!;

    const trade = {
      villageId: origin.id,
      timestamp: 100,
      originTileId: origin.tile_id,
      targetTileId: target.tile_id,
      resources: { wood: 10, clay: 0, iron: 0, wheat: 0 },
      outcome: 'outgoingMerchantsArrived' as const,
    };

    updateReportGenerationSettings(
      database,
      createControllerArgs<'/me/report-generation', 'patch'>({
        body: { disabledFilters: ['ownTrades'] },
      }),
    );

    expect(insertTradeReport(database, trade)).toBeDefined();

    database.exec({
      sql: 'UPDATE villages SET player_id = 1 WHERE id = $id;',
      bind: { $id: target.id },
    });

    const selectValue = vi.spyOn(database, 'selectValue');
    const exec = vi.spyOn(database, 'exec');

    expect(insertTradeReport(database, trade)).toBeUndefined();
    expect(selectValue).toHaveBeenCalledTimes(1);
    expect(exec).not.toHaveBeenCalled();

    selectValue.mockRestore();
    exec.mockRestore();

    updateReportGenerationSettings(
      database,
      createControllerArgs<'/me/report-generation', 'patch'>({
        body: { disabledFilters: [] },
      }),
    );

    expect(insertTradeReport(database, trade)).toBeDefined();
  });

  test.each(reportTypeSchema.options)(
    'suppresses %s in the insert without a separate settings query',
    async (type) => {
      using database = await prepareTestDatabase();

      const input = {
        villageId: 1,
        timestamp: 100,
        type,
        outcome: 'heroAdventure' as const,
        tags: ['read' as const],
      };

      const existingId = insertReport(database, input);

      expect(existingId).toBeDefined();

      updateReportGenerationSettings(
        database,
        createControllerArgs<'/me/report-generation', 'patch'>({
          body: { disabledFilters: [type, type] },
        }),
      );

      expect(
        getReportGenerationSettings(
          database,
          createControllerArgs<'/me/report-generation'>({}),
        ),
      ).toEqual([type]);

      const selectValue = vi.spyOn(database, 'selectValue');
      const exec = vi.spyOn(database, 'exec');

      expect(insertReport(database, input)).toBeUndefined();
      expect(selectValue).toHaveBeenCalledTimes(1);
      expect(selectValue.mock.calls[0][0].sql).toContain('INSERT INTO');
      expect(exec).not.toHaveBeenCalled();

      selectValue.mockRestore();
      exec.mockRestore();

      // Existing reports survive, and another player's villages still generate reports.
      expect(
        database.selectValue({
          sql: 'SELECT id FROM reports WHERE id = $id;',
          bind: { $id: existingId },
          schema: z.int(),
        }),
      ).toBe(existingId);

      const otherVillageId = database.selectValue({
        sql: 'SELECT id FROM villages WHERE player_id != 1 LIMIT 1;',
        schema: z.int(),
      })!;

      expect(
        insertReport(database, { ...input, villageId: otherVillageId }),
      ).toBeDefined();

      updateReportGenerationSettings(
        database,
        createControllerArgs<'/me/report-generation', 'patch'>({
          body: { disabledFilters: [] },
        }),
      );

      expect(insertReport(database, input)).toBeDefined();
    },
  );

  test('skips detail and unit rows and leaves other types enabled', async () => {
    using database = await prepareTestDatabase();

    updateReportGenerationSettings(
      database,
      createControllerArgs<'/me/report-generation', 'patch'>({
        body: { disabledFilters: ['unitResearch', 'gatheringExpedition'] },
      }),
    );

    const exec = vi.spyOn(database, 'exec');

    expect(
      insertUnitResearchReport(database, {
        villageId: 1,
        timestamp: 100,
        unitId: 'LEGIONNAIRE',
      }),
    ).toBeUndefined();
    expect(
      insertGatheringExpeditionReport(database, {
        villageId: 1,
        timestamp: 100,
        villageTileId: 1,
        tribeId: 1,
        loot: [1, 2, 3, 4],
        units: [{ unitId: 'LEGIONNAIRE', amount: 10 }],
      }),
    ).toBeUndefined();
    expect(exec).not.toHaveBeenCalled();

    exec.mockRestore();

    expect(
      insertReport(database, {
        villageId: 1,
        timestamp: 100,
        type: 'adventure',
        outcome: 'heroAdventure',
        tags: [],
      }),
    ).toBeDefined();
  });
});
