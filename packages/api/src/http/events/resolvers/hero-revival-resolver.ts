import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  calculateHeroLevel,
  calculateHeroRevivalCost,
  calculateHeroRevivalTime,
} from '@pillage-first/game-assets/utils/hero';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { speedSchema } from '@pillage-first/types/models/server';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { playableTribeSchema } from '@pillage-first/types/models/tribe';
import { insertHeroEffectsQuery } from '../../../queries/effect-queries';
import { addTroops } from '../../../utils/troops';
import { updateResourceSiteResourcesAt } from '../../../utils/village';
import { defineEventResolver, type Resolver } from '../resolver';

const resolveHeroRevival: Resolver<GameEvent<'heroRevival'>> = (
  database,
  args,
) => {
  const { resolvesAt } = args;

  const { villageId, tileId } = database.selectObject({
    sql: `
        SELECT
          villages.id AS villageId,
          villages.tile_id AS tileId
        FROM heroes
        JOIN villages ON heroes.village_id = villages.id
        WHERE heroes.player_id = $player_id;
      `,
    bind: {
      $player_id: PLAYER_ID,
    },
    schema: z.strictObject({
      villageId: z.number(),
      tileId: tileIdSchema,
    }),
  })!;

  updateResourceSiteResourcesAt(database, tileId, resolvesAt);

  database.exec({
    sql: 'UPDATE heroes SET health = 100, next_health_regeneration_at = NULL WHERE player_id = $player_id;',
    bind: { $player_id: PLAYER_ID },
  });

  database.exec({
    sql: insertHeroEffectsQuery,
    bind: { $player_id: PLAYER_ID },
  });

  addTroops(database, [
    {
      unitId: 'HERO',
      amount: 1,
      tileId,
      sourceTileId: tileId,
    },
  ]);

  return {
    affectedVillageIds: [villageId],
    affectedTileIds: [tileId],
  };
};

export const heroRevivalResolver = defineEventResolver<'heroRevival'>(
  (database) => ({
    validate: () => {
      const isHeroAlive = database.selectValue({
        sql: 'SELECT health > 0 FROM heroes WHERE player_id = $player_id;',
        bind: { $player_id: PLAYER_ID },
        schema: z.coerce.boolean(),
      });

      if (isHeroAlive) {
        throw new Error('Hero is already alive');
      }
    },
    cost: () => {
      const isFreeHeroReviveEnabled = database.selectValue({
        sql: 'SELECT is_free_hero_revive_enabled FROM developer_settings',
        schema: z.coerce.boolean(),
      });

      if (isFreeHeroReviveEnabled) {
        return [0, 0, 0, 0];
      }

      const { experience, tribe } = database.selectObject({
        sql: `
          SELECT
            h.experience,
            ti.tribe
          FROM
            heroes h
            JOIN players p ON h.player_id = p.id
            JOIN tribe_ids ti ON p.tribe_id = ti.id
          WHERE
            h.player_id = $player_id;
        `,
        bind: { $player_id: PLAYER_ID },
        schema: z.strictObject({
          experience: z.number(),
          tribe: playableTribeSchema,
        }),
      })!;

      const { level } = calculateHeroLevel(experience);

      return calculateHeroRevivalCost(tribe, level);
    },
    duration: () => {
      const isInstantHeroReviveEnabled = database.selectValue({
        sql: 'SELECT is_instant_hero_revive_enabled FROM developer_settings',
        schema: z.coerce.boolean(),
      });

      if (isInstantHeroReviveEnabled) {
        return 0;
      }

      const { experience, speed } = database.selectObject({
        sql: `
          SELECT
            h.experience,
            s.speed
          FROM
            heroes h
            CROSS JOIN servers s
          WHERE
            h.player_id = $player_id;
        `,
        bind: { $player_id: PLAYER_ID },
        schema: z.strictObject({
          experience: z.number(),
          speed: speedSchema,
        }),
      })!;
      const { level } = calculateHeroLevel(experience);

      return calculateHeroRevivalTime(level) / speed;
    },
  }),
  resolveHeroRevival,
);
