import type { ReputationLevel } from 'interfaces/models/game/reputation';

export const reputationColorMap = new Map<ReputationLevel, string>([
  ['player', 'after:border-reputation-player'],
  ['ecstatic', 'after:border-reputation-ecstatic'],
  ['respected', 'after:border-reputation-respected'],
  ['friendly', 'after:border-reputation-friendly'],
  ['neutral', 'after:border-reputation-neutral'],
  ['unfriendly', 'after:border-reputation-unfriendly'],
  ['hostile', 'after:border-reputation-hostile'],
]);
