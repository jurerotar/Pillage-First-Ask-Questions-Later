import type { PropsWithChildren } from 'react';
import type { z } from 'zod';
import type { battleReportSchema } from '@pillage-first/types/models/report';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Text } from 'app/components/text';
import { Separator } from 'app/components/ui/separator';
import { BattleLoot } from './components/battle-loot';
import { BattleParticipantTable } from './components/battle-participant-table';
import { BattleStatistics } from './components/battle-statistics';

type BattleReportProps = {
  report: z.infer<typeof battleReportSchema>;
};

const BattleReport = ({ report }: PropsWithChildren<BattleReportProps>) => {
  const battle = report.battle;
  return (
    <Section>
      <SectionContent>
        <Text as="h1">{report.subject}</Text>
        <span>{new Date(report.timestamp).toLocaleString()}</span>

        <div className="overflow-x-scroll scrollbar-hidden">
          {battle.participants.map((participant) => {
            return (
              <div key={participant.id}>
                <BattleParticipantTable
                  battle={battle}
                  participant={participant}
                />
                {participant.role === 'attacker' && (
                  <BattleLoot
                    loot={battle.loot}
                    totalCarryCapacity={battle.totalCarryCapacity}
                  />
                )}
              </div>
            );
          })}
        </div>

        <Separator
          orientation="horizontal"
          className="mb-2 sm:mb-4"
        />

        <BattleStatistics battle={battle} />
      </SectionContent>
    </Section>
  );
};

export default BattleReport;
