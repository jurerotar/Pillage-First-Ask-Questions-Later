import { use } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LuArrowDownUp,
  LuCastle,
  LuEraser,
  LuHouse,
  LuShieldPlus,
} from 'react-icons/lu';
import { TRIBES, type Tribe } from '@pillage-first/types/models/tribe';
import { UnitTable } from 'app/(game)/components/unit-table';
import { Icon } from 'app/components/icon';
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
  CombatSimulatorDefenderHeroStatsControlsRow,
  CombatSimulatorDefenderTroopControlsRows,
} from './combat-simulator-troop-controls-rows';
import { LevelInputPopover } from './level-input-popover';

type CombatSimulatorDefenderControlsRowProps = {
  title: string;
};

export const CombatSimulatorDefenderControlsRow = ({
  title,
}: CombatSimulatorDefenderControlsRowProps) => {
  const { t } = useTranslation();
  const {
    state,
    addDefenderReinforcement,
    clearDefenderData,
    setDefenderResidenceLevel,
    setDefenderTrapCount,
    setDefenderTribe,
    setDefenderWallLevel,
    swapPlayerRole,
  } = use(CombatSimulatorContext)!;
  const isOasis = state.defender.tribe === 'nature';
  const canSetHero = state.playerRole === 'defender' && !isOasis;

  const wallLevelLabel = t('Wall level');
  const residenceLevelLabel = t('Residence level');
  const trapCountLabel = t('Trap count');

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
                    {TRIBES.filter((tribeOption) => {
                      return (
                        tribeOption !== 'nature' ||
                        state.playerRole === 'attacker'
                      );
                    }).map((tribeOption) => (
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
                  {!isOasis && (
                    <>
                      <span
                        className="flex cursor-pointer items-center gap-1"
                        data-tooltip-content={wallLevelLabel}
                        data-tooltip-id="general-tooltip"
                      >
                        <span className="inline-flex items-center justify-center">
                          <span className="sr-only">{wallLevelLabel}</span>
                          <LuCastle className="size-4 md:size-5" />
                        </span>
                        <LevelInputPopover
                          id="combat-simulator-defender-wall-level"
                          label={wallLevelLabel}
                          value={state.defender.village.wallLevel}
                          onValueChange={setDefenderWallLevel}
                        />
                      </span>
                      <span
                        className="flex cursor-pointer items-center gap-1"
                        data-tooltip-content={residenceLevelLabel}
                        data-tooltip-id="general-tooltip"
                      >
                        <span className="inline-flex items-center justify-center">
                          <span className="sr-only">{residenceLevelLabel}</span>
                          <LuHouse className="size-4 md:size-5" />
                        </span>
                        <LevelInputPopover
                          id="combat-simulator-defender-residence-level"
                          label={residenceLevelLabel}
                          value={state.defender.village.residenceLevel}
                          onValueChange={setDefenderResidenceLevel}
                        />
                      </span>
                    </>
                  )}
                  {state.defender.tribe === 'gauls' && (
                    <span
                      className="flex cursor-pointer items-center gap-1"
                      data-tooltip-content={trapCountLabel}
                      data-tooltip-id="general-tooltip"
                    >
                      <span className="inline-flex items-center justify-center">
                        <span className="sr-only">{trapCountLabel}</span>
                        <Icon
                          className="size-4 md:size-5"
                          type="trapperCapacity"
                        />
                      </span>
                      <LevelInputPopover
                        id="combat-simulator-defender-trap-count"
                        label={trapCountLabel}
                        max={400}
                        value={state.defender.village.trapCount}
                        onValueChange={setDefenderTrapCount}
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
        tribe={state.defender.tribe}
      >
        <CombatSimulatorDefenderTroopControlsRows />
      </UnitTable>
      {canSetHero && <CombatSimulatorDefenderHeroStatsControlsRow />}
    </div>
  );
};
