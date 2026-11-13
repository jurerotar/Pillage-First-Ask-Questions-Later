import { useTranslation } from 'react-i18next';
import { GiAnvil } from 'react-icons/gi';
import { LuHash } from 'react-icons/lu';
import {
  getUnitsByTribe,
  getUnitsByTribeWithHero,
  isSmithyUpgradeableUnit,
} from '@pillage-first/game-assets/utils/units';
import type { CombatSimulatorTroop } from '@pillage-first/types/models/combat-simulator';
import type { Tribe } from '@pillage-first/types/models/tribe';
import type { UnitId } from '@pillage-first/types/models/unit';
import { UnitTableUnitIcons } from 'app/(game)/components/unit-table';
import { Checkbox } from 'app/components/ui/checkbox';
import { Input } from 'app/components/ui/input';
import { LevelInputPopover } from './level-input-popover';

type CombatSimulatorTroopControlsRowsProps = {
  id: string;
  tribe: Tribe;
  includeHero?: boolean;
  troops: CombatSimulatorTroop[];
  onTroopsChange: (troops: CombatSimulatorTroop[]) => void;
  onSmithyImprovementLevelChange: (
    unitId: UnitId,
    smithyImprovementLevel: number,
  ) => void;
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

export const CombatSimulatorTroopControlsRows = ({
  id,
  tribe,
  includeHero = false,
  troops,
  onTroopsChange,
  onSmithyImprovementLevelChange,
}: CombatSimulatorTroopControlsRowsProps) => {
  const { t } = useTranslation();
  const tribeUnits = includeHero
    ? getUnitsByTribeWithHero(tribe)
    : getUnitsByTribe(tribe);
  const troopByUnitId = new Map(troops.map((troop) => [troop.unitId, troop]));
  const amountLabel = t('Amount');
  const smithyImprovementLevelLabel = t('Smithy improvement level');
  const heroLabel = t('Include hero');

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
          {tribeUnits.map((unit) => {
            const troop = troopByUnitId.get(unit.id);

            return (
              <td
                key={unit.id}
                className="h-8 p-1 text-center border-r last:border-r-0 dark:border-border"
              >
                {unit.id === 'HERO' ? (
                  <div className="flex justify-center">
                    <Checkbox
                      aria-label={heroLabel}
                      checked={(troop?.amount ?? 0) > 0}
                      onCheckedChange={(checked) => {
                        onTroopsChange(
                          updateTroopAmount(
                            troops,
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
                      onTroopsChange(
                        updateTroopAmount(
                          troops,
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
      {tribe !== 'nature' && (
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
            {tribeUnits.map((unit) => {
              const troop = troopByUnitId.get(unit.id);

              return (
                <td
                  key={unit.id}
                  className="h-8 p-1 text-center border-r last:border-r-0 dark:border-border"
                >
                  {unit.id !== 'HERO' && isSmithyUpgradeableUnit(unit) && (
                    <LevelInputPopover
                      className="mx-auto px-1 max-w-12 text-center"
                      id={`combat-simulator-${id}-${unit.id}-smithy-improvement-level`}
                      inputSize="fit"
                      label={smithyImprovementLevelLabel}
                      title={t('{{unitName}} level', {
                        unitName: t(`UNITS.${unit.id}.NAME`),
                      })}
                      value={troop?.smithyImprovementLevel ?? 0}
                      onValueChange={(value) => {
                        onSmithyImprovementLevelChange(unit.id, value);
                      }}
                    />
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      )}
    </>
  );
};
