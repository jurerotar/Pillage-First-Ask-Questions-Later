import {
  calculateImprovedCombatValue,
  getUnitsByTribe,
} from '@pillage-first/game-assets/utils/units';
import { unitCombatStatsDtoSchema } from '@pillage-first/types/dtos/unit';
import { createController } from '../utils/controller';
import { mapUnitImprovementRowToDto } from './mappers/unit-mapper';
import {
  getPlayerUnitCombatStatsPlayerRowSchema,
  getUnitImprovementsRowSchema,
} from './schemas/unit-improvement-schemas';

export const getUnitImprovements = createController(
  '/players/:playerId/unit-improvements',
)(({ database, path: { playerId } }) => {
  const rows = database.selectObjects({
    sql: `
      SELECT ui.unit AS unit_id, u.level
      FROM
        unit_improvements u
          JOIN unit_ids ui ON ui.id = u.unit_id
      WHERE
        u.player_id = $player_id;
    `,
    bind: {
      $player_id: playerId,
    },
    schema: getUnitImprovementsRowSchema,
  });

  return rows.map(mapUnitImprovementRowToDto);
});

export const getPlayerUnitCombatStats = createController(
  '/players/:playerId/unit-combat-stats',
)(({ database, path: { playerId } }) => {
  const player = database.selectObject({
    sql: `
      SELECT ti.tribe
      FROM players p
        JOIN tribe_ids ti ON p.tribe_id = ti.id
      WHERE p.id = $player_id;
    `,
    bind: {
      $player_id: playerId,
    },
    schema: getPlayerUnitCombatStatsPlayerRowSchema,
  })!;

  const improvements = database.selectObjects({
    sql: `
      SELECT ui.unit AS unit_id, u.level
      FROM
        unit_improvements u
          JOIN unit_ids ui ON ui.id = u.unit_id
      WHERE
        u.player_id = $player_id;
    `,
    bind: {
      $player_id: playerId,
    },
    schema: getUnitImprovementsRowSchema,
  });

  const improvementsByUnitId = new Map(
    improvements.map(({ unit_id, level }) => [unit_id, level]),
  );

  return getUnitsByTribe(player.tribe).map((unit) =>
    unitCombatStatsDtoSchema.parse({
      unitId: unit.id,
      attack: calculateImprovedCombatValue(
        unit.attack,
        improvementsByUnitId.get(unit.id) ?? 0,
      ),
      infantryDefence: calculateImprovedCombatValue(
        unit.infantryDefence,
        improvementsByUnitId.get(unit.id) ?? 0,
      ),
      cavalryDefence: calculateImprovedCombatValue(
        unit.cavalryDefence,
        improvementsByUnitId.get(unit.id) ?? 0,
      ),
    }),
  );
});
