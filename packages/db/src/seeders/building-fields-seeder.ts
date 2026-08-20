import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { buildingFieldsFactory } from '@pillage-first/game-assets/village';
import {
  type Building,
  buildingIdSchema,
} from '@pillage-first/types/models/building';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import type { Server } from '@pillage-first/types/models/server';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';
import { getVillageSize } from '../utils/village-size';

type TemplateField = [fieldId: number, buildingId: number, level: number];
type TemplateFieldInsertRow = [
  templateId: number,
  fieldId: number,
  buildingId: number,
  level: number,
];
type VillageTemplateInsertRow = [villageId: number, templateId: number];

export const buildingFieldsSeeder = (
  database: DbFacade,
  server: Server,
): void => {
  const buildingIdRows = database.selectObjects({
    sql: 'SELECT id, building FROM building_ids',
    schema: z.strictObject({ id: z.number(), building: buildingIdSchema }),
  });

  const buildingIdMap = new Map<Building['id'], number>(
    buildingIdRows.map((b) => [b.building, b.id]),
  );

  const villages = database.selectObjects({
    sql: `
      SELECT
        v.id AS village_id,
        t.x,
        t.y,
        rfc.resource_field_composition AS resource_field_composition,
        ti.tribe,
        p.id AS player_id
      FROM
        villages v
          JOIN tiles t ON v.tile_id = t.id
          LEFT JOIN resource_field_composition_ids rfc ON t.resource_field_composition_id = rfc.id
          JOIN players p ON v.player_id = p.id
          JOIN tribe_ids ti ON p.tribe_id = ti.id;
    `,
    schema: z.strictObject({
      village_id: z.number(),
      x: z.number(),
      y: z.number(),
      resource_field_composition: resourceFieldCompositionSchema,
      tribe: tribeSchema,
      player_id: z.number(),
    }),
  });

  const templateIds = new Map<string, number>();
  const templateFieldRows: TemplateFieldInsertRow[] = [];
  const villageTemplateRows: VillageTemplateInsertRow[] = [];
  let nextTemplateId = 1;

  const getTemplateId = (
    villageSize: Parameters<typeof buildingFieldsFactory>[0],
    tribe: Parameters<typeof buildingFieldsFactory>[1],
    resourceFieldComposition: Parameters<typeof buildingFieldsFactory>[2],
  ): number => {
    const templateKey = `${villageSize}:${tribe}:${resourceFieldComposition}`;
    const existingTemplateId = templateIds.get(templateKey);

    if (existingTemplateId !== undefined) {
      return existingTemplateId;
    }

    const templateId = nextTemplateId;
    nextTemplateId += 1;
    templateIds.set(templateKey, templateId);

    const buildingFields = buildingFieldsFactory(
      villageSize,
      tribe,
      resourceFieldComposition,
    );

    const template = buildingFields.map(
      ({ field_id, building_id, level }) =>
        [
          field_id,
          buildingIdMap.get(building_id)!,
          level,
        ] satisfies TemplateField,
    );

    for (const [fieldId, buildingId, level] of template) {
      templateFieldRows.push([templateId, fieldId, buildingId, level]);
    }

    return templateId;
  };

  for (const {
    player_id,
    resource_field_composition,
    tribe,
    village_id,
    x,
    y,
  } of villages) {
    if (player_id === PLAYER_ID) {
      const templateId = getTemplateId(
        'player',
        tribe,
        resource_field_composition,
      );

      villageTemplateRows.push([village_id, templateId]);
      continue;
    }

    const villageSize = getVillageSize(server.configuration.mapSize, x, y);

    const templateId = getTemplateId(
      villageSize,
      tribe,
      resource_field_composition,
    );

    villageTemplateRows.push([village_id, templateId]);
  }

  database.exec({
    sql: `
      CREATE TEMPORARY TABLE building_field_templates
      (
        template_id INTEGER NOT NULL,
        field_id INTEGER NOT NULL,
        building_id INTEGER NOT NULL,
        level INTEGER NOT NULL
      ) STRICT;
    `,
  });

  database.exec({
    sql: `
      CREATE TEMPORARY TABLE village_building_field_templates
      (
        village_id INTEGER NOT NULL,
        template_id INTEGER NOT NULL
      ) STRICT;
    `,
  });

  batchInsert(
    database,
    'building_field_templates',
    ['template_id', 'field_id', 'building_id', 'level'],
    templateFieldRows,
  );

  batchInsert(
    database,
    'village_building_field_templates',
    ['village_id', 'template_id'],
    villageTemplateRows,
  );

  database.exec({
    sql: `
      INSERT INTO
        building_fields (village_id, field_id, building_id, level)
      SELECT
        vbft.village_id,
        bft.field_id,
        bft.building_id,
        bft.level
      FROM
        village_building_field_templates vbft
          JOIN building_field_templates bft ON bft.template_id = vbft.template_id;
    `,
  });

  database.exec({ sql: 'DROP TABLE village_building_field_templates;' });
  database.exec({ sql: 'DROP TABLE building_field_templates;' });
};
