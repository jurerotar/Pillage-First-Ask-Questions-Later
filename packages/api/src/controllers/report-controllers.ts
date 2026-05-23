import { z } from 'zod';
import { createController } from '../utils/controller';
import {
  selectReportByIdQuery,
  selectReportsByPlayerIdQuery,
  selectUnreadReportCountByPlayerIdQuery,
} from '../utils/queries/report-queries';
import {
  mapReportRowToDto,
  mapReportRowToListItemDto,
} from './mappers/report-mapper';
import { reportRowSchema } from './schemas/report-schemas';

export const getMyReports = createController('/players/:playerId/reports')(
  ({ database, path: { playerId } }) => {
    const rows = database.selectObjects({
      sql: selectReportsByPlayerIdQuery,
      bind: { $player_id: playerId },
      schema: reportRowSchema,
    });

    return rows.map(mapReportRowToListItemDto);
  },
);

export const getReportById = createController('/reports/:reportId')(
  ({ database, path: { reportId } }) => {
    const row = database.selectObject({
      sql: selectReportByIdQuery,
      bind: { $report_id: reportId },
      schema: reportRowSchema,
    });

    if (!row) {
      throw new Error('Report not found');
    }

    return mapReportRowToDto(row);
  },
);

export const getUnreadReportCount = createController(
  '/players/:playerId/reports/unread-count',
)(({ database, path: { playerId } }) => {
  return database.selectValue({
    sql: selectUnreadReportCountByPlayerIdQuery,
    bind: { $player_id: playerId },
    schema: z.number(),
  })!;
});

export const updateReport = createController(
  '/reports/:reportId',
  'patch',
)(({ database, path: { reportId }, body: { tag } }) => {
  database.exec({
    sql: `
      UPDATE reports
      SET tags = CASE
        WHEN INSTR(tags, $tag_pattern) > 0 THEN tags
        ELSE JSON_INSERT(tags, '$[#]', $tag)
      END
      WHERE id = $report_id;
    `,
    bind: {
      $report_id: reportId,
      $tag: tag,
      $tag_pattern: `"${tag}"`,
    },
  });
});

export const deleteReport = createController(
  '/reports/:reportId',
  'delete',
)(({ database, path: { reportId } }) => {
  database.exec({
    sql: 'DELETE FROM reports WHERE id = $report_id;',
    bind: { $report_id: reportId },
  });
});
