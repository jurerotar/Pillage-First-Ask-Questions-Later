import type { ReputationLevel } from '@pillage-first/types/models/reputation';

export const reputationLevels: Map<ReputationLevel, number> = new Map([
  ['ecstatic', 63_000],
  ['honored', 57_000],
  ['respected', 48_000],
  ['friendly', 45_000],
  ['neutral', 42_000],
  ['unfriendly', 39_000],
  ['hostile', 36_000],
  ['hated', 0],
]);
