export type Resource = 'wood' | 'clay' | 'iron' | 'wheat';

export type VillageResources = {
  [key in Resource]: number;
};
