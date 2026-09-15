import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { LuEraser } from 'react-icons/lu';
import { TRIBES, type Tribe } from '@pillage-first/types/models/tribe';
import { UnitTable } from 'app/(game)/components/unit-table';
import { Button } from 'app/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import { CombatSimulatorContext } from '../providers/combat-simulator-context';
import { CombatSimulatorParticipantControlsTable } from './combat-simulator-participant-controls-table';
import {
  CombatSimulatorReinforcementHeroStatsControlsRow,
  CombatSimulatorReinforcementTroopControlsRows,
} from './combat-simulator-troop-controls-rows';

export const CombatSimulatorReinforcementsControlsRows = () => {
  const { t } = useTranslation();
  const {
    state,
    clearDefenderReinforcementData,
    setDefenderReinforcementTribe,
  } = use(CombatSimulatorContext)!;

  return (
    <>
      {state.defender.reinforcements.map((reinforcement) => (
        <div
          key={reinforcement.id}
          className="flex flex-col"
        >
          <CombatSimulatorParticipantControlsTable>
            <thead>
              <tr className="bg-blue-400 text-white dark:bg-blue-800/60 dark:text-blue-50">
                <th
                  className="p-2 py-1 text-left font-semibold"
                  colSpan={12}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{t('Reinforcements')}</span>
                    <Button
                      aria-label={t('Clear')}
                      className="text-foreground"
                      data-tooltip-content={t('Clear')}
                      data-tooltip-id="general-tooltip"
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        clearDefenderReinforcementData(reinforcement.id);
                      }}
                    >
                      <LuEraser />
                    </Button>
                  </div>
                </th>
              </tr>
              <tr>
                <th
                  className="p-2 text-left font-medium"
                  colSpan={12}
                >
                  <div className="flex items-center justify-between">
                    <Select
                      value={reinforcement.tribe}
                      onValueChange={(value) => {
                        setDefenderReinforcementTribe(
                          reinforcement.id,
                          value as Tribe,
                        );
                      }}
                    >
                      <SelectTrigger aria-label={t('Tribe')}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRIBES.map((tribeOption) => (
                          <SelectItem
                            key={tribeOption}
                            value={tribeOption}
                          >
                            {t(`TRIBES.${tribeOption.toUpperCase()}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </th>
              </tr>
            </thead>
          </CombatSimulatorParticipantControlsTable>
          <UnitTable tribe={reinforcement.tribe}>
            <CombatSimulatorReinforcementTroopControlsRows
              reinforcementId={reinforcement.id}
            />
          </UnitTable>
          <CombatSimulatorReinforcementHeroStatsControlsRow
            reinforcementId={reinforcement.id}
          />
        </div>
      ))}
    </>
  );
};
