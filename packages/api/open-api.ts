import { z } from 'zod';
import { createDocument, type ZodOpenApiPathsObject } from 'zod-openapi';
import { heroAdventuresSchema } from '@pillage-first/types/models/hero-adventures';
import { playerSchema } from '@pillage-first/types/models/player';
import { resourceSchema } from '@pillage-first/types/models/resource';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { serverDbSchema } from '@pillage-first/types/models/server';
import { getDeveloperSettingsSchema } from './src/controllers/schemas/developer-tools-schemas';
import {
  farmListSchema,
  farmListTileSchema,
} from './src/controllers/schemas/farm-list-schemas';
import {
  getHeroInventorySchema,
  getHeroLoadoutSchema,
  getHeroSchema,
} from './src/controllers/schemas/hero-schemas';
import { getMapFiltersSchema } from './src/controllers/schemas/map-filters-schemas';
import {
  getTileOasisBonusesSchema,
  getTilesSchema,
  getTileTroopsSchema,
  getTileWorldItemSchema,
} from './src/controllers/schemas/map-schemas';
import { getTilesWithBonusesSchema } from './src/controllers/schemas/oasis-bonus-finder-schemas';
import {
  getPlayerVillagesWithPopulationSchema,
  getTroopsByVillageSchema,
  getVillagesByPlayerSchema,
} from './src/controllers/schemas/player-schemas';
import { getPreferencesSchema } from './src/controllers/schemas/preferences-schemas';
import { getQuestsSchema } from './src/controllers/schemas/quest-schemas';
import { getReputationsSchema } from './src/controllers/schemas/reputation-schemas';
import {
  getPlayerRankingsSchema,
  getServerOverviewStatisticsSchema,
  getVillageRankingsSchema,
} from './src/controllers/schemas/statistics-schemas';
import { getUnitImprovementsSchema } from './src/controllers/schemas/unit-improvement-schemas';
import { getResearchedUnitsSchema } from './src/controllers/schemas/unit-research-schemas';
import {
  getOccupiableOasisInRangeSchema,
  getVillageBySlugSchema,
} from './src/controllers/schemas/village-schemas';
import { getArtifactsAroundVillageSchema } from './src/controllers/schemas/world-items-schemas';
import { apiEffectSchema } from './src/utils/zod/effect-schemas';

