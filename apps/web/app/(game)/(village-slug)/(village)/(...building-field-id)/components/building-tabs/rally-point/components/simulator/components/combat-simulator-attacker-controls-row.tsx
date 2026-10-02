import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { LuArrowDownUp, LuBeer, LuEraser } from 'react-icons/lu';
import { PLAYABLE_TRIBES, type Tribe } from '@pillage-first/types/models/tribe';
import { UnitTable } from 'app/(game)/components/unit-table';
import { Icon } from 'app/components/icon';
import { Button } from 'app/components/ui/button';
import { Input } from 'app/components/ui/input';
import { RadioGroup, RadioGroupItem } from 'app/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import {
  CombatSimulatorContext,
  type CombatSimulatorMode,
} from '../providers/combat-simulator-context';
import { CombatSimulatorParticipantControlsTable } from './combat-simulator-participant-controls-table';
import {
  CombatSimulatorAttackerHeroStatsControlsRow,
  CombatSimulatorAttackerTroopControlsRows,
} from './combat-simulator-troop-controls-rows';
import { LevelInputPopover } from './level-input-popover';

type CombatSimulatorAttackerControlsRowProps = {
  title: string;
};

export const CombatSimulatorAttackerControlsRow = ({
  title,
}: CombatSimulatorAttackerControlsRowProps) => {
  const { t } = useTranslation();
  const {
    state,
    clearAttackerData,
    setAttackerBreweryLevel,
    setAttackerTribe,
    setAttackerVillagePopulation,
    setCombatMode,
    swapPlayerRole,
  } = use(CombatSimulatorContext)!;
  const canSetHero = state.playerRole === 'attacker';

  const populationLabel = t('Population');
  const breweryLevelLabel = t('Brewery level');

  return (
    <div className="flex flex-col">
      <CombatSimulatorParticipantControlsTable>
        <thead>
          <tr className="bg-red-800/80 text-white dark:bg-red-950/60 dark:text-red-50">
            <th
              className="p-2 text-left font-semibold"
              colSpan={12}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{title}</span>
                  {canSetHero && (
                    <Button
                      aria-label={t('Swap roles')}
                      data-tooltip-content={t('Swap roles')}
                      data-tooltip-id="general-tooltip"
                      size="icon"
                      variant="outline"
                      onClick={swapPlayerRole}
                    >
                      <LuArrowDownUp />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroup
                    className="flex items-center gap-2 mr-2 text-sm font-normal"
                    value={state.combatMode}
                    onValueChange={(value) => {
                      setCombatMode(value as CombatSimulatorMode);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        aria-label={t('Attack')}
                        className="border-white text-white"
                        id="combat-simulator-mode-attack"
                        value="attack"
                      />
                      <label
                        className="cursor-pointer"
                        htmlFor="combat-simulator-mode-attack"
                      >
                        {t('Attack')}
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        aria-label={t('Raid')}
                        className="border-white text-white"
                        id="combat-simulator-mode-raid"
                        value="raid"
                      />
                      <label
                        className="cursor-pointer"
                        htmlFor="combat-simulator-mode-raid"
                      >
                        {t('Raid')}
                      </label>
                    </div>
                  </RadioGroup>
                  <Button
                    aria-label={t('Clear')}
                    className="text-foreground"
                    data-tooltip-content={t('Clear')}
                    data-tooltip-id="general-tooltip"
                    size="icon"
                    variant="outline"
                    onClick={clearAttackerData}
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
                  value={state.attacker.tribe}
                  onValueChange={(value) => {
                    setAttackerTribe(value as Tribe);
                  }}
                >
                  <SelectTrigger aria-label={t('Tribe')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAYABLE_TRIBES.map((tribeOption) => (
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
                    htmlFor="combat-simulator-attacker-population"
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
                      id="combat-simulator-attacker-population"
                      min={0}
                      size="numericDoubleDigit"
                      type="number"
                      value={state.attacker.village.population}
                      onChange={(event) => {
                        setAttackerVillagePopulation(
                          event.currentTarget.valueAsNumber,
                        );
                      }}
                    />
                  </label>
                  {state.attacker.tribe === 'teutons' && (
                    <span
                      className="flex cursor-pointer items-center gap-1"
                      data-tooltip-content={breweryLevelLabel}
                      data-tooltip-id="general-tooltip"
                    >
                      <span className="inline-flex items-center justify-center">
                        <span className="sr-only">{breweryLevelLabel}</span>
                        <LuBeer className="size-4 md:size-5" />
                      </span>
                      <LevelInputPopover
                        id="combat-simulator-attacker-brewery-level"
                        label={breweryLevelLabel}
                        value={state.attacker.village.breweryLevel}
                        onValueChange={setAttackerBreweryLevel}
                      />
                    </span>
                  )}
                </div>
              </div>
            </th>
          </tr>
        </thead>
      </CombatSimulatorParticipantControlsTable>
      <UnitTable
        includeHero={canSetHero}
        tribe={state.attacker.tribe}
      >
        <CombatSimulatorAttackerTroopControlsRows />
      </UnitTable>
      {canSetHero && <CombatSimulatorAttackerHeroStatsControlsRow />}
    </div>
  );
};
