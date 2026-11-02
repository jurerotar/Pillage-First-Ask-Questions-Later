import type { DatabaseSync } from 'node:sqlite';

const counters = [
  'sharedUploadsReserved',
  'sharedUploadsCompleted',
  'sharedUploadedBytes',
  'reportUploadsReserved',
  'reportUploadsCompleted',
  'reportUploadedBytes',
  'sharedDownloadsStarted',
  'sharedDownloadBytesRequested',
  'reportDownloadsStarted',
  'reportDownloadBytesRequested',
  'sharedImportsConfirmed',
  'sharedWorldsExpired',
  'reportsSubmitted',
  'reportsClosed',
  'reportsDeleted',
] as const;

export type Statistics = Record<(typeof counters)[number], number> & {
  trackingStartedAt: number;
};

// Triggers keep counters atomic with state changes, including idempotent retries.
// Existing rows are deliberately not backfilled: deleted history is unavailable.
export const initializeStatistics = (database: DatabaseSync): void => {
  database.exec(`
    BEGIN IMMEDIATE;
    CREATE TABLE IF NOT EXISTS statistics (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      trackingStartedAt INTEGER NOT NULL,
      ${counters.map((name) => `${name} INTEGER NOT NULL DEFAULT 0 CHECK(${name} >= 0)`).join(',')}
    ) STRICT;
    INSERT OR IGNORE INTO statistics (id, trackingStartedAt)
      VALUES (1, ${Date.now()});
    CREATE TRIGGER IF NOT EXISTS statistics_report_submitted AFTER INSERT ON reports
    BEGIN
      UPDATE statistics SET reportsSubmitted = reportsSubmitted + 1 WHERE id = 1;
    END;
    CREATE TRIGGER IF NOT EXISTS statistics_report_closed AFTER UPDATE OF closed_at ON reports
    WHEN OLD.closed_at IS NULL AND NEW.closed_at IS NOT NULL
    BEGIN
      UPDATE statistics SET reportsClosed = reportsClosed + 1 WHERE id = 1;
    END;
    CREATE TRIGGER IF NOT EXISTS statistics_report_deleted AFTER DELETE ON reports
    BEGIN
      UPDATE statistics SET reportsDeleted = reportsDeleted + 1 WHERE id = 1;
    END;
    ${(['shared', 'report'] as const)
      .map((kind) => {
        const owner = kind === 'shared' ? 'world_id' : 'report_id';
        return `
        CREATE TRIGGER IF NOT EXISTS statistics_${kind}_reserved AFTER INSERT ON uploads
        WHEN NEW.${owner} IS NOT NULL
        BEGIN
          UPDATE statistics SET ${kind}UploadsReserved = ${kind}UploadsReserved + 1 WHERE id = 1;
        END;
        CREATE TRIGGER IF NOT EXISTS statistics_${kind}_completed AFTER UPDATE OF status ON uploads
        WHEN OLD.status = 'pending' AND NEW.status = 'complete' AND NEW.${owner} IS NOT NULL
        BEGIN
          UPDATE statistics SET
            ${kind}UploadsCompleted = ${kind}UploadsCompleted + 1,
            ${kind}UploadedBytes = ${kind}UploadedBytes + NEW.expected_bytes
          WHERE id = 1;
        END;
      `;
      })
      .join('')}
    COMMIT;
  `);
};
