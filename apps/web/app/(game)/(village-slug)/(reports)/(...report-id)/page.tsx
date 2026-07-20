import { useTranslation } from 'react-i18next';
import {
  isAdventureReport,
  isBattleReport,
  isMovementReport,
  isTradeReport,
} from '@pillage-first/utils/guards/report';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(reports)/(...report-id)/+types/page';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { PageContents } from 'app/components/page-contents';
import { Text } from 'app/components/text';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { useReport } from '../../hooks/use-report';
import {
  BattleParticipantTable,
  BattleStatisticsTable,
  Report,
  ReportHeader,
} from './components/report';

const ReportPage = ({ params }: Route.ComponentProps) => {
  const { reportId: reportIdParam, villageSlug, serverSlug } = params;
  const { t } = useTranslation();

  const reportId = Number.parseInt(reportIdParam, 10);
  const { report } = useReport(reportId);

  const title = `${t('Report - {{reportId}}', { reportId })}  | Pillage First! - ${serverSlug} - ${villageSlug}`;

  return (
    <PageContents>
      <title>{title}</title>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="../village">{t('Village')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="../reports">{t('Reports')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {t('Report - {{reportId}}', { reportId })}
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <InformationPopover
        ariaLabel={t('Report - {{reportId}}', { reportId })}
        className="top-2 right-2"
      >
        <Text>{t('Review the selected in-game report.')}</Text>
      </InformationPopover>
      {!report && <Text as="h1">Report not found</Text>}
      {report && (
        <Report report={report}>
          <ReportHeader />
          {isBattleReport(report) && (
            <>
              <BattleParticipantTable
                participant={report.battle.attacker}
                participantRole="attacker"
              />
              <BattleParticipantTable
                participant={report.battle.defender}
                participantRole="defender"
              />
              {report.battle.outcome.canAttackerSeeFullReport &&
                report.battle.defender.reinforcements.map((participant) => (
                  <BattleParticipantTable
                    key={participant.player.id}
                    participant={participant}
                    participantRole="reinforcement"
                  />
                ))}
              <BattleStatisticsTable />
            </>
          )}
          {isAdventureReport(report) && <></>}
          {isTradeReport(report) && <></>}
          {isMovementReport(report) && <></>}
        </Report>
      )}
    </PageContents>
  );
};

export default ReportPage;
