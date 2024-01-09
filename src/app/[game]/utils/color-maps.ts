import { ReputationLevel } from 'interfaces/models/game/reputation';

export const reputationColorMap = new Map<ReputationLevel, Record<'border' | 'text', string>>([
  ['player', { border: 'border-reputation-player', text: 'text-reputation-player' }],
  ['ecstatic', { border: 'border-reputation-ecstatic', text: 'text-reputation-ecstatic' }],
  ['respected', { border: 'border-reputation-respected', text: 'text-reputation-respected' }],
  ['friendly', { border: 'border-reputation-friendly', text: 'text-reputation-friendly' }],
  ['neutral', { border: 'border-reputation-neutral', text: 'text-reputation-neutral' }],
  ['unfriendly', { border: 'border-reputation-unfriendly', text: 'text-reputation-unfriendly' }],
  ['hostile', { border: 'border-reputation-hostile', text: 'text-reputation-hostile' }],
]);
