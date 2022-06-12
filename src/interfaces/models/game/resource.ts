export type Resource = 'wood' | 'clay' | 'iron' | 'wheat';

export type Resources = {
  [key in Resource]: number;
};
