import type { OccupiedOccupiableTile } from 'app/interfaces/models/game/tile';
import type { WorldItem } from 'app/interfaces/models/game/world-item';
import type { VillageSize } from 'app/interfaces/models/game/village';
import { getVillageSize } from 'app/factories/utils/village';
import { partition, seededRandomArrayElement, seededRandomArrayElements } from 'app/utils/common';
import type { PRNGFunction } from 'ts-seedrandom';
import type { Server } from 'app/interfaces/models/game/server';
import { items } from 'app/(game)/(village-slug)/assets/items';

const [miscellaneousHeroItems, wearableAndArtifactItems] = partition(items, ({ category }) =>
  ['consumable', 'resource', 'currency'].includes(category),
);
const epicHeroItems = wearableAndArtifactItems.filter(({ rarity }) => rarity === 'epic');
const rareHeroItems = wearableAndArtifactItems.filter(({ rarity }) => rarity === 'rare');
const uncommonHeroItems = wearableAndArtifactItems.filter(({ rarity }) => rarity === 'uncommon');
const commonHeroItems = wearableAndArtifactItems.filter(({ rarity }) => rarity === 'common');

type WorldItemsFactoryArgs = {
  server: Server;
  prng: PRNGFunction;
  occupiedOccupiableTiles: OccupiedOccupiableTile[];
};

type TileWithSize = OccupiedOccupiableTile & {
  size: VillageSize;
};

export const worldItemsFactory = ({ server, prng, occupiedOccupiableTiles }: WorldItemsFactoryArgs): WorldItem[] => {
  const eligibleTiles = occupiedOccupiableTiles.filter(({ id }) => {
    return id !== 0;
  });

  const tilesWithSize: TileWithSize[] = eligibleTiles.map((tile) => {
    return {
      ...tile,
      size: getVillageSize(server.configuration.mapSize, tile.id),
    };
  });

  // Artifacts
  const epicHeroItemCandidates = tilesWithSize.filter(({ size }) => size === '4xl');
  const epicHeroItemTiles = seededRandomArrayElements(prng, epicHeroItemCandidates, epicHeroItems.length);
  const epicHeroItemWorldItems: WorldItem[] = epicHeroItemTiles.map((tile, index) => {
    const { id, category } = epicHeroItems[index];
    return {
      id,
      type: category,
      amount: 1,
      tileId: tile.id,
    };
  });

  // Rare hero items
  const rareHeroItemCandidates = tilesWithSize.filter((tile) => ['3xl', '2xl'].includes(tile.size));
  const rareHeroItemTiles = seededRandomArrayElements(prng, rareHeroItemCandidates, rareHeroItems.length);
  const rareHeroWorldItems: WorldItem[] = rareHeroItemTiles.map((tile, index) => {
    const { id, category } = rareHeroItems[index];
    return {
      id,
      type: category,
      tileId: tile.id,
      amount: 1,
    };
  });

  // Uncommon hero items
  const uncommonHeroItemCandidates = tilesWithSize.filter((tile) => ['xl', 'lg'].includes(tile.size));
  const uncommonHeroItemTiles = seededRandomArrayElements(prng, uncommonHeroItemCandidates, uncommonHeroItems.length);
  const uncommonHeroWorldItems: WorldItem[] = uncommonHeroItemTiles.map((tile, index) => {
    const { id, category } = uncommonHeroItems[index];
    return {
      id,
      type: category,
      tileId: tile.id,
      amount: 1,
    };
  });

  // Common hero items
  const commonHeroItemCandidates = tilesWithSize.filter((tile) => ['md', 'sm'].includes(tile.size));
  const commonHeroItemTiles = seededRandomArrayElements(prng, commonHeroItemCandidates, commonHeroItems.length);
  const commonHeroWorldItems: WorldItem[] = commonHeroItemTiles.map((tile, index) => {
    const { id, category } = commonHeroItems[index];
    return {
      id,
      type: category,
      tileId: tile.id,
      amount: 1,
    };
  });

  // Consumable hero items
  const tilesWithWorldItems = [...epicHeroItemWorldItems, ...rareHeroWorldItems, ...uncommonHeroWorldItems, ...commonHeroWorldItems];
  const occupiedIds = tilesWithWorldItems.map(({ tileId }) => tileId);
  const consumableHeroItemCandidates = eligibleTiles.filter(({ id }) => {
    return !occupiedIds.includes(id);
  });
  // Half of remaining villages should have non-wearable items
  const amountOfVillagesToPick = consumableHeroItemCandidates.length / 2;
  const consumableHeroItemTiles = seededRandomArrayElements(prng, consumableHeroItemCandidates, amountOfVillagesToPick);
  const consumableHeroWorldItems: WorldItem[] = consumableHeroItemTiles.map((tile) => {
    const { id, category } = seededRandomArrayElement(prng, miscellaneousHeroItems);

    // TODO: All of these amounts should increase the further we get from the center

    if (category === 'resource') {
      // TODO: We're adding only a single resource world item, make sure all 4 resources are added to hero's inventory after battle!
      return {
        id,
        type: 'resource',
        tileId: tile.id,
        amount: 1,
      };
    }

    if (category === 'currency') {
      return {
        id,
        type: 'currency',
        tileId: tile.id,
        amount: 1,
      };
    }

    return {
      id,
      type: 'consumable',
      tileId: tile.id,
      amount: 1,
    };
  });

  return [...tilesWithWorldItems, ...consumableHeroWorldItems];
};
