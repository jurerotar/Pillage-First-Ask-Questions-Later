import { createController } from '../utils/controller';
import {
  getBuildingLevelChangeHistorySchema,
  getEventsHistorySchema,
  getUnitTrainingHistorySchema,
} from './schemas/history-schemas';

export const getBuildingLevelChangeHistory = createController(
  '/villages/:villageId/history/buildings',
)(({ database, path }) => {
  const { villageId } = path;

  return database.selectObjects({
    sql: `
      SELECT
        h.field_id,
        bi.building,
        h.previous_level,
        h.new_level,
        h.timestamp
      FROM
        building_level_change_history h
          JOIN building_ids bi ON h.building_id = bi.id
      WHERE
        h.village_id = $village_id
      ORDER BY
        h.timestamp DESC;
    `,
    bind: {
      $village_id: villageId,
    },
    schema: getBuildingLevelChangeHistorySchema,
  });
});

export const getUnitTrainingHistory = createController(
  '/villages/:villageId/history/units',
)(({ database, path, body }) => {
  const { villageId } = path;
  const { buildingId = null } = body;

  return database.selectObjects({
    sql: `
      SELECT
        h.batch_id,
        ui.unit,
        bi.building,
        h.amount,
        h.timestamp
      FROM
        unit_training_history h
          JOIN unit_ids ui ON h.unit_id = ui.id
          JOIN building_ids bi ON h.building_id = bi.id
      WHERE
        h.village_id = $village_id
        AND ($building_id IS NULL OR bi.building = $building_id)
      ORDER BY
        h.timestamp DESC;
    `,
    bind: {
      $village_id: villageId,
      $building_id: buildingId,
    },
    schema: getUnitTrainingHistorySchema,
  });
});

export const getEventsHistory = createController(
  '/villages/:villageId/history/events',
)(({ database, path, url }) => {
  const { villageId } = path;
  const { searchParams } = new URL(url, 'http://localhost');
  const scope = searchParams.get('scope') ?? 'village';
  const types = searchParams.getAll('types');

  const villageFilter =
    scope === 'village'
      ? 'WHERE village_id = $village_id'
      : 'WHERE village_id IN (SELECT id FROM villages WHERE player_id = (SELECT player_id FROM villages WHERE id = $village_id))';

  const queries = [];

  if (types.length === 0 || types.includes('construction')) {
    queries.push(`
      SELECT
        'construction-' || id as id,
        village_id as villageId,
        'construction' as type,
        timestamp,
        json_object(
          'fieldId', field_id,
          'building', (SELECT building FROM building_ids WHERE id = building_id),
          'previousLevel', previous_level,
          'newLevel', new_level
        ) as data
      FROM building_level_change_history
      ${villageFilter}
    `);
  }

  if (types.length === 0 || types.includes('training')) {
    queries.push(`
      SELECT
        'training-' || id as id,
        village_id as villageId,
        'training' as type,
        timestamp,
        json_object(
          'batchId', batch_id,
          'unit', (SELECT unit FROM unit_ids WHERE id = unit_id),
          'building', (SELECT building FROM building_ids WHERE id = building_id),
          'amount', amount
        ) as data
      FROM unit_training_history
      ${villageFilter}
    `);
  }

  if (types.length === 0 || types.includes('improvement')) {
    queries.push(`
      SELECT
        'improvement-' || id as id,
        (SELECT id FROM villages WHERE player_id = unit_improvement_history.player_id LIMIT 1) as villageId,
        'improvement' as type,
        timestamp,
        json_object(
          'unit', (SELECT unit FROM unit_ids WHERE id = unit_id),
          'previousLevel', previous_level,
          'newLevel', new_level
        ) as data
      FROM unit_improvement_history
      WHERE player_id = (SELECT player_id FROM villages WHERE id = $village_id)
    `);
  }

  if (types.length === 0 || types.includes('research')) {
    queries.push(`
      SELECT
        'research-' || id as id,
        village_id as villageId,
        'research' as type,
        timestamp,
        json_object(
          'unit', (SELECT unit FROM unit_ids WHERE id = unit_id)
        ) as data
      FROM unit_research_history
      ${villageFilter}
    `);
  }

  const sql = `
    SELECT * FROM (
      ${queries.join(' UNION ALL ')}
    )
    ORDER BY timestamp DESC
  `;

  return database.selectObjects({
    sql,
    bind: {
      $village_id: villageId,
    },
    schema: getEventsHistorySchema,
  });
});
