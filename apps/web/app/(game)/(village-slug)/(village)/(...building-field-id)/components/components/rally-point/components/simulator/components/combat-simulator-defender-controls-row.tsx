import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { LuCastle, LuEraser, LuHouse, LuShieldPlus } from 'react-icons/lu';
import { TRIBES, type Tribe } from '@pillage-first/types/models/tribe';
import { UnitTable } from 'app/(game)/components/unit-table';
import { Icon } from 'app/components/icon';
import { Button } from 'app/components/ui/button';
import { Input } from 'app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import { CombatSimulatorContext } from '../providers/combat-simulator-context';
import { CombatSimulatorParticipantControlsTable } from './combat-simulator-participant-controls-table';
import { CombatSimulatorDefenderTroopControlsRows } from './combat-simulator-troop-controls-rows';

export const CombatSimulatorDefenderControlsRow = () => {
  const { t } = useTranslation();
  const {
    state,
    addDefenderReinforcement,
    clearDefenderData,
    setDefenderResidenceLevel,
    setDefenderTribe,
    setDefenderVillagePopulation,
    setDefenderWallLevel,
  } = use(CombatSimulatorContext)!;

  const populationLabel = t('Population');
  const wallLevelLabel = t('Wall level');
  const residenceLevelLabel = t('Residence level');

  return (
    <div className="flex flex-col">
      <CombatSimulatorParticipantControlsTable>
        <thead>
          <tr className="bg-blue-400 text-white dark:bg-blue-800/60 dark:text-blue-50">
            <th
              className="p-2 text-left font-semibold"
              colSpan={12}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{t('Defender')}</span>
                <div className="flex items-center gap-2">
                  <Button
                    aria-label={t('Add defender')}
                    className="text-foreground"
                    data-tooltip-content={t('Add defender')}
                    data-tooltip-id="general-tooltip"
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      addDefenderReinforcement();
                    }}
                  >
                    <LuShieldPlus />
                  </Button>
                  <Button
                    aria-label={t('Clear')}
                    className="text-foreground"
                    data-tooltip-content={t('Clear')}
                    data-tooltip-id="general-tooltip"
                    size="icon"
                    variant="outline"
                    onClick={clearDefenderData}
                  >
                    <LuEraser />
                  </Button>
                </div>
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
                  value={state.defender.tribe}
                  onValueChange={(value) => {
                    setDefenderTribe(value as Tribe);
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
                <div className="flex items-center gap-2">
                  <label
                    className="flex cursor-pointer items-center gap-1"
                    data-tooltip-content={populationLabel}
                    data-tooltip-id="general-tooltip"
                    htmlFor="combat-simulator-defender-population"
                  >
                    <span className="inline-flex items-center justify-center">
                      <span className="sr-only">{populationLabel}</span>
                      <Icon
                        className="size-4 md:size-5"
                        type="population"
                      />
                    </span>
                    <Input
                      aria-label={populationLabel}
                      autoComplete="off"
                      className="px-1 w-16 text-center"
                      hideSpinner
                      id="combat-simulator-defender-population"
                      min={0}
                      size="numericDoubleDigit"
                      type="number"
                      value={state.defender.village.population}
                      onChange={(event) => {
                        setDefenderVillagePopulation(
                          event.currentTarget.valueAsNumber,
                        );
                      }}
                    />
                  </label>
                  <label
                    className="flex cursor-pointer items-center gap-1"
                    data-tooltip-content={wallLevelLabel}
                    data-tooltip-id="general-tooltip"
                    htmlFor="combat-simulator-defender-wall-level"
                  >
                    <span className="inline-flex items-center justify-center">
                      <span className="sr-only">{wallLevelLabel}</span>
                      <LuCastle className="size-4 md:size-5" />
                    </span>
                    <Input
                      aria-label={wallLevelLabel}
                      autoComplete="off"
                      className="px-1 text-center"
                      hideSpinner
                      id="combat-simulator-defender-wall-level"
                      max={20}
                      min={0}
                      size="numericDoubleDigit"
                      type="number"
                      value={state.defender.village.wallLevel}
                      onChange={(event) => {
                        setDefenderWallLevel(event.currentTarget.valueAsNumber);
                      }}
                    />
                  </label>
                  <label
                    className="flex cursor-pointer items-center gap-1"
                    data-tooltip-content={residenceLevelLabel}
                    data-tooltip-id="general-tooltip"
                    htmlFor="combat-simulator-defender-residence-level"
                  >
                    <span className="inline-flex items-center justify-center">
                      <span className="sr-only">{residenceLevelLabel}</span>
                      <LuHouse className="size-4 md:size-5" />
                    </span>
                    <Input
                      aria-label={residenceLevelLabel}
                      autoComplete="off"
                      className="px-1 text-center"
                      hideSpinner
                      id="combat-simulator-defender-residence-level"
                      max={20}
                      min={0}
                      size="numericDoubleDigit"
                      type="number"
                      value={state.defender.village.residenceLevel}
                      onChange={(event) => {
                        setDefenderResidenceLevel(
                          event.currentTarget.valueAsNumber,
                        );
                      }}
                    />
                  </label>
                </div>
              </div>
            </th>
          </tr>
        </thead>
      </CombatSimulatorParticipantControlsTable>
      <UnitTable tribe={state.defender.tribe}>
        <CombatSimulatorDefenderTroopControlsRows />
      </UnitTable>
    </div>
  );
};
