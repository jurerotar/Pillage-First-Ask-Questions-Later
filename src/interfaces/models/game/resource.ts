export type Resource = 'wood' | 'clay' | 'iron' | 'wheat';
export type ResourceCombination = 'wood-wheat' | 'clay-wheat' | 'iron-wheat';

export type Resources = Record<Resource, number>;
