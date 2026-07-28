import { clsx } from 'clsx';
import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import type { Unit } from '@pillage-first/types/models/unit';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/components/icons/icons';
import { FormControl, FormField, FormItem } from 'app/components/ui/form';
import { Input } from 'app/components/ui/input';

const displayGroups: Unit['category'][] = [
  'infantry',
  'cavalry',
  'siege',
  'administration',
];

type UnitSelectorProps = {
  disabledUnitTiers?: Unit['tier'][];
  maxUnits?: { unitId: Unit['id']; amount: number }[];
  maxTotalUnits?: number;
};

const EMPTY_DISABLED_UNIT_TIERS: Unit['tier'][] = [];
const EMPTY_MAX_UNITS: NonNullable<UnitSelectorProps['maxUnits']> = [];

export const UnitSelector = ({
  disabledUnitTiers = EMPTY_DISABLED_UNIT_TIERS,
  maxUnits = EMPTY_MAX_UNITS,
  maxTotalUnits,
}: UnitSelectorProps) => {
  const { control, setValue, watch } = useFormContext<{
    units: {
      unitId: Unit['id'];
      selected: number;
      available: number;
      tier: Unit['tier'];
      category: Unit['category'];
    }[];
  }>();

  const units = watch('units') || [];

  const maxAmountByUnitId = useMemo(() => {
    return new Map(maxUnits.map(({ unitId, amount }) => [unitId, amount]));
  }, [maxUnits]);

  let totalSelectedAmount = 0;

  for (const unit of units) {
    totalSelectedAmount += unit.selected;
  }

  const groupedUnits: Partial<
    Record<Unit['category'], ({ index: number } & (typeof units)[number])[]>
  > = {};

  for (const [index, unit] of units.entries()) {
    const groupKey =
      unit.category === 'hero' ? 'administration' : unit.category;
    if (!groupedUnits[groupKey]) {
      groupedUnits[groupKey] = [];
    }
    groupedUnits[groupKey].push({ ...unit, index });
  }

  const handleMaxClick = (
    index: number,
    available: number,
    unitId: Unit['id'],
  ) => {
    const unit = units[index];
    const maxTotalAmount =
      maxTotalUnits === undefined
        ? available
        : maxTotalUnits - totalSelectedAmount + (unit?.selected ?? 0);
    const maxAmount = maxAmountByUnitId.get(unitId) ?? available;
    setValue(
      `units.${index}.selected`,
      Math.max(0, Math.min(available, maxAmount, maxTotalAmount)),
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        {displayGroups.map((group) => {
          const categoryUnits = groupedUnits[group] ?? [];

          return (
            <div
              key={group}
              className="flex min-w-0 flex-col gap-2"
            >
              <div className="flex flex-col gap-4 w-full">
                {categoryUnits.map((unit) => {
                  const isTierDisabled = disabledUnitTiers.includes(unit.tier);
                  const isAvailable = unit.available > 0;
                  const maxTotalAmount =
                    maxTotalUnits === undefined
                      ? unit.available
                      : maxTotalUnits - totalSelectedAmount + unit.selected;
                  const maxAmount =
                    maxAmountByUnitId.get(unit.unitId) ?? unit.available;
                  const maxSelectableAmount = Math.max(
                    0,
                    Math.min(unit.available, maxAmount, maxTotalAmount),
                  );
                  const isPartyFull =
                    maxTotalUnits !== undefined &&
                    maxSelectableAmount <= 0 &&
                    unit.selected <= 0;
                  const isDisabled =
                    isTierDisabled || !isAvailable || isPartyFull;

                  return (
                    <div
                      key={unit.unitId}
                      className={clsx(
                        'flex flex-col items-center gap-2',
                        isDisabled && 'opacity-50',
                      )}
                    >
                      <div className="flex justify-between w-full gap-2">
                        <label
                          htmlFor={`unit-${unit.unitId}`}
                          className="cursor-pointer"
                        >
                          <Icon
                            type={unitIdToUnitIconMapper(unit.unitId)}
                            className="size-5"
                          />
                        </label>
                        <button
                          type="button"
                          disabled={isDisabled}
                          className={clsx(
                            'text-sm font-medium',
                            !isDisabled && 'cursor-pointer hover:underline',
                            !isDisabled && isAvailable
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-400 dark:text-gray-500',
                          )}
                          onClick={() => {
                            handleMaxClick(
                              unit.index,
                              unit.available,
                              unit.unitId,
                            );
                          }}
                        >
                          ({unit.available})
                        </button>
                      </div>

                      <FormField
                        control={control}
                        name={`units.${unit.index}.selected`}
                        render={({ field }) => (
                          <FormItem className="w-full space-y-2">
                            <FormControl>
                              <Input
                                {...field}
                                id={`unit-${unit.unitId}`}
                                type="number"
                                min={0}
                                max={maxSelectableAmount}
                                disabled={isDisabled}
                                className="px-1 text-left w-full bg-emerald-50/50 dark:bg-emerald-950/20"
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ''
                                      ? 0
                                      : Math.max(
                                          0,
                                          Math.min(
                                            Number.parseInt(e.target.value, 10),
                                            maxSelectableAmount,
                                          ),
                                        ),
                                  )
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
