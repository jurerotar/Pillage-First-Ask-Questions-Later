import { z } from 'zod';
import { createDocument, type ZodOpenApiPathsObject } from 'zod-openapi';
import { apiEffectDtoSchema } from '@pillage-first/types/dtos/effect';
import {
  baseEventDtoSchema,
  eventDtoSchema,
} from '@pillage-first/types/dtos/event';
import {
  farmListDetailsDtoSchema,
  farmListDtoSchema,
  updateFarmListDtoSchema,
} from '@pillage-first/types/dtos/farm-list';
import {
  heroDtoSchema,
  heroInventoryEntryDtoSchema,
  heroLoadoutEntryDtoSchema,
} from '@pillage-first/types/dtos/hero';
import {
  buildingLevelChangeHistoryItemDtoSchema,
  eventsHistoryItemDtoSchema,
  unitTrainingHistoryItemDtoSchema,
} from '@pillage-first/types/dtos/history';
import { tileLoyaltyDtoSchema } from '@pillage-first/types/dtos/loyalty';
import {
  mapMarkerDtoSchema,
  mapTileDtoSchema,
  mapTileOasisBonusDtoSchema,
  mapTileTroopDtoSchema,
  mapTileWorldItemDtoSchema,
} from '@pillage-first/types/dtos/map';
import { mapFiltersDtoSchema } from '@pillage-first/types/dtos/map-filters';
import { occupiableOasisDtoSchema } from '@pillage-first/types/dtos/oasis';
import {
  oasisByAnimalsSearchResultItemDtoSchema,
  oasisByBonusSearchResultItemDtoSchema,
} from '@pillage-first/types/dtos/oasis-search';
import {
  playerVillageDtoSchema,
  playerVillageWithPopulationDtoSchema,
  villageTroopDtoSchema,
} from '@pillage-first/types/dtos/player';
import {
  playerRankingItemDtoSchema,
  serverOverviewStatisticsDtoSchema,
  villageRankingItemDtoSchema,
} from '@pillage-first/types/dtos/statistics';
import {
  troopMovementItemDtoSchema,
  troopMovementStatsItemDtoSchema,
} from '@pillage-first/types/dtos/troop-movement';
import {
  researchedUnitDtoSchema,
  unitImprovementDtoSchema,
} from '@pillage-first/types/dtos/unit';
import { villageBySlugDtoSchema } from '@pillage-first/types/dtos/village';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import { developerSettingsSchema } from '@pillage-first/types/models/developer-settings';
import { gameEventTypeSchema } from '@pillage-first/types/models/game-event';
import { heroResourceToProduceSchema } from '@pillage-first/types/models/hero';
import { heroAdventuresSchema } from '@pillage-first/types/models/hero-adventures';
import { heroLoadoutSlotSchema } from '@pillage-first/types/models/hero-loadout';
import { playerSchema } from '@pillage-first/types/models/player';
import { preferencesSchema } from '@pillage-first/types/models/preferences';
import { questSchema } from '@pillage-first/types/models/quest';
import { reputationSchema } from '@pillage-first/types/models/reputation';
import { resourceSchema } from '@pillage-first/types/models/resource';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { serverSchema } from '@pillage-first/types/models/server';
import {
  natureUnitIdSchema,
  unitIdSchema,
} from '@pillage-first/types/models/unit';
import packageJson from '../../../package.json' with { type: 'json' };

