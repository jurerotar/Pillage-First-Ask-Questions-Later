import type { z } from 'zod';
import { occupiableOasisDtoSchema } from '@pillage-first/types/dtos/oasis';
import { villageBySlugDtoSchema } from '@pillage-first/types/dtos/village';
import { decodeGraphicsProperty } from '@pillage-first/utils/map';
import {
  buildingFieldRowSchema,
  type getOccupiableOasisInRangeRowSchema,
  type getVillageBySlugSchema,
} from '../schemas/village-schemas';

export const mapVillageBySlug = (
  row: z.infer<typeof getVillageBySlugSchema>,
) => {
  // building_fields is a JSON string aggregated in SQL
  let parsedBuildingFields: z.infer<typeof buildingFieldRowSchema>[] = [];
  try {
    const raw = row.building_fields ? JSON.parse(row.building_fields) : [];
    parsedBuildingFields = Array.isArray(raw)
      ? raw.map((it) => buildingFieldRowSchema.parse(it))
      : [];
  } catch {
    parsedBuildingFields = [];
  }

  const dto = {
    id: row.id,
    tileId: row.tile_id,
    playerId: row.player_id,
    name: row.name,
    slug: row.slug,
    coordinates: {
      x: row.coordinates_x,
      y: row.coordinates_y,
    },
    lastUpdatedAt: row.last_updated_at,
    resources: {
      wood: row.wood,
      clay: row.clay,
      iron: row.iron,
      wheat: row.wheat,
    },
    resourceFieldComposition: row.resource_field_composition,
    buildingFields: parsedBuildingFields.map((bf) => ({
      id: bf.field_id,
      buildingId: bf.building_id,
      level: bf.level,
    })),
  };

  return villageBySlugDtoSchema.parse(dto);
};

export const mapOccupiableOasisRowToDto = (
  row: z.infer<typeof getOccupiableOasisInRangeRowSchema>,
) => {
  const { oasisResource } = decodeGraphicsProperty(row.oasis_graphics);
  const parsedBonuses = JSON.parse(row.bonuses_json) as number[];

  const firstBonus = parsedBonuses.at(0)!;
  const secondBonus = parsedBonuses.at(1);

  const bonuses: {
    resource: z.infer<
      typeof occupiableOasisDtoSchema
    >['oasis']['bonuses'][number]['resource'];
    bonus: number;
  }[] = [
    {
      resource: oasisResource,
      bonus: firstBonus,
    },
  ];

  if (secondBonus) {
    bonuses.push({ resource: 'wheat', bonus: 25 });
  }

  return occupiableOasisDtoSchema.parse({
    oasis: {
      id: row.tile_id,
      coordinates: { x: row.tile_coordinates_x, y: row.tile_coordinates_y },
      bonuses,
    },
    player:
      row.occupying_player_id === null ||
      row.occupying_player_name === null ||
      row.occupying_player_slug === null
        ? null
        : {
            id: row.occupying_player_id,
            name: row.occupying_player_name,
            slug: row.occupying_player_slug,
          },
    village:
      row.occupying_village_id === null ||
      row.occupying_village_coordinates_x === null ||
      row.occupying_village_coordinates_y === null ||
      row.occupying_village_name === null ||
      row.occupying_village_slug === null
        ? null
        : {
            id: row.occupying_village_id,
            coordinates: {
              x: row.occupying_village_coordinates_x,
              y: row.occupying_village_coordinates_y,
            },
            name: row.occupying_village_name,
            slug: row.occupying_village_slug,
          },
  });
};
