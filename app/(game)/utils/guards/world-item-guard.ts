import type {
  ArtifactWorldItem,
  CurrencyWorldItem,
  HeroItemWorldItem,
  ResourcesWorldItem,
  WorldItem,
} from 'app/interfaces/models/game/world-item';

export const isArtifactWorldItem = (item: WorldItem): item is ArtifactWorldItem => {
  return item.type === 'artifact';
};

export const isHeroItemWorldItem = (item: WorldItem): item is HeroItemWorldItem => {
  return item.type === 'hero-item';
};

export const isCurrencyWorldItem = (item: WorldItem): item is CurrencyWorldItem => {
  return item.type === 'currency';
};

export const isResourceWorldItem = (item: WorldItem): item is ResourcesWorldItem => {
  return item.type === 'resources';
};
