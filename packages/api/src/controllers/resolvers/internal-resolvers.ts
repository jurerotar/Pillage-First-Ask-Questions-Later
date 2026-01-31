import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Resolver } from '../../types/resolver';

export const internalSeedOasisOccupiableByTableResolver: Resolver<
  GameEvent<'__internal__seedOasisOccupiableByTable'>
> = (database) => {
  // Create entries for non-50% oasis only, since those were already seeded during server creation
  database.exec({
    sql: `
    WITH RECURSIVE
      offsets(d) AS (
        SELECT -3 UNION ALL SELECT d + 1 FROM offsets WHERE d < 3
      )
    INSERT OR IGNORE INTO
      oasis_occupiable_by (occupiable_tile_id, occupiable_oasis_tile_id)
    SELECT t.id AS tile_id, ot.id AS oasis_id
    FROM
      (
        SELECT ot.id, ot.x, ot.y
        FROM
          tiles ot
            JOIN oasis o ON o.tile_id = ot.id
        WHERE
          o.resource = 'wheat'
          AND o.bonus <> 50
        GROUP BY ot.id, ot.x, ot.y
      ) AS ot
        CROSS JOIN offsets dx
        CROSS JOIN offsets dy
        JOIN tiles t
             ON t.x = ot.x + dx.d
               AND t.y = ot.y + dy.d
    ;
  `,
  });
};
