import { z } from 'zod';
import { buildingMap } from '@pillage-first/game-assets/buildings';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { newVillageQuestsFactory } from '@pillage-first/game-assets/quests';
import { buildingFieldsFactory } from '@pillage-first/game-assets/village';
import {
  type Building,
  buildingIdSchema,
} from '@pillage-first/types/models/building';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { ReportParty } from '@pillage-first/types/models/report';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { playableTribeSchema } from '@pillage-first/types/models/tribe';
import type { Troop } from '@pillage-first/types/models/troop';
import type { UnitId } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import type { Resolver } from '../../types/resolver';
import { updateHeroEffectsVillageIdQuery } from '../../utils/queries/effect-queries';
import {
  addVillageResourcesAt,
  calculateVillageResourcesAt,
  subtractVillageResourcesAt,
  updateVillageResourcesAt,
} from '../../utils/village';
import { createEvents } from '../utils/create-event';
import { type BattleSide, resolveBattle } from './utils/battle';
import {
  createHeroHealthRegenerationEventByVillageId,
  onHeroDeath,
} from './utils/hero';
import {
  calculateLoot,
  getCrannyCapacity,
  sumCarryCapacity,
} from './utils/loot';
import { assessAdventureCountQuestCompletion } from './utils/quests';
import { insertReport } from './utils/reports';
import { addTroops, getDefendersAtTile, removeTroops } from './utils/troops';

const getTileIdByCoordinates = (
  database: DbFacade,
  x: number,
  y: number,
): number => {
  return database.selectObject({
    sql: 'SELECT id AS tileId FROM tiles WHERE x = $x AND y = $y;',
    bind: { $x: x, $y: y },
    schema: z.strictObject({ tileId: z.number() }),
  })!.tileId;
};

const getVillageAtTile = (
  database: DbFacade,
  tileId: number,
): { villageId: number; villageName: string; playerId: number } | null => {
  return (
    database.selectObject({
      sql: `
        SELECT
          v.id AS villageId,
          v.name AS villageName,
          v.player_id AS playerId
        FROM
          villages v
        WHERE
          v.tile_id = $tile_id;
      `,
      bind: { $tile_id: tileId },
      schema: z.strictObject({
        villageId: z.number(),
        villageName: z.string(),
        playerId: z.number(),
      }),
    }) ?? null
  );
};

const getWallModifiers = (
  database: DbFacade,
  villageId: number,
): { wallDefenceBonus: number; wallDefenceBase: number } => {
  const row = database.selectObject({
    sql: `
      SELECT
        COALESCE(SUM(CASE WHEN e.type = 'bonus' THEN e.value END), 1) AS wallDefenceBonus,
        COALESCE(SUM(CASE WHEN e.type = 'base' THEN e.value END), 0) AS wallDefenceBase
      FROM
        effects e
          JOIN effect_ids ei ON ei.id = e.effect_id
      WHERE
        ei.effect = 'infantryDefence'
        AND e.village_id = $village_id
        AND e.source = 'building';
    `,
    bind: { $village_id: villageId },
    schema: z.strictObject({
      wallDefenceBonus: z.number(),
      wallDefenceBase: z.number(),
    }),
  });
  return {
    wallDefenceBonus: row?.wallDefenceBonus ?? 1,
    wallDefenceBase: row?.wallDefenceBase ?? 0,
  };
};

export const adventureMovementResolver: Resolver<
  GameEvent<'troopMovementAdventure'>
