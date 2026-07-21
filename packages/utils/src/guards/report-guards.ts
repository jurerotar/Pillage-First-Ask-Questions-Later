import type { ReportListingDto } from '@pillage-first/types/dtos/report';
import type { Report } from '@pillage-first/types/models/report';

type ReportLike = Report | ReportListingDto;

export const isBattleReport = <T extends ReportLike>(
  report: T,
): report is Extract<T, { type: 'battle' }> => {
  return report.type === 'battle';
};

export const isAdventureReport = <T extends ReportLike>(
  report: T,
): report is Extract<T, { type: 'adventure' }> => {
  return report.type === 'adventure';
};

export const isTradeReport = <T extends ReportLike>(
  report: T,
): report is Extract<T, { type: 'trade' }> => {
  return report.type === 'trade';
};

export const isMovementReport = <T extends ReportLike>(
  report: T,
): report is Extract<T, { type: 'movement' }> => {
  return report.type === 'movement';
};

export const isHuntingPartyReport = <T extends ReportLike>(
  report: T,
): report is Extract<T, { type: 'huntingParty' }> => {
  return report.type === 'huntingParty';
};

export const isGatheringExpeditionReport = <T extends ReportLike>(
  report: T,
): report is Extract<T, { type: 'gatheringExpedition' }> => {
  return report.type === 'gatheringExpedition';
};
