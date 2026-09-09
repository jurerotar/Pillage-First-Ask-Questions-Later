import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { GiAnvil } from 'react-icons/gi';
import { LuHash } from 'react-icons/lu';
import {
  getSmithyUpgradeableUnitsByTribe,
  getUnitsByTribeWithHero,
} from '@pillage-first/game-assets/utils/units';
import type { UnitId } from '@pillage-first/types/models/unit';
import { UnitTableUnitIcons } from 'app/(game)/components/unit-table';
import { Checkbox } from 'app/components/ui/checkbox';
import { Input } from 'app/components/ui/input';
import {
  CombatSimulatorContext,
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
  const combatSimulator = use(CombatSimulatorContext)!;
  const { state } = combatSimulator;

  const participantData = (() => {
    if (participant.role === 'attacker') {
      return {
        tribe: state.attacker.tribe,
        troops: state.attacker.troops,
        onTroopsChange: combatSimulator.setAttackerTroops,
        onSmithyImprovementLevelChange:
          combatSimulator.setAttackerSmithyImprovementLevel,
      };
    }

    if (participant.role === 'defender') {
      return {
        tribe: state.defender.tribe,
        troops: state.defender.troops,
        onTroopsChange: combatSimulator.setDefenderTroops,
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
      tribe: reinforcement.tribe,
      troops: reinforcement.troops,
      onTroopsChange: (troops: CombatSimulatorTroop[]) => {
        combatSimulator.setDefenderReinforcementTroops(
          reinforcement.id,
          troops,
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
  })();

  if (participantData === null) {
    return null;
  }

  const tribeUnits = getUnitsByTribeWithHero(participantData.tribe);
  const upgradableUnitIds = new Set(
    getSmithyUpgradeableUnitsByTribe(participantData.tribe).map(({ id }) => id),
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

export const CombatSimulatorAttackerTroopControlsRows = () => {
  return (
    <CombatSimulatorTroopControlsRows participant={{ role: 'attacker' }} />
  );
};

export const CombatSimulatorDefenderTroopControlsRows = () => {
  return (
    <CombatSimulatorTroopControlsRows participant={{ role: 'defender' }} />
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
