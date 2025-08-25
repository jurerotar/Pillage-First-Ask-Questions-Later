import type { ReputationLevel } from 'app/interfaces/models/game/reputation';

export const reputationLevels = new Map<ReputationLevel, number>([
  ['ecstatic', 63000],
  ['honored', 57000],
  ['respected', 48000],
  ['friendly', 45000],
  ['neutral', 42000],
  ['unfriendly', 39000],
  ['hostile', 36000],
  ['hated', 0],
]);
