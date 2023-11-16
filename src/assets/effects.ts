import { Effect } from 'interfaces/models/game/effect';

export const globalEffects: Effect[] = [

];

export const villageEffects: Effect[] = [

];

export const effects: Effect[] = [
  ...villageEffects,
  ...globalEffects
];
