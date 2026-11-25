import { z } from 'zod';
import { adventureLootTable } from '@pillage-first/game-assets/loot-tables';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { rollLootTable } from '@pillage-first/utils/loot-table';
import { insertHeroItemIntoHeroInventoryQuery } from '../../../queries/hero-queries';
import {
  selectHeroAdventureContextByVillageIdQuery,
  updateCompletedHeroAdventuresByHeroIdQuery,
  updateHeroAfterAdventureByHeroIdQuery,
} from '../../../queries/troop-movement-queries';
import {
  calculateAdventureDuration,
  getPlayerHeroAdventureStateAt,
  materializeHeroAdventurePointsAt,
} from '../../../utils/adventures';
import {
  getHeroHealthStateAt,
  getNextHeroHealthRegenerationAt,
  onHeroDeath,
} from '../../../utils/hero';
import { assessAdventureCountQuestCompletion } from '../../../utils/quests';
import { insertAdventureReport } from '../../../utils/report';
import { getMovementDuration } from '../../../utils/troop-movements';
import { removeTroops } from '../../../utils/troops';
import { getVillagePlayerId } from '../../../utils/village';
import { defineEventResolver, type Resolver } from '../resolver';

const resolveAdventureMovement: Resolver<
  GameEvent<'troopMovementAdventure'>
> = (database, args, createEvents) => {
  const { villageId, resolvesAt, originTileId, targetTileId, troops } = args;

  const { heroId, playerId, damageReduction, adventureId } =
    database.selectObject({
      sql: selectHeroAdventureContextByVillageIdQuery,
      bind: { $village_id: villageId },
      schema: z.strictObject({
        heroId: z.number(),
        playerId: z.number(),
        damageReduction: z.number(),
        adventureId: z.int(),
      }),
    })!;

  const {
    health: healthBefore,
    nextHealthRegenerationAt,
    interval,
  } = getHeroHealthStateAt(database, heroId, resolvesAt);

  const healthAfter = Math.max(
    0,
    healthBefore - Math.max(0, 5 - damageReduction),
  );

  database.exec({
    sql: updateHeroAfterAdventureByHeroIdQuery,
    bind: {
      $hero_id: heroId,
      $health: healthAfter,
      $next_health_regeneration_at: getNextHeroHealthRegenerationAt(
        healthAfter,
        nextHealthRegenerationAt,
        interval,
        resolvesAt,
      ),
    },
  });

  const adventureLoot =
    healthAfter > 0 ? rollLootTable(adventureLootTable) : null;

  if (adventureLoot) {
    database.exec({
      sql: insertHeroItemIntoHeroInventoryQuery,
      bind: {
        $village_id: villageId,
        $item_id: adventureLoot.itemId,
        $amount: adventureLoot.amount,
      },
    });
  }

  insertAdventureReport(database, {
    villageId,
    timestamp: resolvesAt,
    adventureId,
    itemId: adventureLoot?.itemId ?? null,
    itemAmount: adventureLoot?.amount ?? null,
    healthBefore,
    healthAfter,
  });

  if (healthAfter === 0) {
    onHeroDeath(database, resolvesAt);

    return {
      affectedVillageIds: [villageId],
      affectedTileIds: [originTileId],
    };
  }

  database.exec({
    sql: updateCompletedHeroAdventuresByHeroIdQuery,
    bind: { $hero_id: heroId },
  });

  assessAdventureCountQuestCompletion(database, resolvesAt, playerId);

  createEvents<'troopMovementReturn'>(database, {
    villageId,
    originTileId: targetTileId,
    startsAt: resolvesAt,
    targetTileId: originTileId,
    type: 'troopMovementReturn',
    originalMovementType: 'troopMovementAdventure',
    troops,
  });

  return {
    affectedVillageIds: [villageId],
    affectedTileIds: [originTileId, targetTileId],
  };
};

export const adventureMovementResolver =
  defineEventResolver<'troopMovementAdventure'>(
    (database, event) => ({
      validate: (now) => {
        const { available: adventurePoints } = getPlayerHeroAdventureStateAt(
          database,
          now,
          getVillagePlayerId(database, event.villageId),
        );

        if (adventurePoints === 0) {
          throw new Error('No adventure points available');
        }

        const isHeroHome = database.selectValue({
          sql: `
            SELECT EXISTS (
              SELECT 1
              FROM
                heroes h
                JOIN villages v ON v.id = h.village_id
                JOIN troops t
                  ON t.tile_id = v.tile_id
                  AND t.source_tile_id = v.tile_id
                JOIN unit_ids ui ON ui.id = t.unit_id
              WHERE
                h.player_id = $player_id
                AND ui.unit = 'HERO'
                AND t.amount > 0
            ) AS is_hero_home;
          `,
          bind: { $player_id: PLAYER_ID },
          schema: z.coerce.boolean(),
        });

        if (!isHeroHome) {
          throw new Error('Hero is not stationed in his home village');
        }
      },
      duration: () =>
        getMovementDuration(database, () =>
          calculateAdventureDuration(database, false),
        ),
      afterInsert: (_startsAt, now) => {
        const heroId = database.selectValue({
          sql: 'SELECT id FROM heroes WHERE player_id = $player_id',
          bind: {
            $player_id: PLAYER_ID,
          },
          schema: z.number(),
        })!;

        const { available } = materializeHeroAdventurePointsAt(
          database,
          heroId,
          now,
        );

        if (available <= 0) {
          throw new Error('No adventure points available');
        }

        database.exec({
          sql: `
            UPDATE hero_adventures
            SET
              available = available - 1,
              last_updated_at = $now
            WHERE
              hero_id = $hero_id
          `,
          bind: {
            $hero_id: heroId,
            $now: now,
          },
        });

        removeTroops(database, event.troops);
      },
    }),
    resolveAdventureMovement,
  );