> = (database, args) => {
  const { villageId, resolvesAt, originCoordinates, troops } = args;

  const { heroId, health } = database.selectObject({
    sql: `
      UPDATE heroes
      SET
        health = MAX(0, health - MAX(0, 5 - damage_reduction)),
        experience =
          experience +
          CASE
            WHEN MAX(0, health - MAX(0, 5 - damage_reduction)) > 0
              THEN (
                     SELECT completed + 1
                     FROM
                       hero_adventures
                     WHERE
                       hero_id = heroes.id
                     ) * 10
            ELSE 0
            END
      WHERE
        player_id = (
          SELECT player_id
          FROM
            villages
          WHERE
            id = $village_id
          )
      RETURNING
        id AS heroId,
        health
    `,
    bind: {
      $village_id: villageId,
    },
    schema: z.strictObject({
      heroId: z.number(),
      health: z.number(),
    }),
  })!;

  if (health === 0) {
    onHeroDeath(database, resolvesAt);

    return;
  }

  database.exec({
    sql: 'UPDATE hero_adventures SET completed = completed + 1 WHERE hero_id = $hero_id;',
    bind: {
      $hero_id: heroId,
    },
  });

  assessAdventureCountQuestCompletion(database, resolvesAt);

  if (health < 100) {
    createHeroHealthRegenerationEventByVillageId(
      database,
      villageId,
      resolvesAt,
    );
  }

  createEvents<'troopMovementReturn'>(database, {
    villageId,
    originCoordinates,
    startsAt: resolvesAt,
    targetCoordinates: originCoordinates,
    type: 'troopMovementReturn',
    originalMovementType: 'troopMovementAdventure',
    troops,
  });
};

export const oasisOccupationMovementResolver: Resolver<
  GameEvent<'troopMovementOasisOccupation'>
> = (_database, _args) => {};

export const findNewVillageMovementResolver: Resolver<
  GameEvent<'troopMovementFindNewVillage'>
