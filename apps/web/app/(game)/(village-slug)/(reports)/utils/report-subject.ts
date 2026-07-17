import type {
  BaseReport,
  GameReport,
} from '@pillage-first/types/models/report';

export const getReportSubject = (report: BaseReport | GameReport): string => {
  if (report.type === 'battle') {
    const battle = 'battle' in report ? report.battle : report.battleSummary;
    const subjectType = battle.isRaid ? 'raids' : 'attacks';
    const { x, y } = battle.targetCoordinates;

    return `${battle.originName} ${subjectType} ${battle.targetName} (${x}|${y})`;
  }

  return '';
};
