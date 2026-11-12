import { z } from 'zod';
import { reportListingFilterSchema } from '@pillage-first/types/dtos/report';
import { createController } from '../controller';

export const getReportGenerationSettings = createController(
  '/me/report-generation',
  {
    summary: 'Get report filters with generation disabled',
    response: z.array(reportListingFilterSchema),
  },
)(({ database, context: { playerId } }) => {
  return database.selectValues({
    sql: 'SELECT filter FROM report_generation_settings WHERE player_id = $player_id ORDER BY filter;',
    bind: { $player_id: playerId },
    schema: reportListingFilterSchema,
  });
});

export const updateReportGenerationSettings = createController(
  '/me/report-generation',
  'patch',
  {
    summary: 'Set report filters with generation disabled',
    requestBody: z.strictObject({
      disabledFilters: z.array(reportListingFilterSchema),
    }),
  },
)(({ database, context: { playerId }, body: { disabledFilters } }) => {
  database.transaction((tx) => {
    tx.exec({
      sql: 'DELETE FROM report_generation_settings WHERE player_id = $player_id;',
      bind: { $player_id: playerId },
    });

    tx.exec({
      sql: `
        INSERT INTO report_generation_settings (player_id, filter)
        SELECT DISTINCT $player_id, value FROM json_each($filters);
      `,
      bind: {
        $player_id: playerId,
        $filters: JSON.stringify(disabledFilters),
      },
    });
  });
});
