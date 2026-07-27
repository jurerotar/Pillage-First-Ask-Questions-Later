import type { TFunction } from 'i18next';
import type { ReportListingDto } from '@pillage-first/types/dtos/report';
import type { Report } from '@pillage-first/types/models/report';
import {
  isAdventureReport,
  isBattleReport,
  isGatheringExpeditionReport,
  isHuntingPartyReport,
  isMovementReport,
  isScoutingReport,
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

  if (isScoutingReport(report)) {
    const { originName, originCoordinates, targetName, targetCoordinates } =
      report.summary;
    return t(
      '{{originName}} ({{originX}}|{{originY}}) scouts {{targetName}} ({{targetX}}|{{targetY}})',
      {
        originName,
        originX: originCoordinates.x,
        originY: originCoordinates.y,
        targetName,
        targetX: targetCoordinates.x,
        targetY: targetCoordinates.y,
      },
    );
  }

  if (isTradeReport(report)) {
    const { targetName, targetCoordinates } = report.summary;
    const { x: targetX, y: targetY } = targetCoordinates;

    return t('Merchants reached {{targetName}} ({{targetX}}|{{targetY}})', {
      targetName,
      targetX,
      targetY,
    });
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
          '{{originName}} ({{originX}}|{{originY}}) reinforced {{targetName}} ({{targetX}}|{{targetY}})',
          { originName, originX, originY, targetName, targetX, targetY },
        )
      : t(
          '{{originName}} ({{originX}}|{{originY}}) troops moved to {{targetName}} ({{targetX}}|{{targetY}})',
          { originName, originX, originY, targetName, targetX, targetY },
        );
  }

  if (isHuntingPartyReport(report)) {
    return t('Hunting party returned to {{villageName}} ({{x}}|{{y}})', {
      villageName: report.summary.villageName,
      x: report.summary.villageCoordinates.x,
      y: report.summary.villageCoordinates.y,
    });
  }

  if (isGatheringExpeditionReport(report)) {
    return t('Gathering expedition returned to {{villageName}} ({{x}}|{{y}})', {
      villageName: report.summary.villageName,
      x: report.summary.villageCoordinates.x,
      y: report.summary.villageCoordinates.y,
    });
  }

  return '';
};
