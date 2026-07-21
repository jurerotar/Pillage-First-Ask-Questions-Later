import { z } from 'zod';
import { reportListingDtoSchema } from '@pillage-first/types/dtos/report';
import {
  reportSchema,
  reportTagSchema,
  reportTypeSchema,
} from '@pillage-first/types/models/report';
import {
  deleteReportQuery,
  deleteReportTagQuery,
  insertReportTagQuery,
  selectReportListingsQuery,
  selectReportQuery,
} from '../../queries/report-queries';
import { createController } from '../controller';
import {
  mapReportListingRowToDto,
  mapReportRowToDto,
} from './mappers/report-mapper';
import {
  getReportListingsRowSchema,
  getReportsRowSchema,
} from './schemas/report-schemas';

export const getReports = createController('/players/:playerId/reports', {
  summary: 'Get player reports',
  requestParams: {
    path: z.strictObject({
      playerId: z.coerce.number(),
    }),
    query: z.strictObject({
      scope: z
        .enum(['global', 'unread', 'archived', 'village'])
        .optional()
        .default('global'),
      villageId: z.coerce.number().optional(),
      types: z.array(reportTypeSchema).or(reportTypeSchema).optional(),
    }),
  },
  response: z.array(reportListingDtoSchema),
})(({ database, path: { playerId }, query }) => {
  const scope = query.scope ?? 'global';
  const reportTypes =
    query.types == null
      ? []
      : Array.isArray(query.types)
        ? query.types
        : [query.types];

  const rows = database.selectObjects({
    sql: selectReportListingsQuery,
    bind: {
      $player_id: playerId,
      $village_id: query.villageId ?? null,
      $scope: scope,
      $type_count: reportTypes.length,
      $include_battle: reportTypes.includes('battle') ? 1 : 0,
      $include_adventure: reportTypes.includes('adventure') ? 1 : 0,
      $include_trade: reportTypes.includes('trade') ? 1 : 0,
      $include_movement: reportTypes.includes('movement') ? 1 : 0,
    },
    schema: getReportListingsRowSchema,
  });

  return rows.map(mapReportListingRowToDto);
});

export const getReport = createController('/report/:playerId/:reportId', {
  summary: 'Get report by id',
  requestParams: {
    path: z.strictObject({
      playerId: z.coerce.number(),
      reportId: z.coerce.number(),
    }),
  },
  response: reportSchema.nullable(),
})(({ database, path: { playerId, reportId } }) => {
  const row = database.selectObject({
    sql: selectReportQuery,
    bind: { $player_id: playerId, $report_id: reportId },
    schema: getReportsRowSchema,
  });

  if (row) {
    return mapReportRowToDto(database, row);
  }

  return null;
});

export const updateReports = createController('/reports', 'patch', {
  summary: 'Update reports',
  requestBody: z.strictObject({
    reportIds: z.array(z.int()),
    addTags: z.array(reportTagSchema).optional(),
    removeTags: z.array(reportTagSchema).optional(),
  }),
})(({ database, body: { reportIds, addTags, removeTags } }) => {
  database.transaction(() => {
    for (const reportId of reportIds) {
      if (addTags) {
        for (const tag of addTags) {
          database.exec({
            sql: insertReportTagQuery,
            bind: {
              $report_id: reportId,
              $tag: tag,
            },
          });
        }
      }

      if (removeTags) {
        for (const tag of removeTags) {
          database.exec({
            sql: deleteReportTagQuery,
            bind: {
              $report_id: reportId,
              $tag: tag,
            },
          });
        }
      }
    }
  });
});

export const deleteReports = createController('/reports', 'delete', {
  summary: 'Delete reports',
  requestBody: z.array(z.int()),
})(({ database, body }) => {
  database.exec({
    sql: deleteReportQuery,
    bind: {
      $report_ids: JSON.stringify(body),
    },
  });
});
