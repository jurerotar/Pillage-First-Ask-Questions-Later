import type { HeroItem } from 'app/interfaces/models/game/hero';
import type { Tile } from 'app/interfaces/models/game/tile';
import type { Artifact } from 'app/interfaces/models/game/artifact';

type WithWorldItemsProperties<P> = P & {
  id: HeroItem['id'];
  amount: number;
  tileId: Tile['id'];
};

export type ArtifactWorldItem = {
  type: 'artifact';
  artifactId: Artifact['id'];
  tileId: Tile['id'];
};

export type HeroItemWorldItem = WithWorldItemsProperties<{
  type: 'hero-item';
}>;

export type CurrencyWorldItem = WithWorldItemsProperties<{
  type: 'currency';
}>;

export type ResourcesWorldItem = WithWorldItemsProperties<{
  type: 'resources';
}>;

export type ConsumableWorldItem = WithWorldItemsProperties<{
  type: 'consumable';
}>;

export type WorldItem = ArtifactWorldItem | HeroItemWorldItem | CurrencyWorldItem | ResourcesWorldItem | ConsumableWorldItem;