> = (database, args) => {
  const {
    targetCoordinates: { x, y },
    resolvesAt,
    villageId,
  } = args;

  const { id: tileId } = database.selectObject({
    sql: 'SELECT id FROM tiles WHERE x = $x AND y = $y;',
    bind: { $x: x, $y: y },
    schema: z.strictObject({ id: z.number() }),
  })!;

  // tileId here represents a tile_id where the new village will be founded
  const { resourceFieldComposition, tribe } = database.selectObject({
    sql: `
      SELECT
        rfc.resource_field_composition AS resourceFieldComposition,
        ti.tribe
      FROM
        tiles t
          JOIN resource_field_composition_ids rfc ON t.resource_field_composition_id = rfc.id
          CROSS JOIN players p
          JOIN tribe_ids ti ON p.tribe_id = ti.id
      WHERE
        t.id = $tile_id
        AND p.id = $player_id;
    `,
    bind: {
      $tile_id: tileId,
      $player_id: PLAYER_ID,
    },
    schema: z.strictObject({
      resourceFieldComposition: resourceFieldCompositionSchema,
      tribe: playableTribeSchema,
    }),
  })!;

  // Create village with incremental slug v-{n}
  const newVillageId = database.selectValue({
    sql: `
      WITH
        next_slug AS (
          SELECT 'v-' || (COUNT(*) + 1) AS slug
          FROM
            villages
          WHERE
            player_id = $player_id
          )
      INSERT
      INTO
        villages (name, slug, tile_id, player_id)
      SELECT
        $name,
        (
          SELECT slug
          FROM
            next_slug
          ),
        $tile_id,
        $player_id
          RETURNING id;
    `,
    bind: {
      $name: 'New village',
      $tile_id: tileId,
      $player_id: PLAYER_ID,
    },
    schema: z.number(),
  })!;

  const buildingIdRows = database.selectObjects({
    sql: 'SELECT id, building FROM building_ids',
    schema: z.strictObject({ id: z.number(), building: buildingIdSchema }),
  });

  const buildingIdMap = new Map<Building['id'], number>(
    buildingIdRows.map((b) => [b.building, b.id]),
  );

  const buildingFields = buildingFieldsFactory(
    'player',
    tribe,
    resourceFieldComposition,
  );

  const wheatProductionEffectId = database.selectValue({
    sql: "SELECT id FROM effect_ids WHERE effect = 'wheatProduction';",
    schema: z.number(),
  })!;

  for (const { field_id, building_id, level } of buildingFields) {
    database.exec({
      sql: `
        INSERT INTO
          building_fields (village_id, field_id, building_id, level)
        VALUES
          ($village_id, $field_id, $buildingId, $level);
      `,
      bind: {
        $village_id: newVillageId,
        $field_id: field_id,
        $buildingId: buildingIdMap.get(building_id)!,
        $level: level,
      },
    });

    const building = buildingMap.get(building_id)!;

    for (const effect of building.effects) {
      database.exec({
        sql: `
          INSERT INTO
            effects (effect_id, value, type, scope, source, village_id, source_specifier)
          VALUES
            ((
               SELECT id
               FROM effect_ids
               WHERE effect = $effectName
               ), $value, $type, 'village', 'building', $villageId, $field_id);
        `,
        bind: {
          $effectName: effect.effectId,
          $value: effect.valuesPerLevel[level],
          $type: effect.type,
          $villageId: newVillageId,
          $field_id: field_id,
        },
      });
    }
  }

  // Initialize resource site for the new village (fresh-settlement baseline similar to starting village)
  database.exec({
    sql: `
      INSERT INTO
        resource_sites (tile_id, wood, clay, iron, wheat, updated_at)
      VALUES
        ($tile_id, 750, 750, 750, 750, $updatedAt)
      ON CONFLICT(tile_id) DO NOTHING;
    `,
    bind: { $tile_id: tileId, $updatedAt: resolvesAt },
  });

  const quests = newVillageQuestsFactory(
    newVillageId,
    tribe,
    resourceFieldComposition,
  );

  for (const quest of quests) {
    const isCompleted = quest.id === 'oneOf-MAIN_BUILDING-1';

    database.exec({
      sql: `
        INSERT INTO
          quests (quest_id, completed_at, collected_at, village_id)
        VALUES
          ($questId, $completedAt, NULL, $village_id);
      `,
      bind: {
        $questId: quest.id,
        $completedAt: isCompleted ? resolvesAt : null,
        $village_id: newVillageId,
      },
    });
  }

  // Population effect
  database.exec({
    sql: `
      INSERT INTO
        effects (effect_id, value, type, scope, source, village_id, source_specifier)
      VALUES
        ($effectId, $value, 'base', 'village', 'building', $villageId, 0);
    `,
    bind: {
      $effectId: wheatProductionEffectId,
      $value: -3,
      $villageId: newVillageId,
    },
  });

  // Troop wheat consumption effect
  database.exec({
    sql: `
      INSERT INTO
        effects (effect_id, value, type, scope, source, village_id, source_specifier)
      VALUES
        ($effectId, $value, 'base', 'village', 'troops', $villageId, 0);
    `,
    bind: {
      $effectId: wheatProductionEffectId,
      $value: 0,
      $villageId: newVillageId,
    },
  });

  // Reduce troop consumption in the source village by 3 (since 3 settlers are consumed)
  database.exec({
    sql: `
      UPDATE effects
      SET
        value = value - 3
      WHERE
        effect_id = $effectId
        AND source = 'troops'
        AND village_id = $villageId;
    `,
    bind: {
      $effectId: wheatProductionEffectId,
      $villageId: villageId,
    },
  });

  updateVillageResourcesAt(database, villageId, resolvesAt);

  // Founding village history
  database.exec({
    sql: `
      INSERT INTO village_founding_history (village_id, tile_id, x, y, timestamp)
      VALUES ($village_id, $tile_id, $x, $y, $timestamp);
    `,
    bind: {
      $village_id: newVillageId,
      $tile_id: tileId,
      $x: x,
      $y: y,
      // JS stores values in ms, other history table triggers store it in seconds
      $timestamp: Math.trunc(resolvesAt / 1000),
    },
  });
};

export const returnMovementResolver: Resolver<
  GameEvent<'troopMovementReturn'>
> = (database, args) => {
  const {
    targetCoordinates: { x, y },
    troops,
    villageId,
    resolvesAt,
    loot,
  } = args;

  const { tileId: targetTileId } = database.selectObject({
    sql: 'SELECT id AS tileId FROM tiles WHERE x = $x AND y = $y;',
    bind: { $x: x, $y: y },
    schema: z.strictObject({ tileId: z.number() }),
  })!;

  addTroops(
    database,
    troops.map((troop) => ({
      ...troop,
      tileId: targetTileId,
    })),
  );

  if (loot) {
    addVillageResourcesAt(database, villageId, resolvesAt, loot);
  }
};

export const relocationMovementResolver: Resolver<
  GameEvent<'troopMovementRelocation'>
