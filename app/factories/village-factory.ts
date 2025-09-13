import { createVillageResourceFields } from 'app/factories/presets/resource-building-fields-presets';
import { playerVillageBuildingFieldsPreset } from 'app/factories/presets/village-building-fields-presets';
import { getVillageSize } from 'app/factories/utils/village';
import type { Building } from 'app/interfaces/models/game/building';
import type { Player } from 'app/interfaces/models/game/player';
import type { Resources } from 'app/interfaces/models/game/resource';
import type { Server } from 'app/interfaces/models/game/server';
import type { OccupiedOccupiableTile } from 'app/interfaces/models/game/tile';
import type { PlayableTribe } from 'app/interfaces/models/game/tribe';
import type { Village, VillageSize } from 'app/interfaces/models/game/village';
import type { PRNGFunction } from 'ts-seedrandom';
import {
  npcVillageNameAdjectives,
  npcVillageNameNouns,
} from 'app/assets/village';
import { seededRandomIntFromInterval } from 'app/utils/common';
import { PLAYER_ID } from 'app/constants/player';
import type { BuildingField } from 'app/interfaces/models/game/building-field';

// TODO: Update these
const villageSizeToResourceAmountMap = new Map<VillageSize, number>([
  ['xxs', 6_300],
  ['xs', 6_300],
  ['sm', 31_300],
  ['md', 80_000],
  ['lg', 160_000],
  ['xl', 160_000],
  ['2xl', 160_000],
  ['3xl', 160_000],
  ['4xl', 160_000],
]);

const createVillageResources = (villageSize: VillageSize): Resources => {
  const amount = villageSizeToResourceAmountMap.get(villageSize)!;

  return {
    wood: amount,
    clay: amount,
    iron: amount,
    wheat: amount,
  };
};

// TODO: Update these
const villageSizeToWallLevelMap = new Map<VillageSize | 'player', number>([
  ['player', 0],
  ['xxs', 5],
  ['xs', 5],
  ['sm', 10],
  ['md', 15],
  ['lg', 20],
  ['xl', 20],
  ['2xl', 20],
  ['3xl', 20],
  ['4xl', 20],
]);

const tribeToWallBuildingIdMap = new Map<PlayableTribe, Building['id']>([
  ['romans', 'CITY_WALL'],
  ['gauls', 'PALISADE'],
  ['teutons', 'EARTH_WALL'],
  ['huns', 'MAKESHIFT_WALL'],
  ['egyptians', 'STONE_WALL'],
]);

const createWallBuildingField = (
  tribe: PlayableTribe,
  villageSize: VillageSize | 'player',
): BuildingField => {
  return {
    buildingId: tribeToWallBuildingIdMap.get(tribe)!,
    id: 40,
    level: villageSizeToWallLevelMap.get(villageSize)!,
  };
};

type PlayerVillageFactoryProps = {
  tile: OccupiedOccupiableTile;
  player: Player;
  slug: Village['slug'];
};

export const playerVillageFactory = ({
  tile,
  player,
  slug,
}: PlayerVillageFactoryProps): Village => {
  const { id: tileId, resourceFieldComposition, coordinates } = tile;

  const { tribe } = player;

  const buildingFields = [
    ...createVillageResourceFields(resourceFieldComposition, 'player'),
    ...playerVillageBuildingFieldsPreset,
    createWallBuildingField(tribe, 'player'),
  ];

  return {
    id: 1,
    tileId,
    // TODO: Figure out how to translate this, dumping t() around it makes it undefined
    name: 'New village',
    coordinates,
    slug,
    buildingFields,
    playerId: PLAYER_ID,
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

type NpcVillageFactoryProps = {
  prng: PRNGFunction;
  server: Server;
  tile: OccupiedOccupiableTile;
  player: Player;
  id: number;
};

const npcVillageFactory = ({
  prng,
  tile,
  player,
  server,
  id,
}: NpcVillageFactoryProps): Village => {
  const { id: tileId, resourceFieldComposition, coordinates } = tile;

  const { id: playerId, tribe } = player;

  const villageSize = getVillageSize(
    server.configuration.mapSize,
    tile.coordinates,
  );

  const buildingFields = [createWallBuildingField(tribe, villageSize)];

  const adjectiveIndex = seededRandomIntFromInterval(
    prng,
    0,
    npcVillageNameAdjectives.length - 1,
  );
  const nounIndex = seededRandomIntFromInterval(
    prng,
    0,
    npcVillageNameNouns.length - 1,
  );

  const adjective = npcVillageNameAdjectives[adjectiveIndex];
  const noun = npcVillageNameNouns[nounIndex];

  return {
    id,
    tileId,
    coordinates,
    name: `${adjective}${noun}`,
    slug: '',
    buildingFields,
    playerId,
    lastUpdatedAt: Date.now(),
    resources: createVillageResources(villageSize),
    resourceFieldComposition,
  };
};

type GenerateVillagesArgs = {
  prng: PRNGFunction;
  server: Server;
  occupiedOccupiableTiles: OccupiedOccupiableTile[];
  npcPlayers: Player[];
};

export const generateVillages = ({
  prng,
  occupiedOccupiableTiles,
  npcPlayers,
  server,
}: GenerateVillagesArgs) => {
  const playerMap = new Map(npcPlayers.map((p) => [p.id, p]));

  const villages: Village[] = occupiedOccupiableTiles
    .filter(({ ownedBy }) => ownedBy !== PLAYER_ID)
    .map((tile, index) => {
      const player = playerMap.get(tile.ownedBy)!;
      return npcVillageFactory({ prng, player, tile, server, id: index + 2 });
    });

  return villages;
};
