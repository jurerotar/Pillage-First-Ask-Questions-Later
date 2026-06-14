import type { DbFacade } from '@pillage-first/utils/facades/database';

// export const reportsSeeder = (database: DbFacade): void => {
//   database.exec({
//     sql: `
//       INSERT INTO reports (
//         village_id,
//         timestamp,
//         type,
//         is_read,
//         is_archived
//       )
//       SELECT
//         v.id,
//         1781298610983,
//         'battle',
//         0,
//         0
//       FROM villages v
//       WHERE v.player_id = $player_id;
//     `,
//     bind: { $player_id: PLAYER_ID },
//   });
// };

// TODO: Remove when done testing
export const reportsSeeder = (database: DbFacade): void => {
  database.exec({
    sql: `
WITH RECURSIVE nums(n) AS (
    SELECT 1
    UNION ALL
    SELECT n + 1
    FROM nums
    WHERE n < 1000
)
INSERT INTO reports (village_id, timestamp, type, is_read, is_archived)
SELECT
    1,
    abs(random()) % 1781298610983,
    CASE abs(random()) % 3
        WHEN 0 THEN 'battle'
        WHEN 1 THEN 'trade'
        ELSE 'adventure'
    END,
    abs(random()) % 1,
    abs(random()) % 1
FROM nums;
    `,
  });
};