> = (database, args) => {
  const {
    targetCoordinates: { x, y },
    troops,
    resolvesAt,
    villageId,
  } = args;

  const { tileId: targetTileId, villageId: targetVillageId } =
    database.selectObject({
      sql: `
        SELECT
          t.id AS tileId,
          v.id AS villageId
        FROM
          tiles t
            JOIN villages v ON v.tile_id = t.id
        WHERE
          t.x = $x
          AND t.y = $y;
      `,
      bind: { $x: x, $y: y },
      schema: z.strictObject({ tileId: z.number(), villageId: z.number() }),
    })!;

  addTroops(
    database,
    troops.map((troop) => ({
      ...troop,
      tileId: targetTileId,
      source: targetTileId,
    })),
  );

  // If hero is relocated, update effects as well
  if (troops.some(({ unitId }) => unitId === 'HERO')) {
    // Update resources in both villages, due to effects changing
    updateVillageResourcesAt(database, villageId, resolvesAt);
    updateVillageResourcesAt(database, targetVillageId, resolvesAt);

    database.exec({
      sql: updateHeroEffectsVillageIdQuery,
      bind: {
        $player_id: PLAYER_ID,
        $targetId: targetVillageId,
      },
    });

    database.exec({
      sql: 'UPDATE heroes SET village_id = $targetId WHERE player_id = $player_id;',
      bind: {
        $player_id: PLAYER_ID,
        $targetId: targetVillageId,
      },
    });
  }
};

export const reinforcementMovementResolver: Resolver<
  GameEvent<'troopMovementReinforcements'>
> = (database, args) => {
  const {
    targetCoordinates: { x, y },
    troops,
  } = args;

  const { tileId: targetTileId } = database.selectObject({
    sql: 'SELECT id AS tileId FROM tiles WHERE x = $x AND y = $y;',
    bind: { $x: x, $y: y },
    schema: z.strictObject({ tileId: z.number() }),
  })!;

  addTroops(
    database,
    troops.map((troop) => ({
      ...troop,
      tileId: targetTileId,
    })),
  );
};

