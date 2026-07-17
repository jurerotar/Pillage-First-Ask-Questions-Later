import type { PropsWithChildren } from 'react';
import type { z } from 'zod';
import type { battleReportSchema } from '@pillage-first/types/models/report';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Text } from 'app/components/text';
import { Separator } from 'app/components/ui/separator';
import { getReportSubject } from '../../utils/report-subject';
import { BattleParticipantTable } from './components/battle-participant-table';
import { BattleStatistics } from './components/battle-statistics';

type BattleReportProps = {
  report: z.infer<typeof battleReportSchema>;
};

const BattleReport = ({ report }: PropsWithChildren<BattleReportProps>) => {
  const battle = report.battle;

  const showDefendingUnits =
    battle.attacker.player.slug === 'player'
      ? battle.outcome.canAttackerSeeFullReport
      : true;
  const combatants = [
    { combatant: battle.attacker, role: 'attacker' as const },
    { combatant: battle.defender, role: 'defender' as const },
    ...battle.defender.reinforcements.map((combatant) => ({
      combatant,
      role: 'reinforcement' as const,
    })),
  ];

  return (
    <Section>
      <SectionContent>
        <Text as="h1">{getReportSubject(report)}</Text>
        <span>{new Date(report.timestamp).toLocaleString()}</span>

        <div className="overflow-x-scroll scrollbar-hidden">
          {combatants.map(({ combatant, role }) => {
            if (role === 'reinforcement' && !showDefendingUnits) {
              return null;
            }

            return (
              <div
                className="my-4"
                key={combatant.troops.id}
              >
                <BattleParticipantTable
                  battle={battle}
                  combatant={combatant}
                  role={role}
                  showDefendingUnits={showDefendingUnits}
                />
              </div>
            );
          })}
        </div>

        <Separator
          orientation="horizontal"
          className="mb-2 sm:mb-4"
        />

        <BattleStatistics
          battle={battle}
          showDefendingUnits={showDefendingUnits}
        />
      </SectionContent>
    </Section>
  );
};

export default BattleReport;
