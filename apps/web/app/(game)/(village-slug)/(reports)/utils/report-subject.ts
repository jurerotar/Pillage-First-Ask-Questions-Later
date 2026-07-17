import type {
  BaseReport,
  GameReport,
} from '@pillage-first/types/models/report';

export const getReportSubject = (report: BaseReport | GameReport): string => {
  if (report.type === 'battle') {
    const battle = 'battle' in report ? report.battle : report.battleSummary;
    const summary =
      'attacker' in battle
        ? {
            isRaid: battle.outcome.isRaid,
            originName: battle.attacker.village.name,
            targetName: battle.defender.village.name,
            targetCoordinates: battle.defender.village.coordinates,
          }
        : battle;
    const subjectType = summary.isRaid ? 'raids' : 'attacks';
    const { x, y } = summary.targetCoordinates;

    return `${summary.originName} ${subjectType} ${summary.targetName} (${x}|${y})`;
  }

  return '';
};
