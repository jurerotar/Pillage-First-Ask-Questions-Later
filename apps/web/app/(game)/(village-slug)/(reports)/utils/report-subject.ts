import type { TFunction } from 'i18next';
import type { ReportListingDto } from '@pillage-first/types/dtos/report';
import type { Report } from '@pillage-first/types/models/report';
import {
  isAdventureReport,
  isBattleReport,
  isMovementReport,
  isTradeReport,
} from '@pillage-first/utils/guards/report';

export const getReportSubject = (
  report: ReportListingDto | Report,
  t: TFunction,
): string => {
  if (isBattleReport(report)) {
    const {
      movementType,
      originName,
      originCoordinates,
      targetName,
      targetCoordinates,
    } = report.summary;
    const { x: originX, y: originY } = originCoordinates;
    const { x: targetX, y: targetY } = targetCoordinates;

    return movementType === 'raid'
      ? t(
          '{{originName}} ({{originX}}|{{originY}}) raids {{targetName}} ({{targetX}}|{{targetY}})',
          {
            originName,
            originX,
            originY,
            targetName,
            targetX,
            targetY,
          },
        )
      : t(
          '{{originName}} ({{originX}}|{{originY}}) attacks {{targetName}} ({{targetX}}|{{targetY}})',
          {
            originName,
            originX,
            originY,
            targetName,
            targetX,
            targetY,
          },
        );
  }

  if (isAdventureReport(report)) {
    return t('Hero completed an adventure');
  }

  if (isTradeReport(report)) {
    const { originName, originCoordinates, targetName, targetCoordinates } =
      report.summary;
    const { x: originX, y: originY } = originCoordinates;
    const { x: targetX, y: targetY } = targetCoordinates;

    return t(
      'Merchants from {{originName}} ({{originX}}|{{originY}}) arrived at {{targetName}} ({{targetX}}|{{targetY}})',
      { originName, originX, originY, targetName, targetX, targetY },
    );
  }

  if (isMovementReport(report)) {
    const {
      movementType,
      originName,
      originCoordinates,
      targetName,
      targetCoordinates,
    } = report.summary;
    const { x: originX, y: originY } = originCoordinates;
    const { x: targetX, y: targetY } = targetCoordinates;

    return movementType === 'reinforcement'
      ? t(
          'Reinforcements from {{originName}} ({{originX}}|{{originY}}) arrived at {{targetName}} ({{targetX}}|{{targetY}})',
          { originName, originX, originY, targetName, targetX, targetY },
        )
      : t(
          'Troops from {{originName}} ({{originX}}|{{originY}}) relocated to {{targetName}} ({{targetX}}|{{targetY}})',
          { originName, originX, originY, targetName, targetX, targetY },
        );
  }

  return '';
};
