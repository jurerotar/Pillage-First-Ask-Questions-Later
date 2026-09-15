import { type ReactNode, use } from 'react';
import { useTranslation } from 'react-i18next';
import { FaHeart } from 'react-icons/fa';
import { GiAnvil, GiFist } from 'react-icons/gi';
import { LuHash } from 'react-icons/lu';
import {
  getSmithyUpgradeableUnitsByTribe,
  getUnitsByTribeWithHero,
} from '@pillage-first/game-assets/utils/units';
import type { UnitId } from '@pillage-first/types/models/unit';
import { UnitTableUnitIcons } from 'app/(game)/components/unit-table';
import { Icon } from 'app/components/icon';
import { Checkbox } from 'app/components/ui/checkbox';
import { Input } from 'app/components/ui/input';
import {
  CombatSimulatorContext,
  type CombatSimulatorHeroStats,
  type CombatSimulatorReinforcement,
  type CombatSimulatorTroop,
} from '../providers/combat-simulator-context';
import { LevelInputPopover } from './level-input-popover';

type CombatSimulatorTroopControlsParticipant =
  | { role: 'attacker' }
  | { role: 'defender' }
  | {
      role: 'reinforcement';
      reinforcementId: CombatSimulatorReinforcement['id'];
    };

type CombatSimulatorParticipantData = {
  troops: CombatSimulatorTroop[];
  heroStats: CombatSimulatorHeroStats;
  onTroopsChange: (troops: CombatSimulatorTroop[]) => void;
  onHeroStatsChange: (heroStats: CombatSimulatorHeroStats) => void;
  onSmithyImprovementLevelChange: (
    unitId: UnitId,
    smithyImprovementLevel: number,
  ) => void;
};

const useCombatSimulatorParticipantData = (
  participant: CombatSimulatorTroopControlsParticipant,
): CombatSimulatorParticipantData | null => {
  const combatSimulator = use(CombatSimulatorContext)!;
  const { state } = combatSimulator;

  if (participant.role === 'attacker') {
    return {
      troops: state.attacker.troops,
      heroStats: state.attacker.heroStats,
      onTroopsChange: combatSimulator.setAttackerTroops,
      onHeroStatsChange: combatSimulator.setAttackerHeroStats,
      onSmithyImprovementLevelChange:
        combatSimulator.setAttackerSmithyImprovementLevel,
    };
  }

  if (participant.role === 'defender') {
    return {
      troops: state.defender.troops,
      heroStats: state.defender.heroStats,
      onTroopsChange: combatSimulator.setDefenderTroops,
      onHeroStatsChange: combatSimulator.setDefenderHeroStats,
      onSmithyImprovementLevelChange:
        combatSimulator.setDefenderSmithyImprovementLevel,
    };
  }

  const reinforcement = state.defender.reinforcements.find(
    ({ id }) => id === participant.reinforcementId,
  );

  if (reinforcement === undefined) {
    return null;
  }

  return {
    troops: reinforcement.troops,
    heroStats: reinforcement.heroStats,
    onTroopsChange: (troops: CombatSimulatorTroop[]) => {
      combatSimulator.setDefenderReinforcementTroops(reinforcement.id, troops);
    },
    onHeroStatsChange: (heroStats: CombatSimulatorHeroStats) => {
      combatSimulator.setDefenderReinforcementHeroStats(
        reinforcement.id,
        heroStats,
      );
    },
    onSmithyImprovementLevelChange: (
      unitId: UnitId,
      smithyImprovementLevel: number,
    ) => {
      combatSimulator.setDefenderReinforcementSmithyImprovementLevel(
        reinforcement.id,
        unitId,
        smithyImprovementLevel,
      );
    },
  };
};

const useParticipantTribe = (
  participant: CombatSimulatorTroopControlsParticipant,
) => {
  const { state } = use(CombatSimulatorContext)!;

  if (participant.role === 'attacker') {
    return state.attacker.tribe;
  }

  if (participant.role === 'defender') {
    return state.defender.tribe;
  }

  return state.defender.reinforcements.find(
    ({ id }) => id === participant.reinforcementId,
  )?.tribe;
};

const updateTroopAmount = (
  troops: CombatSimulatorTroop[],
  unitId: UnitId,
  amount: number,
) => {
  return troops.map((troop) =>
    troop.unitId === unitId ? { ...troop, amount } : troop,
  );
};

