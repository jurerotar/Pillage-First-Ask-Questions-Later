import { createVillageResourceFields } from 'app/factories/presets/resource-building-fields-presets';
import { playerVillageBuildingFieldsPreset } from 'app/factories/presets/village-building-fields-presets';
import type { Building } from 'app/interfaces/models/game/building';
import type { Player } from 'app/interfaces/models/game/player';
import type { Resources } from 'app/interfaces/models/game/resource';
import type { OccupiedOccupiableTile } from 'app/interfaces/models/game/tile';
import type { PlayableTribe } from 'app/interfaces/models/game/tribe';
import type { BuildingField, Village, VillagePresetId } from 'app/interfaces/models/game/village';

const villageSizeToResourceAmountMap = new Map<OccupiedOccupiableTile['villageSize'], number>([
  ['xs', 6_300],
  ['sm', 31_300],
  ['md', 80_000],
  ['lg', 160_000],
]);

const createVillageResources = (villageSize: OccupiedOccupiableTile['villageSize']): Resources => {
  const amount = villageSizeToResourceAmountMap.get(villageSize)!;

  return {
    wood: amount,
    clay: amount,
    iron: amount,
    wheat: amount,
  };
};

const villageSizeToWallLevelMap = new Map<OccupiedOccupiableTile['villageSize'] | 'player', number>([
  ['player', 0],
  ['xs', 5],
  ['sm', 10],
  ['md', 15],
  ['lg', 20],
]);

const tribeToWallBuildingIdMap = new Map<PlayableTribe, Building['id']>([
  ['romans', 'CITY_WALL'],
  ['gauls', 'PALISADE'],
  ['teutons', 'EARTH_WALL'],
  ['huns', 'MAKESHIFT_WALL'],
  ['egyptians', 'STONE_WALL'],
]);

const createWallBuildingField = (tribe: PlayableTribe, villageSize: OccupiedOccupiableTile['villageSize'] | 'player'): BuildingField => {
  return {
    buildingId: tribeToWallBuildingIdMap.get(tribe)!,
    id: 40,
    level: villageSizeToWallLevelMap.get(villageSize)!,
  };
};

type VillageFactoryProps = {
  tile: OccupiedOccupiableTile;
  player: Player;
  slug: Village['slug'];
};

export const userVillageFactory = ({ tile, player, slug }: VillageFactoryProps): Village => {
  const { coordinates, resourceFieldComposition } = tile;

  const { id: playerId, name, tribe } = player;

  const buildingFields = [
    ...createVillageResourceFields(resourceFieldComposition, 'player'),
    ...playerVillageBuildingFieldsPreset,
    createWallBuildingField(tribe, 'player'),
  ];

  return {
    id: tile.id,
    name: `${name}'s village`,
    slug,
    coordinates,
    buildingFields,
    buildingFieldsPresets: [],
    playerId,
    isCapital: false,
    wheatUpkeep: 3,
    lastUpdatedAt: Date.now(),
    resourceFieldComposition,
    resources: {
      wood: 750,
      clay: 750,
      iron: 750,
      wheat: 750,
    },
  };
};

type NpcVillageFactoryProps = Omit<VillageFactoryProps, 'slug'>;

const npcVillageFactory = ({ tile, player }: NpcVillageFactoryProps): Village => {
  const { coordinates, resourceFieldComposition, villageSize, id } = tile;

  const { id: playerId, name, tribe } = player;

  const buildingFields = [createWallBuildingField(tribe, villageSize)];

  const villageBuildingFieldPresetId: VillagePresetId = `village-${villageSize}`;
  const resourcesBuildingFieldPresetId: VillagePresetId = `resources-${villageSize}`;

  return {
    id,
    name: `${name}'s village`,
    slug: null,
    coordinates,
    buildingFields,
    buildingFieldsPresets: [resourcesBuildingFieldPresetId, villageBuildingFieldPresetId],
    playerId,
    // TODO: We're keeping this at 0 for now, so npc villages would have a bunch of extra wheat, should be fixed
    wheatUpkeep: 0,
    isCapital: false,
    lastUpdatedAt: Date.now(),
    resources: createVillageResources(villageSize),
    resourceFieldComposition,
  };
};

type GenerateVillagesArgs = {
  occupiedOccupiableTiles: OccupiedOccupiableTile[];
  players: Player[];
};

export const generateVillages = ({ occupiedOccupiableTiles, players }: GenerateVillagesArgs) => {
  const npcOccupiedTiles = occupiedOccupiableTiles.filter(({ ownedBy }) => ownedBy !== 'player');

  const villages: Village[] = npcOccupiedTiles.map((tile) => {
    const player = players.find(({ id }) => tile.ownedBy === id)!;
    return npcVillageFactory({ player, tile });
  });

  return villages;
};