const resolveCombatMovement = (
  database: DbFacade,
  args: {
    villageId: number;
    resolvesAt: number;
    originCoordinates: { x: number; y: number };
    targetCoordinates: { x: number; y: number };
    troops: Troop[];
    attackerType: 'attack' | 'raid';
  },
) => {
  const {
    villageId,
    resolvesAt,
    originCoordinates,
    targetCoordinates,
    troops,
    attackerType,
  } = args;

  const targetTileId = getTileIdByCoordinates(
    database,
    targetCoordinates.x,
    targetCoordinates.y,
  );

  const defenderVillage = getVillageAtTile(database, targetTileId);

  const stationedDefenders = getDefendersAtTile(database, targetTileId);

  const { wallDefenceBonus, wallDefenceBase } = defenderVillage
    ? getWallModifiers(database, defenderVillage.villageId)
    : { wallDefenceBonus: 1, wallDefenceBase: 0 };

  const attackerVillageName = database.selectObject({
    sql: 'SELECT name AS villageName FROM villages WHERE id = $village_id;',
    bind: { $village_id: villageId },
    schema: z.strictObject({ villageName: z.string() }),
  })!.villageName;

  // Aggregate defenders by unitId (multiple stacks may exist from reinforcements)
  const defenderStacksByUnit = new Map<
    UnitId,
    { amount: number; stacks: typeof stationedDefenders }
  >();
  for (const stationed of stationedDefenders) {
    const existing = defenderStacksByUnit.get(stationed.unitId);
    if (existing) {
      existing.amount += stationed.amount;
      existing.stacks.push(stationed);
    } else {
      defenderStacksByUnit.set(stationed.unitId, {
        amount: stationed.amount,
        stacks: [stationed],
      });
    }
  }

  const attackerSide: BattleSide = {
    troops: troops.map(({ unitId, amount }) => ({ unitId, amount })),
  };
  const defenderSide: BattleSide = {
    troops: Array.from(defenderStacksByUnit.entries()).map(
      ([unitId, { amount }]) => ({ unitId, amount }),
    ),
  };

  const battleResult = resolveBattle(attackerSide, defenderSide, {
    wallDefenceBonus,
    wallDefenceBase,
    moralBonus: 1,
    oasisDefenceBonus: 0,
    attackerType,
  });

  // Apply defender losses proportionally across source stacks
  for (const { unitId, amount, losses } of battleResult.defenderLosses) {
    if (losses <= 0) {
      continue;
    }
    const unitData = defenderStacksByUnit.get(unitId);
    if (!unitData) {
      continue;
    }
    const lossRate = amount > 0 ? losses / amount : 0;
    for (const stack of unitData.stacks) {
      const stackLosses = Math.min(
        stack.amount,
        Math.round(stack.amount * lossRate),
      );
      if (stackLosses <= 0) {
        continue;
      }
      removeTroops(database, [
        {
          unitId,
          amount: stackLosses,
          tileId: targetTileId,
          source: stack.source,
        },
      ]);
    }
  }

  const attackerParty: ReportParty = {
    playerId: PLAYER_ID,
    villageId,
    villageName: attackerVillageName,
    coordinates: originCoordinates,
  };
  const defenderParty: ReportParty = {
    playerId: defenderVillage?.playerId ?? null,
    villageId: defenderVillage?.villageId ?? null,
    villageName: defenderVillage?.villageName ?? null,
    coordinates: targetCoordinates,
  };

  // Only dispatch return movement if any attackers survived
  const survivingTroops = troops
    .map((troop) => {
      const lossRecord = battleResult.attackerLosses.find(
        (l) => l.unitId === troop.unitId,
      );
      return { ...troop, amount: troop.amount - (lossRecord?.losses ?? 0) };
    })
    .filter(({ amount }) => amount > 0);

  // Loot: always report [0,0,0,0] for attack/raid; populate real values when attacker wins
  const loot: [number, number, number, number] = [0, 0, 0, 0];
  if (
    battleResult.outcome === 'attacker-wins' &&
    defenderVillage !== null &&
    survivingTroops.length > 0
  ) {
    const carryCapacity = sumCarryCapacity(survivingTroops);
    const crannyCapacity = getCrannyCapacity(
      database,
      defenderVillage.villageId,
    );
    const { currentWood, currentClay, currentIron, currentWheat } =
      calculateVillageResourcesAt(
        database,
        defenderVillage.villageId,
        resolvesAt,
      );

    const calculated = calculateLoot(
      [currentWood, currentClay, currentIron, currentWheat],
      crannyCapacity,
      carryCapacity,
    );

    loot[0] = calculated[0];
    loot[1] = calculated[1];
    loot[2] = calculated[2];
    loot[3] = calculated[3];

    if (calculated.some((r) => r > 0)) {
      subtractVillageResourcesAt(
        database,
        defenderVillage.villageId,
        resolvesAt,
        calculated,
      );
    }
  }

  insertReport(database, {
    type: attackerType,
    timestamp: resolvesAt,
    villageId,
    defenderTileId: targetTileId,
    outcome: battleResult.outcome,
    payload: {
      attacker: attackerParty,
      defender: defenderParty,
      attackers: battleResult.attackerLosses,
      defenders: battleResult.defenderLosses,
      bonuses: {
        wallDefenceBonus,
        wallDefenceBase,
        moralBonus: 1,
        oasisDefenceBonus: 0,
      },
      loot,
    },
  });

  if (survivingTroops.length > 0) {
    createEvents<'troopMovementReturn'>(database, {
      villageId,
      troops: survivingTroops,
      targetCoordinates: originCoordinates,
      originCoordinates: targetCoordinates,
      startsAt: resolvesAt,
      type: 'troopMovementReturn',
      originalMovementType:
        attackerType === 'attack' ? 'troopMovementAttack' : 'troopMovementRaid',
      // Only carry loot in transit when there's something to deliver
      loot: loot.some((r) => r > 0) ? loot : undefined,
    });
  }
};

export const attackMovementResolver: Resolver<
  GameEvent<'troopMovementAttack'>
> = (database, args) => {
  resolveCombatMovement(database, { ...args, attackerType: 'attack' });
};

export const raidMovementResolver: Resolver<GameEvent<'troopMovementRaid'>> = (
  database,
  args,
) => {
  resolveCombatMovement(database, { ...args, attackerType: 'raid' });
};
