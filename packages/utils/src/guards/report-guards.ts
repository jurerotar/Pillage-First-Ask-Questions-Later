import type {
  AdventureReport,
  BattleReport,
  Report,
  TradeReport,
  TroopMovementReport,
} from '@pillage-first/types/models/report';

export const isBattleReport = (report: Report): report is BattleReport => {
  return report.type === 'battle';
};

export const isAdventureReport = (
  report: Report,
): report is AdventureReport => {
  return report.type === 'adventure';
};

export const isTradeReport = (report: Report): report is TradeReport => {
  return report.type === 'trade';
};

export const isMovementReport = (
  report: Report,
): report is TroopMovementReport => {
  return report.type === 'movement';
};
