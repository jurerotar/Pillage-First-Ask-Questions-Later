import { useMutation } from '@tanstack/react-query';
import { use, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { CombatSimulatorState } from '@pillage-first/types/models/combat-simulator';
import {
  BattleReportTables,
  Report,
  ReportHeader,
} from 'app/(game)/(village-slug)/components/report';
import { ApiContext } from 'app/(game)/providers/api-context';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { CombatSimulatorContext } from '../providers/combat-simulator-context';

export const CombatSimulatorReport = () => {
  const { t } = useTranslation();
  const { apiClient } = use(ApiContext);
  const { state } = use(CombatSimulatorContext)!;

  const {
    mutate,
    data: report,
    variables,
    isError,
  } = useMutation({
    mutationFn: async (body: CombatSimulatorState) => {
      const { data } = await apiClient.query('/combat-simulator', { body });
      return data;
    },
  });

  const scrollToReport = useCallback((element: HTMLDivElement | null) => {
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Button
        className="w-fit self-end"
        onClick={() => mutate(state)}
      >
        {t('Simulate')}
      </Button>
      {isError && (
        <Text role="alert">{t('Simulation failed. Please try again.')}</Text>
      )}
      {report && variables === state && (
        <div ref={scrollToReport}>
          <Report report={report}>
            <ReportHeader />
            <BattleReportTables />
          </Report>
        </div>
      )}
    </div>
  );
};
