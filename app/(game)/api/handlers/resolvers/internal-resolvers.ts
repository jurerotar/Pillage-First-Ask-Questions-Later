import type { Resolver } from 'app/interfaces/api';
import type { GameEvent } from 'app/interfaces/models/game/game-event';

export const internalSeedOasisOccupiableByTableResolver: Resolver<
  GameEvent<'__internal__seedOasisOccupiableByTable'>
> = (database) => {
  // Create entries for non-50% oasis only, since those were already seeded during server creation
  database.exec(`
    INSERT OR IGNORE INTO
      oasis_occupiable_by (tile_id, oasis_id)
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
        JOIN tiles t
             ON t.x BETWEEN ot.x - 3 AND ot.x + 3
               AND t.y BETWEEN ot.y - 3 AND ot.y + 3
    ;
  `);
};