export const paths = {
  '/server': {
    get: {
      summary: 'Get server details',
      responses: {
        '200': {
          description: 'Server details',
          content: {
            'application/json': {
              schema: serverDbSchema,
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
          playerId: playerSchema.shape.id,
        }),
      },
      responses: {
        '200': {
          description: 'Object with village listing',
          content: {
            'application/json': {
              schema: getVillagesByPlayerSchema,
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
          playerId: playerSchema.shape.id,
        }),
      },
      responses: {
        '200': {
          description: 'Object with villages and population',
          content: {
            'application/json': {
              schema: getPlayerVillagesWithPopulationSchema,
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
              schema: z.array(getTroopsByVillageSchema),
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
  '/villages/:villageId/rename': {
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
              schema: getVillageBySlugSchema,
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
              schema: z.array(getOccupiableOasisInRangeSchema),
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
                buildingId: z.string().nullable(),
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
          buildingId: z.string(),
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
          playerId: playerSchema.shape.id,
        }),
      },
      responses: {
        '200': {
          description: 'Hero details',
          content: {
            'application/json': {
              schema: getHeroSchema,
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
          playerId: playerSchema.shape.id,
        }),
      },
      responses: {
        '200': {
          description: 'Hero loadout',
          content: {
            'application/json': {
              schema: z.array(getHeroLoadoutSchema),
            },
          },
        },
      },
    },
    patch: {
      summary: 'Equip hero item',
      requestParams: {
        path: z.strictObject({
          playerId: playerSchema.shape.id,
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              itemId: z.number(),
              slot: z.string(),
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
          playerId: playerSchema.shape.id,
        }),
      },
      responses: {
        '200': {
          description: 'Hero inventory',
          content: {
            'application/json': {
              schema: z.array(getHeroInventorySchema),
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
          playerId: playerSchema.shape.id,
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
          playerId: playerSchema.shape.id,
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
          playerId: playerSchema.shape.id,
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              attribute: z.enum([
                'attackPower',
                'resourceProduction',
                'attackBonus',
                'defenceBonus',
              ]),
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
  '/players/:playerId/hero/equipped-items/:slot': {
    delete: {
      summary: 'Unequip hero item',
      requestParams: {
        path: z.strictObject({
          playerId: playerSchema.shape.id,
          slot: z.string(),
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
          playerId: playerSchema.shape.id,
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
              schema: getDeveloperSettingsSchema,
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
              value: z.any(),
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
  '/players/:playerId/farm-lists': {
    get: {
      summary: 'Get farm lists',
      requestParams: {
        path: z.strictObject({
          playerId: playerSchema.shape.id,
        }),
      },
      responses: {
        '200': {
          description: 'Farm lists',
          content: {
            'application/json': {
              schema: z.array(farmListSchema),
            },
          },
        },
      },
    },
    post: {
      summary: 'Create farm list',
      requestParams: {
        path: z.strictObject({
          playerId: playerSchema.shape.id,
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
              schema: farmListSchema.extend({
                tileIds: z.array(farmListTileSchema),
              }),
            },
          },
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
  '/farm-lists/:farmListId/rename': {
    patch: {
      summary: 'Rename farm list',
      requestParams: {
        path: z.strictObject({
          farmListId: z.coerce.number(),
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
          description: 'Farm list renamed',
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
              schema: z.array(z.any()),
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
          eventType: z.string(),
        }),
      },
      responses: {
        '200': {
          description: 'Village events by type',
          content: {
            'application/json': {
              schema: z.array(z.any()),
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
            schema: z.any(),
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
  '/tiles': {
    get: {
      summary: 'Get all tiles',
      responses: {
        '200': {
          description: 'List of all tiles',
          content: {
            'application/json': {
              schema: z.array(getTilesSchema.nullable()),
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
              schema: z.array(getTileTroopsSchema),
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
              schema: z.array(getTileOasisBonusesSchema),
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
              schema: getTileWorldItemSchema.nullable(),
            },
          },
        },
      },
    },
  },
  '/players/:playerId/map-filters': {
    get: {
      summary: 'Get map filters',
      requestParams: {
        path: z.strictObject({
          playerId: playerSchema.shape.id,
        }),
      },
      responses: {
        '200': {
          description: 'Map filters',
          content: {
            'application/json': {
              schema: getMapFiltersSchema,
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
          playerId: playerSchema.shape.id,
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
              schema: z.array(getQuestsSchema),
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
          playerId: playerSchema.shape.id,
        }),
      },
      responses: {
        '200': {
          description: 'Faction reputations',
          content: {
            'application/json': {
              schema: z.array(getReputationsSchema),
            },
          },
        },
      },
    },
  },
  '/statistics/players': {
    get: {
      summary: 'Get player rankings',
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              lastPlayerId: z.number().nullable(),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Player rankings',
          content: {
            'application/json': {
              schema: z.array(getPlayerRankingsSchema),
            },
          },
        },
      },
    },
  },
  '/statistics/villages': {
    get: {
      summary: 'Get village rankings',
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              lastVillageId: z.number().nullable(),
            }),
          },
        },
      },
      responses: {
        '200': {
          description: 'Village rankings',
          content: {
            'application/json': {
              schema: z.array(getVillageRankingsSchema),
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
              schema: getServerOverviewStatisticsSchema,
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
          playerId: playerSchema.shape.id,
        }),
      },
      responses: {
        '200': {
          description: 'Unit improvements',
          content: {
            'application/json': {
              schema: z.array(getUnitImprovementsSchema),
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
              schema: z.array(getResearchedUnitsSchema),
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
              schema: z.array(getArtifactsAroundVillageSchema),
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
              schema: z.array(apiEffectSchema),
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
  '/oasis-bonus-finder': {
    get: {
      summary: 'Find tiles with specific oasis bonuses',
      requestParams: {
        query: z.strictObject({
          x: z.coerce.number(),
          y: z.coerce.number(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
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
              schema: z.array(getTilesWithBonusesSchema),
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
          playerId: playerSchema.shape.id,
        }),
      },
      responses: {
        '200': {
          description: 'Player preferences',
          content: {
            'application/json': {
              schema: getPreferencesSchema,
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
          playerId: playerSchema.shape.id,
          preferenceName: z.string(),
        }),
      },
      requestBody: {
        content: {
          'application/json': {
            schema: z.strictObject({
              value: z.any(),
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
} satisfies ZodOpenApiPathsObject;

export const document = createDocument({
  openapi: '3.1.0',
  info: {
    title: 'Pillage First! worker-based API',
    version: '1.0.0',
    description: 'Proof of Concept for zod-openapi',
  },
  paths,
});