export const paths = {
  '/server': {
    get: {
      summary: 'Get server details',
      responses: {
        '200': {
          description: 'Server details',
          content: {
            'application/json': {
              schema: serverSchema,
            },
          },
        },
      },
    },
  },
  '/players/me': {
    get: {
      summary: 'Get current player details',
      responses: {
        '200': {
          description: 'Current player details',
          content: {
            'application/json': {
              schema: playerSchema,
            },
          },
        },
      },
    },
  },
  '/players/:playerId/villages': {
    get: {
      summary: 'Get player village listing',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Object with village listing',
          content: {
            'application/json': {
              schema: z.array(playerVillageDtoSchema),
            },
          },
        },
      },
    },
  },
  '/players/:playerId/villages-with-population': {
    get: {
      summary: 'Get player villages with population',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Object with villages and population',
          content: {
            'application/json': {
              schema: z.array(playerVillageWithPopulationDtoSchema),
            },
          },
        },
      },
    },
  },
  '/villages/:villageId/troops': {
    get: {
      summary: 'Get troops by village',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Troops listing',
          content: {
            'application/json': {
              schema: z.array(villageTroopDtoSchema),
            },
          },
        },
      },
    },
  },
  '/players/:playerSlug': {
    get: {
      summary: 'Get player by slug',
      requestParams: {
        path: z.strictObject({
          playerSlug: playerSchema.shape.slug,
        }),
      },
      responses: {
        '200': {
          description: 'Player details',
          content: {
            'application/json': {
              schema: playerSchema,
            },
          },
        },
      },
    },
  },
  '/villages/:villageId': {
    patch: {
      summary: 'Rename village',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              name: z.string(),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Village renamed',
        },
      },
    },
  },
  '/villages/:villageSlug': {
    get: {
      summary: 'Get village by slug',
      requestParams: {
        path: z.strictObject({
          villageSlug: z.string(),
        }),
      },
      responses: {
        '200': {
          description: 'Village details',
          content: {
            'application/json': {
              schema: villageBySlugDtoSchema,
            },
          },
        },
      },
    },
  },
  '/villages/:villageId/occupiable-oasis': {
    get: {
      summary: 'Get occupiable oasis in range',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Occupiable oasis listing',
          content: {
            'application/json': {
              schema: z.array(occupiableOasisDtoSchema),
            },
          },
        },
      },
    },
  },
  '/villages/:villageId/building-fields': {
    patch: {
      summary: 'Rearrange building fields',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.array(
              z.strictObject({
                buildingFieldId: z.number(),
                buildingId: buildingIdSchema.nullable(),
              }),
            ),
          },
        },
      },
      responses: {
        '204': {
          description: 'Building fields rearranged',
        },
      },
    },
  },
  '/villages/:villageId/bookmarks': {
    get: {
      summary: 'Get bookmarks',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Bookmarks map',
          content: {
            'application/json': {
              schema: z.record(z.string(), z.string()),
            },
          },
        },
      },
    },
  },
  '/villages/:villageId/bookmarks/:buildingId': {
    patch: {
      summary: 'Update bookmark',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
          buildingId: buildingIdSchema,
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              tab: z.string(),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Bookmark updated',
        },
      },
    },
  },
  '/players/:playerId/hero': {
    get: {
      summary: 'Get hero details',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Hero details',
          content: {
            'application/json': {
              schema: heroDtoSchema,
            },
          },
        },
      },
    },
  },
  '/players/:playerId/hero/equipped-items': {
    get: {
      summary: 'Get hero loadout',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Hero loadout',
          content: {
            'application/json': {
              schema: z.array(heroLoadoutEntryDtoSchema),
            },
          },
        },
      },
    },
    patch: {
      summary: 'Equip hero item',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              itemId: z.number(),
              slot: heroLoadoutSlotSchema,
              amount: z.number(),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Item equipped',
        },
      },
    },
  },
  '/players/:playerId/hero/inventory': {
    get: {
      summary: 'Get hero inventory',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Hero inventory',
          content: {
            'application/json': {
              schema: z.array(heroInventoryEntryDtoSchema),
            },
          },
        },
      },
    },
  },
  '/players/:playerId/hero/adventures': {
    get: {
      summary: 'Get hero adventures',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Hero adventures',
          content: {
            'application/json': {
              schema: heroAdventuresSchema,
            },
          },
        },
      },
    },
    post: {
      summary: 'Start hero adventure',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '204': {
          description: 'Adventure started',
        },
      },
    },
  },
  '/players/:playerId/hero/attributes': {
    patch: {
      summary: 'Change hero attributes',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              attackPower: z.number().int().min(0).max(100),
              resourceProduction: z.number().int().min(0).max(100),
              attackBonus: z.number().int().min(0).max(100),
              defenceBonus: z.number().int().min(0).max(100),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Attributes changed',
        },
      },
    },
  },
  '/players/:playerId/hero/resource-to-produce': {
    patch: {
      summary: 'Change hero resource to produce',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              resource: heroResourceToProduceSchema,
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Resource to produce changed',
        },
      },
    },
  },
  '/players/:playerId/hero/equipped-items/:slot': {
    delete: {
      summary: 'Unequip hero item',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
          slot: heroLoadoutSlotSchema,
        }),
      },
      responses: {
        '204': {
          description: 'Item unequipped',
        },
      },
    },
  },
  '/players/:playerId/hero/item': {
    post: {
      summary: 'Use hero item',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              itemId: z.number(),
              amount: z.number(),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Item used',
        },
      },
    },
  },
  '/developer-settings': {
    get: {
      summary: 'Get developer settings',
      responses: {
        '200': {
          description: 'Developer settings',
          content: {
            'application/json': {
              schema: developerSettingsSchema,
            },
          },
        },
      },
    },
  },
  '/developer-settings/:developerSettingName': {
    patch: {
      summary: 'Update developer setting',
      requestParams: {
        path: z.strictObject({
          developerSettingName: z.string(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              value: z.boolean(),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Setting updated',
        },
      },
    },
  },
  '/developer-settings/:heroId/level-up': {
    patch: {
      summary: 'Level up hero',
      requestParams: {
        path: z.strictObject({
          heroId: z.coerce.number(),
        }),
      },
      responses: {
        '204': {
          description: 'Hero leveled up',
        },
      },
    },
  },
  '/developer-settings/:heroId/spawn-item': {
    patch: {
      summary: 'Spawn hero item',
      requestParams: {
        path: z.strictObject({
          heroId: z.coerce.number(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              itemId: z.number(),
              amount: z.number(),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Item spawned',
        },
      },
    },
  },
  '/developer-settings/:villageId/resources': {
    patch: {
      summary: 'Update village resources',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              resource: resourceSchema,
              amount: z.number(),
              direction: z.enum(['add', 'subtract']),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Resources updated',
        },
      },
    },
  },
  '/developer-settings/:heroId/increment-adventure-points': {
    patch: {
      summary: 'Increment hero adventure points',
      requestParams: {
        path: z.strictObject({
          heroId: z.coerce.number(),
        }),
      },
      responses: {
        '204': {
          description: 'Adventure points incremented',
        },
      },
    },
  },
  '/developer-settings/:heroId/kill': {
    patch: {
      summary: 'Kill hero',
      requestParams: {
        path: z.strictObject({
          heroId: z.coerce.number(),
        }),
      },
      responses: {
        '204': {
          description: 'Hero killed',
        },
      },
    },
  },
  '/villages/:villageId/farm-lists': {
    get: {
      summary: 'Get farm lists',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Farm lists',
          content: {
            'application/json': {
              schema: z.array(farmListDtoSchema),
            },
          },
        },
      },
    },
    post: {
      summary: 'Create farm list',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              name: z.string(),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Farm list created',
        },
      },
    },
  },
  '/players/:playerId/farm-lists': {
    get: {
      summary: 'Get player farm lists',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Farm lists',
          content: {
            'application/json': {
              schema: z.array(farmListDtoSchema),
            },
          },
        },
      },
    },
  },
  '/players/:playerId/farm-lists/tiles': {
    delete: {
      summary: 'Remove tile from all player farm lists',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              tileId: z.number(),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Tile removed from all farm lists',
        },
      },
    },
  },
  '/farm-lists/:farmListId': {
    get: {
      summary: 'Get farm list details',
      requestParams: {
        path: z.strictObject({
          farmListId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Farm list details',
          content: {
            'application/json': {
              schema: farmListDetailsDtoSchema,
            },
          },
        },
      },
    },
    patch: {
      summary: 'Update farm list',
      requestParams: {
        path: z.strictObject({
          farmListId: z.coerce.number(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: updateFarmListDtoSchema,
          },
        },
      },
      responses: {
        '204': {
          description: 'Farm list updated',
        },
      },
    },
    delete: {
      summary: 'Delete farm list',
      requestParams: {
        path: z.strictObject({
          farmListId: z.coerce.number(),
        }),
      },
      responses: {
        '204': {
          description: 'Farm list deleted',
        },
      },
    },
  },
  '/farm-lists/:farmListId/tiles': {
    post: {
      summary: 'Add tile to farm list',
      requestParams: {
        path: z.strictObject({
          farmListId: z.coerce.number(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              tileId: z.number(),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Tile added',
        },
      },
    },
  },
  '/farm-lists/:farmListId/clone': {
    post: {
      summary: 'Clone farm list to another village',
      requestParams: {
        path: z.strictObject({
          farmListId: z.coerce.number(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              villageId: z.number(),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Farm list cloned',
        },
      },
    },
  },
  '/farm-lists/:farmListId/tiles/:tileId': {
    delete: {
      summary: 'Remove tile from farm list',
      requestParams: {
        path: z.strictObject({
          farmListId: z.coerce.number(),
          tileId: z.coerce.number(),
        }),
      },
      responses: {
        '204': {
          description: 'Tile removed',
        },
      },
    },
  },
  '/villages/:villageId/events': {
    get: {
      summary: 'Get village events',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Village events',
          content: {
            'application/json': {
              schema: z.array(baseEventDtoSchema),
            },
          },
        },
      },
    },
  },
  '/villages/:villageId/events/:eventType': {
    get: {
      summary: 'Get village events by type',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
          eventType: z.union([gameEventTypeSchema, z.literal('troopMovement')]),
        }),
      },
      responses: {
        '200': {
          description: 'Village events by type',
          content: {
            'application/json': {
              schema: z.array(baseEventDtoSchema),
            },
          },
        },
      },
    },
  },
  '/villages/:villageId/history/events': {
    get: {
      summary: 'Get village events history',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
        query: z.strictObject({
          page: z.coerce.number().optional().default(1),
          scope: z.enum(['village', 'global']).optional().default('village'),
          types: z
            .array(
              z.enum([
                'construction',
                'training',
                'improvement',
                'research',
                'founding',
              ]),
            )
            .or(
              z.enum([
                'construction',
                'training',
                'improvement',
                'research',
                'founding',
              ]),
            )
            .optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Village events history',
          content: {
            'application/json': {
              schema: z.array(eventsHistoryItemDtoSchema),
            },
          },
        },
      },
    },
  },
  '/villages/:villageId/history/buildings': {
    get: {
      summary: 'Get village building level change history',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Village building level change history',
          content: {
            'application/json': {
              schema: z.array(buildingLevelChangeHistoryItemDtoSchema),
            },
          },
        },
      },
    },
  },
  '/villages/:villageId/history/units': {
    get: {
      summary: 'Get village unit training history',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
        query: z.strictObject({
          buildingId: buildingIdSchema.nullable().optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Village unit training history',
          content: {
            'application/json': {
              schema: z.array(unitTrainingHistoryItemDtoSchema),
            },
          },
        },
      },
    },
  },
  '/events': {
    post: {
      summary: 'Create new events',
      requestBody: {
        content: {
          'application/json': {
            schema: z.optional(eventDtoSchema),
          },
        },
      },
      responses: {
        '204': {
          description: 'Events created',
        },
      },
    },
  },
  '/events/:eventId': {
    delete: {
      summary: 'Cancel event',
      requestParams: {
        path: z.strictObject({
          eventId: z.string(),
        }),
      },
      responses: {
        '204': {
          description: 'Event cancelled',
        },
      },
    },
  },
  '/events/unit-improvement-event/:eventId': {
    delete: {
      summary: 'Cancel unit improvement event',
      requestParams: {
        path: z.strictObject({
          eventId: z.string(),
        }),
      },
      responses: {
        '204': {
          description: 'Event cancelled',
        },
      },
    },
  },
  '/tiles': {
    get: {
      summary: 'Get all tiles',
      responses: {
        '200': {
          description: 'List of all tiles',
          content: {
            'application/json': {
              schema: z.array(mapTileDtoSchema.nullable()),
            },
          },
        },
      },
    },
  },
  '/tiles/:tileId/troops': {
    get: {
      summary: 'Get troops on a tile',
      requestParams: {
        path: z.strictObject({
          tileId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Troops on tile',
          content: {
            'application/json': {
              schema: z.array(mapTileTroopDtoSchema),
            },
          },
        },
      },
    },
  },
  '/tiles/:tileId/bonuses': {
    get: {
      summary: 'Get oasis bonuses on a tile',
      requestParams: {
        path: z.strictObject({
          tileId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Oasis bonuses',
          content: {
            'application/json': {
              schema: z.array(mapTileOasisBonusDtoSchema),
            },
          },
        },
      },
    },
  },
  '/tiles/:tileId/world-item': {
    get: {
      summary: 'Get world item on a tile',
      requestParams: {
        path: z.strictObject({
          tileId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'World item on tile',
          content: {
            'application/json': {
              schema: mapTileWorldItemDtoSchema.nullable(),
            },
          },
        },
      },
    },
  },
  '/tiles/:tileId/loyalty': {
    get: {
      summary: 'Get current loyalty of a tile',
      requestParams: {
        path: z.strictObject({
          tileId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Tile loyalty',
          content: {
            'application/json': {
              schema: tileLoyaltyDtoSchema,
            },
          },
        },
      },
    },
  },
  '/players/:playerId/map-markers': {
    get: {
      summary: 'Get map markers',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Map markers',
          content: {
            'application/json': {
              schema: z.array(mapMarkerDtoSchema),
            },
          },
        },
      },
    },
    post: {
      summary: 'Add map marker',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              tileId: z.number(),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Marker added',
        },
      },
    },
  },
  '/players/:playerId/map-markers/:tileId': {
    delete: {
      summary: 'Remove map marker',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
          tileId: z.coerce.number(),
        }),
      },
      responses: {
        '204': {
          description: 'Marker removed',
        },
      },
    },
  },
  '/players/:playerId/map-filters': {
    get: {
      summary: 'Get map filters',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Map filters',
          content: {
            'application/json': {
              schema: mapFiltersDtoSchema,
            },
          },
        },
      },
    },
  },
  '/players/:playerId/map-filters/:filterName': {
    patch: {
      summary: 'Update map filter',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
          filterName: z.string(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              value: z.boolean(),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Filter updated',
        },
      },
    },
  },
  '/villages/:villageId/quests': {
    get: {
      summary: 'Get village quests',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Village quests',
          content: {
            'application/json': {
              schema: z.array(questSchema),
            },
          },
        },
      },
    },
  },
  '/villages/:villageId/quests/collectables/count': {
    get: {
      summary: 'Get collectable quests count',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Collectable quests count',
          content: {
            'application/json': {
              schema: z.strictObject({
                collectableQuestCount: z.number(),
              }),
            },
          },
        },
      },
    },
  },
  '/villages/:villageId/quests/:questId/collect': {
    patch: {
      summary: 'Collect quest reward',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
          questId: z.string(),
        }),
      },
      responses: {
        '204': {
          description: 'Reward collected',
        },
      },
    },
  },
  '/players/:playerId/reputations': {
    get: {
      summary: 'Get player faction reputations',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Faction reputations',
          content: {
            'application/json': {
              schema: z.array(reputationSchema),
            },
          },
        },
      },
    },
  },
  '/statistics/players': {
    get: {
      summary: 'Get player rankings',
      requestParams: {
        query: z.strictObject({
          lastPlayerId: z.coerce.number().nullable().optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Player rankings',
          content: {
            'application/json': {
              schema: z.array(playerRankingItemDtoSchema),
            },
          },
        },
      },
    },
  },
  '/statistics/villages': {
    get: {
      summary: 'Get village rankings',
      requestParams: {
        query: z.strictObject({
          lastVillageId: z.coerce.number().nullable().optional(),
        }),
      },
      responses: {
        '200': {
          description: 'Village rankings',
          content: {
            'application/json': {
              schema: z.array(villageRankingItemDtoSchema),
            },
          },
        },
      },
    },
  },
  '/statistics/overview': {
    get: {
      summary: 'Get game world overview statistics',
      responses: {
        '200': {
          description: 'Overview statistics',
          content: {
            'application/json': {
              schema: serverOverviewStatisticsDtoSchema,
            },
          },
        },
      },
    },
  },
  '/players/:playerId/unit-improvements': {
    get: {
      summary: 'Get unit improvements',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Unit improvements',
          content: {
            'application/json': {
              schema: z.array(unitImprovementDtoSchema),
            },
          },
        },
      },
    },
  },
  '/villages/:villageId/researched-units': {
    get: {
      summary: 'Get researched units in village',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Researched units',
          content: {
            'application/json': {
              schema: z.array(researchedUnitDtoSchema),
            },
          },
        },
      },
    },
  },
  '/villages/:villageId/artifacts': {
    get: {
      summary: 'Get artifacts around village',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Artifacts list',
          content: {
            'application/json': {
              schema: z.array(mapTileWorldItemDtoSchema),
            },
          },
        },
      },
    },
  },
  '/villages/:villageId/effects': {
    get: {
      summary: 'Get village effects',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Village effects',
          content: {
            'application/json': {
              schema: z.array(apiEffectDtoSchema),
            },
          },
        },
      },
    },
  },
  '/villages/:villageId/oasis/:oasisId': {
    post: {
      summary: 'Occupy oasis',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
          oasisId: z.coerce.number(),
        }),
      },
      responses: {
        '204': {
          description: 'Oasis occupied',
        },
      },
    },
    delete: {
      summary: 'Abandon oasis',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
          oasisId: z.coerce.number(),
        }),
      },
      responses: {
        '204': {
          description: 'Oasis abandoned',
        },
      },
    },
  },
  '/search/oases/by-bonus': {
    post: {
      summary: 'Find tiles with specific oasis bonuses',
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              x: z.number(),
              y: z.number(),
              resourceFieldComposition: resourceFieldCompositionSchema.or(
                z.literal('any-cropper'),
              ),
              bonuses: z.strictObject({
                firstOasis: z.array(
                  z.strictObject({
                    bonus: z.union([z.literal(25), z.literal(50)]),
                    resource: resourceSchema,
                  }),
                ),
                secondOasis: z.array(
                  z.strictObject({
                    bonus: z.union([z.literal(25), z.literal(50)]),
                    resource: resourceSchema,
                  }),
                ),
                thirdOasis: z.array(
                  z.strictObject({
                    bonus: z.union([z.literal(25), z.literal(50)]),
                    resource: resourceSchema,
                  }),
                ),
              }),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Tiles with bonuses',
          content: {
            'application/json': {
              schema: z.array(oasisByBonusSearchResultItemDtoSchema),
            },
          },
        },
      },
    },
  },
  '/search/oases/by-animals': {
    post: {
      summary: 'Find oasis tiles with specific nature troop amounts',
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              x: z.number(),
              y: z.number(),
              animalFilters: z.array(
                z.strictObject({
                  animal: natureUnitIdSchema,
                  amount: z.number().min(1),
                }),
              ),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Oases that match the animal criteria',
          content: {
            'application/json': {
              schema: z.array(oasisByAnimalsSearchResultItemDtoSchema),
            },
          },
        },
      },
    },
  },
  '/players/:playerId/preferences': {
    get: {
      summary: 'Get player preferences',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Player preferences',
          content: {
            'application/json': {
              schema: preferencesSchema,
            },
          },
        },
      },
    },
  },
  '/players/:playerId/preferences/:preferenceName': {
    patch: {
      summary: 'Update player preference',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
          preferenceName: z.string(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              value: z.union([z.boolean(), z.enum(['detailed', 'compact'])]),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Preference updated',
        },
      },
    },
  },
  '/villages/:villageId/troop-movements': {
    get: {
      summary: 'Get village troop movements',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'List of troop movements',
          content: {
            'application/json': {
              schema: z.array(troopMovementItemDtoSchema),
            },
          },
        },
      },
    },
  },
  '/villages/:villageId/troop-movements/stats': {
    get: {
      summary: 'Get village troop movement stats',
      requestParams: {
        path: z.strictObject({
          villageId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Troop movement stats',
          content: {
            'application/json': {
              schema: z.array(troopMovementStatsItemDtoSchema),
            },
          },
        },
      },
    },
  },
  '/troop-movements/:eventId': {
    delete: {
      summary: 'Cancel troop movement',
      requestParams: {
        path: z.strictObject({
          eventId: z.coerce.number(),
        }),
      },
      responses: {
        '204': {
          description: 'Movement cancelled',
        },
      },
    },
  },
  '/troop-movements/validate': {
    post: {
      summary: 'Validate troop movement',
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              type: z.string(),
              villageId: z.number(),
              targetCoordinates: z.strictObject({
                x: z.number(),
                y: z.number(),
              }),
              troops: z.array(
                z.strictObject({
                  unitId: unitIdSchema,
                  amount: z.number(),
                }),
              ),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Validation results',
          content: {
            'application/json': {
              schema: z.strictObject({
                errors: z.array(z.string()),
              }),
            },
          },
        },
      },
    },
  },
  '/players/:playerId/reports': {
    get: {
      summary: 'Get my reports',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'List of reports',
          content: {
            'application/json': {
              schema: z.array(
                z.strictObject({
                  id: z.string(),
                  tags: z.array(z.enum(['read', 'archived'])),
                  timestamp: z.number().int(),
                  villageId: z.number().int(),
                }),
              ),
            },
          },
        },
      },
    },
  },
  '/players/:playerId/reports/unread-count': {
    get: {
      summary: 'Get unread reports count',
      requestParams: {
        path: z.strictObject({
          playerId: z.coerce.number(),
        }),
      },
      responses: {
        '200': {
          description: 'Unread reports count',
          content: {
            'application/json': {
              schema: z.number().int(),
            },
          },
        },
      },
    },
  },
  '/reports/:reportId': {
    patch: {
      summary: 'Update report',
      requestParams: {
        path: z.strictObject({
          reportId: z.string(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              tag: z.enum(['read', 'archived']),
            }),
          },
        },
      },
      responses: {
        '204': {
          description: 'Updated',
        },
      },
    },
    delete: {
      summary: 'Delete report',
      requestParams: {
        path: z.strictObject({
          reportId: z.string(),
        }),
      },
      responses: {
        '204': {
          description: 'Deleted',
        },
      },
    },
  },
} satisfies ZodOpenApiPathsObject;

export const document = createDocument({
  openapi: '3.1.0',
  info: {
    title: 'Pillage First! worker-based API',
    version: packageJson.version,
    description: 'Pillage First! worker-based API',
  },
  paths,
});
