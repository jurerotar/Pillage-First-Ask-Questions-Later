import { z } from 'zod';
import { battleDtoSchema } from '@pillage-first/types/dtos/battle';
import { reportDtoSchema } from '@pillage-first/types/dtos/report';
import {
  selectBattleByReportQuery,
  selectBattleParticipantsByReportQuery,
  selectBattleUnitsByReportQuery,
} from '../../queries/battle-queries';
import { selectReportsByPlayerQuery } from '../../queries/report-queries';
import { createController } from '../controller';
import {
  mapBattle,
  mapBattleParticipants,
  mapBattleUnits,
} from './mappers/battle-mapper';
import { mapReports } from './mappers/reports-mapper';
import {
  getBattleByReportRowSchema,
  getBattleParticipantsByReportRowSchema,
  getBattleUnitsByReportRowSchema,
} from './schemas/battle-schemas';
import { getReportsByPlayerRowSchema } from './schemas/report-schemas';

export const getMyReports = createController('/reports/:playerId', {
  summary: 'Get my reports',
  requestParams: {
    path: z.strictObject({
      playerId: z.coerce.number(),
    }),
  },
  response: z.array(reportDtoSchema),
})(({ database, path: { playerId } }) => {
  const rows = database.selectObjects({
    sql: selectReportsByPlayerQuery,
    bind: { $player_id: playerId },
    schema: getReportsByPlayerRowSchema,
  });

  return rows.map(mapReports);
});

export const getBattleByReport = createController('/reports/battle/:reportId', {
  summary: 'Get battle by report',
  requestParams: {
    path: z.strictObject({
      reportId: z.coerce.number(),
    }),
  },
  response: battleDtoSchema,
})(({ database, path: { reportId } }) => {
  const battle = mapBattle(
    database.selectObject({
      sql: selectBattleByReportQuery,
      bind: { $report_id: reportId },
      schema: getBattleByReportRowSchema,
    }),
  );

  const participants = database
    .selectObjects({
      sql: selectBattleParticipantsByReportQuery,
      bind: { $report_id: reportId },
      schema: getBattleParticipantsByReportRowSchema,
    })
    .map(mapBattleParticipants);

  const units = database
    .selectObjects({
      sql: selectBattleUnitsByReportQuery,
      bind: { $report_id: reportId },
      schema: getBattleUnitsByReportRowSchema,
    })
    .map(mapBattleUnits);

  battle.participants = participants;

  const participantsIdMap = new Map();
  for (const participant of participants) {
    participantsIdMap.set(participant.id, participant);
  }

  for (const unit of units) {
    const participant = participantsIdMap.get(unit.battleParticipantId);
    participant.units.push(unit);
  }

  return battle;
});

// TODO: implement
export const getUnreadReportCount = createController(
  '/players/:playerId/reports/unread-count',
  {
    summary: 'Get unread reports count',
    requestParams: {
      path: z.strictObject({
        playerId: z.coerce.number(),
      }),
    },
    response: z.number().int(),
  },
)(() => {
  return 0;
});

// TODO: implement
export const updateReport = createController('/reports/:reportId', 'patch', {
  summary: 'Update report',
  requestParams: {
    path: z.strictObject({
      reportId: z.string(),
    }),
  },
  requestBody: z.strictObject({
    tag: z.enum(['read', 'archived']),
  }),
})(() => {
  // no-op for now
});

// TODO: implement
export const deleteReport = createController('/reports/:reportId', 'delete', {
  summary: 'Delete report',
  requestParams: {
    path: z.strictObject({
      reportId: z.string(),
    }),
  },
})(() => {
  // no-op for now
});
