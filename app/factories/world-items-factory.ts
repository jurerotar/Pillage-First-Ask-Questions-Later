import type { OccupiedOccupiableTile } from 'app/interfaces/models/game/tile';
import type {
  ArtifactWorldItem,
  ConsumableWorldItem,
  CurrencyWorldItem,
  HeroItemWorldItem,
  ResourcesWorldItem,
  WorldItem,
} from 'app/interfaces/models/game/world-item';
import type { VillageSize } from 'app/interfaces/models/game/village';
import { getVillageSize } from 'app/factories/utils/common';
import { seededRandomArrayElement, seededRandomArrayElements } from 'app/utils/common';
import type { PRNGFunction } from 'ts-seedrandom';
import type { Server } from 'app/interfaces/models/game/server';
import { artifacts } from 'app/assets/artifacts';
import { items } from 'app/assets/items';

const heroWearableItems = items.filter(({ category }) => category === 'wearable');

const rareHeroItems = heroWearableItems.filter(({ rarity }) => rarity === 'rare');
const uncommonHeroItems = heroWearableItems.filter(({ rarity }) => rarity === 'uncommon');
const commonHeroItems = heroWearableItems.filter(({ rarity }) => rarity === 'common');
const miscellaneousHeroItems = items.filter(({ category }) => ['consumable', 'resource', 'currency'].includes(category));

type WorldItemsFactoryArgs = {
  server: Server;
  prng: PRNGFunction;
  occupiedOccupiableTiles: OccupiedOccupiableTile[];
};

type TileWithSize = OccupiedOccupiableTile & {
  size: VillageSize;
};

export const worldItemsFactory = ({ server, prng, occupiedOccupiableTiles }: WorldItemsFactoryArgs): WorldItem[] => {
  const eligibleTiles = occupiedOccupiableTiles.filter(({ coordinates }) => {
    return !(coordinates.x === 0 && coordinates.y === 0);
  });

  const tilesWithSize: TileWithSize[] = eligibleTiles.map((tile) => {
    return {
      ...tile,
      size: getVillageSize(server.configuration.mapSize, tile.coordinates),
    };
  });

  // Artifacts
  const artifactCandidates = tilesWithSize.filter(({ size }) => size === '4xl');
  const artifactTiles = seededRandomArrayElements(prng, artifactCandidates, artifacts.length);
  const artifactWorldItems: ArtifactWorldItem[] = artifactTiles.map((tile, index) => {
    const { id } = artifacts[index];
    return {
      artifactId: id,
      type: 'artifact',
      tileId: tile.id,
    };
  });

  // Rare hero items
  const rareHeroItemCandidates = tilesWithSize.filter((tile) => ['3xl', '2xl'].includes(tile.size));
  const rareHeroItemTiles = seededRandomArrayElements(prng, rareHeroItemCandidates, rareHeroItems.length);
  const rareHeroWorldItems: HeroItemWorldItem[] = rareHeroItemTiles.map((tile, index) => {
    const { id } = rareHeroItems[index];
    return {
      id,
      type: 'hero-item',
      tileId: tile.id,
      amount: 1,
    };
  });

  // Uncommon hero items
  const uncommonHeroItemCandidates = tilesWithSize.filter((tile) => ['xl', 'lg'].includes(tile.size));
  const uncommonHeroItemTiles = seededRandomArrayElements(prng, uncommonHeroItemCandidates, uncommonHeroItems.length);
  const uncommonHeroWorldItems: HeroItemWorldItem[] = uncommonHeroItemTiles.map((tile, index) => {
    const { id } = uncommonHeroItems[index];
    return {
      id,
      type: 'hero-item',
      tileId: tile.id,
      amount: 1,
    };
  });

  // Common hero items
  const commonHeroItemCandidates = tilesWithSize.filter((tile) => ['md', 'sm'].includes(tile.size));
  const commonHeroItemTiles = seededRandomArrayElements(prng, commonHeroItemCandidates, commonHeroItems.length);
  const commonHeroWorldItems: HeroItemWorldItem[] = commonHeroItemTiles.map((tile, index) => {
    const { id } = commonHeroItems[index];
    return {
      id,
      type: 'hero-item',
      tileId: tile.id,
      amount: 1,
    };
  });

  // Consumable hero items
  const tilesWithWorldItems = [...artifactWorldItems, ...rareHeroWorldItems, ...uncommonHeroWorldItems, ...commonHeroWorldItems];
  const occupiedIds = tilesWithWorldItems.map(({ tileId }) => tileId);
  const consumableHeroItemCandidates = eligibleTiles.filter(({ id }) => {
    return !occupiedIds.includes(id);
  });
  // Half of remaining villages should have non-wearable items
  const amountOfVillagesToPick = consumableHeroItemCandidates.length / 2;
  const consumableHeroItemTiles = seededRandomArrayElements(prng, consumableHeroItemCandidates, amountOfVillagesToPick);
  const consumableHeroWorldItems: (ConsumableWorldItem | ResourcesWorldItem | CurrencyWorldItem)[] = consumableHeroItemTiles.map((tile) => {
    const { id, category } = seededRandomArrayElement(prng, miscellaneousHeroItems);

    // TODO: All of these amounts should increase the further we get from the center

    if (category === 'resource') {
      // TODO: We're adding only a single resource world item, make sure all 4 resources are added to hero's inventory after battle!
      return {
        id,
        type: 'resources',
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
