import type { ReputationLevel } from 'app/interfaces/models/game/reputation';

export const reputationLevels = new Map<ReputationLevel, number>([
  ['ecstatic', 63_000],
  ['honored', 57_000],
  ['respected', 48_000],
  ['friendly', 45_000],
  ['neutral', 42_000],
  ['unfriendly', 39_000],
  ['hostile', 36_000],
  ['hated', 0],
]);