const CombatSimulatorTroopControlsRows = ({
  participant,
}: {
  participant: CombatSimulatorTroopControlsParticipant;
}) => {
  const { t } = useTranslation();
  const participantData = useCombatSimulatorParticipantData(participant);
  const tribe = useParticipantTribe(participant);

  if (participantData === null || tribe === undefined) {
    return null;
  }

  const tribeUnits = getUnitsByTribeWithHero(tribe);
  const upgradableUnitIds = new Set(
    getSmithyUpgradeableUnitsByTribe(tribe).map(({ id }) => id),
  );
  const troopByUnitId = new Map(
    participantData.troops.map((troop) => [troop.unitId, troop]),
  );
  const amountLabel = t('Amount');
  const smithyImprovementLevelLabel = t('Smithy improvement level');
  const heroLabel = t('Include hero');
  const participantInputId =
    participant.role === 'reinforcement'
      ? `reinforcement-${participant.reinforcementId}`
      : participant.role;

  return (
    <>
      <UnitTableUnitIcons />
      <tbody className="border-b dark:border-border">
        <tr>
          <td className="border-r dark:border-border p-1 w-16">
            <div
              className="flex justify-center"
              data-tooltip-content={amountLabel}
              data-tooltip-id="general-tooltip"
            >
              <span className="sr-only">{amountLabel}</span>
              <LuHash className="size-4 md:size-5" />
            </div>
          </td>
          {tribeUnits.map((unit, index) => {
            const troop = troopByUnitId.get(unit.id);
            const isLastUnit = index === tribeUnits.length - 1;

            return (
              <td
                key={unit.id}
                className={`h-8 p-1 text-center ${isLastUnit ? '' : 'border-r dark:border-border'}`}
              >
                {unit.id === 'HERO' ? (
                  <div className="flex justify-center">
                    <Checkbox
                      aria-label={heroLabel}
                      checked={(troop?.amount ?? 0) > 0}
                      onCheckedChange={(checked) => {
                        participantData.onTroopsChange(
                          updateTroopAmount(
                            participantData.troops,
                            unit.id,
                            checked === true ? 1 : 0,
                          ),
                        );
                      }}
                    />
                  </div>
                ) : (
                  <Input
                    aria-label={amountLabel}
                    autoComplete="off"
                    className="mx-auto px-1 max-w-12 text-center"
                    hideSpinner
                    min={0}
                    size="fit"
                    type="number"
                    value={troop?.amount ?? 0}
                    onChange={(event) => {
                      participantData.onTroopsChange(
                        updateTroopAmount(
                          participantData.troops,
                          unit.id,
                          event.currentTarget.valueAsNumber,
                        ),
                      );
                    }}
                  />
                )}
              </td>
            );
          })}
        </tr>
      </tbody>
      <tbody className="border-b last:border-b-0 dark:border-border">
        <tr>
          <td className="border-r dark:border-border p-1 w-16">
            <div
              className="flex justify-center"
              data-tooltip-content={smithyImprovementLevelLabel}
              data-tooltip-id="general-tooltip"
            >
              <span className="sr-only">{smithyImprovementLevelLabel}</span>
              <GiAnvil className="size-4 md:size-5" />
            </div>
          </td>
          {tribeUnits.map((unit, index) => {
            const troop = troopByUnitId.get(unit.id);
            const isLastUnit = index === tribeUnits.length - 1;

            return (
              <td
                key={unit.id}
                className={`h-8 p-1 text-center ${isLastUnit ? '' : 'border-r dark:border-border'}`}
              >
                {upgradableUnitIds.has(unit.id) && (
                  <LevelInputPopover
                    className="mx-auto px-1 max-w-12 text-center"
                    id={`combat-simulator-${participantInputId}-${unit.id}-smithy-improvement-level`}
                    inputSize="fit"
                    label={smithyImprovementLevelLabel}
                    title={t('{{unitName}} level', {
                      unitName: t(`UNITS.${unit.id}.NAME`),
                    })}
                    value={troop?.smithyImprovementLevel ?? 0}
                    onValueChange={(value) => {
                      participantData.onSmithyImprovementLevelChange(
                        unit.id,
                        value,
                      );
                    }}
                  />
                )}
              </td>
            );
          })}
        </tr>
      </tbody>
    </>
  );
};

