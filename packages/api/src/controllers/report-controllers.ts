import { createController } from '../utils/controller';

export const getMyReports = createController('/players/:playerId/reports')(
  () => {
    return [];
  },
);

export const getUnreadReportCount = createController(
  '/players/:playerId/reports/unread-count',
)(() => {
  return 0;
});

export const updateReport = createController(
  '/reports/:reportId',
  'patch',
)(() => {
  // no-op for now
});

export const deleteReport = createController(
  '/reports/:reportId',
  'delete',
)(() => {
  // no-op for now
});