const CombatSimulatorHeroStatsControlsRow = ({
  participant,
}: {
  participant: CombatSimulatorTroopControlsParticipant;
}) => {
  const { t } = useTranslation();
  const participantData = useCombatSimulatorParticipantData(participant)!;

  const troopByUnitId = new Map(
    participantData.troops.map((troop) => [troop.unitId, troop]),
  );
  const heroTroop = troopByUnitId.get('HERO');
  const isHeroIncluded = (heroTroop?.amount ?? 0) > 0;

  if (!isHeroIncluded) {
    return null;
  }

  const heroStatsLabel = t('Hero stats');
  const participantInputId =
    participant.role === 'reinforcement'
      ? `reinforcement-${participant.reinforcementId}`
      : participant.role;

  const heroStatFields = [
    {
      key: 'hp',
      label: t('Health'),
      min: 1,
      max: 100,
      icon: <FaHeart className="size-4 md:size-5" />,
    },
    {
      key: 'strength',
      label: t('Strength points'),
      min: 0,
      max: 100,
      icon: <GiFist className="size-4 md:size-5" />,
    },
    participant.role === 'attacker'
      ? {
          key: 'attackBonus',
          label: t('Attack bonus points'),
          min: 0,
          max: 100,
          icon: (
            <Icon
              className="size-4 md:size-5"
              shouldShowTooltip={false}
              type="attack"
            />
          ),
        }
      : {
          key: 'defenceBonus',
          label: t('Defence bonus points'),
          min: 0,
          max: 100,
          icon: (
            <Icon
              className="size-4 md:size-5"
              shouldShowTooltip={false}
              type="defenceBonus"
            />
          ),
        },
  ] satisfies {
    key: keyof Pick<
      CombatSimulatorHeroStats,
      'hp' | 'strength' | 'attackBonus' | 'defenceBonus'
    >;
    label: string;
    min: number;
    max: number;
    icon: ReactNode;
  }[];

  return (
    <table className="w-full border-collapse border border-t-0 overflow-hidden dark:border-border text-left">
      <tbody>
        <tr>
          <td className="border-r dark:border-border p-1 w-16">
            <div
              className="flex justify-center"
              data-tooltip-content={heroStatsLabel}
              data-tooltip-id="general-tooltip"
            >
              <span className="sr-only">{heroStatsLabel}</span>
              <Icon
                className="size-4 md:size-5"
                type="hero"
              />
            </div>
          </td>
          <td className="p-1">
            <div className="flex flex-wrap items-center justify-end gap-2">
              {heroStatFields.map(({ key, label, min, max, icon }) => (
                <label
                  key={key}
                  className="flex items-center gap-1 text-muted-foreground"
                  data-tooltip-content={label}
                  data-tooltip-id="general-tooltip"
                  htmlFor={`combat-simulator-${participantInputId}-hero-${key}`}
                >
                  <span className="inline-flex items-center justify-center">
                    <span className="sr-only">{label}</span>
                    {icon}
                  </span>
                  <LevelInputPopover
                    className="px-1 w-8 text-center"
                    id={`combat-simulator-${participantInputId}-hero-${key}`}
                    inputSize="numericDoubleDigit"
                    label={label}
                    max={max}
                    min={min}
                    value={participantData.heroStats[key]}
                    onValueChange={(value) => {
                      participantData.onHeroStatsChange({
                        ...participantData.heroStats,
                        [key]: value,
                      });
                    }}
                  />
                </label>
              ))}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export const CombatSimulatorAttackerTroopControlsRows = () => {
  return (
    <CombatSimulatorTroopControlsRows participant={{ role: 'attacker' }} />
  );
};

export const CombatSimulatorAttackerHeroStatsControlsRow = () => {
  return (
    <CombatSimulatorHeroStatsControlsRow participant={{ role: 'attacker' }} />
  );
};

export const CombatSimulatorDefenderTroopControlsRows = () => {
  return (
    <CombatSimulatorTroopControlsRows participant={{ role: 'defender' }} />
  );
};

export const CombatSimulatorDefenderHeroStatsControlsRow = () => {
  return (
    <CombatSimulatorHeroStatsControlsRow participant={{ role: 'defender' }} />
  );
};

export const CombatSimulatorReinforcementTroopControlsRows = ({
  reinforcementId,
}: {
  reinforcementId: CombatSimulatorReinforcement['id'];
}) => {
  return (
    <CombatSimulatorTroopControlsRows
      participant={{ role: 'reinforcement', reinforcementId }}
    />
  );
};

export const CombatSimulatorReinforcementHeroStatsControlsRow = ({
  reinforcementId,
}: {
  reinforcementId: CombatSimulatorReinforcement['id'];
}) => {
  return (
    <CombatSimulatorHeroStatsControlsRow
      participant={{ role: 'reinforcement', reinforcementId }}
    />
  );
};
