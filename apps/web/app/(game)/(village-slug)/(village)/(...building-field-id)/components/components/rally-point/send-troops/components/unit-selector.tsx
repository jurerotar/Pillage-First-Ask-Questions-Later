import { clsx } from 'clsx';
import { useFormContext } from 'react-hook-form';
import type { Unit } from '@pillage-first/types/models/unit';
import { Icon } from 'app/components/icon.tsx';
import { unitIdToUnitIconMapper } from 'app/components/icons/icons.tsx';
import { FormControl, FormField, FormItem } from 'app/components/ui/form.tsx';
import { Input } from 'app/components/ui/input.tsx';

const displayGroups: (Unit['category'] | 'scout')[] = [
  'infantry',
  'cavalry',
  'scout',
  'siege',
  'administration',
  'hero',
];

type UnitSelectorProps = {
  disabledUnitTiers?: Unit['tier'][];
};

export const UnitSelector = ({ disabledUnitTiers = [] }: UnitSelectorProps) => {
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

  const groupedUnits = units.reduce(
    (acc, unit, index) => {
      const groupKey = unit.tier === 'scout' ? 'scout' : unit.category;
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push({ ...unit, index });
      return acc;
    },
    {} as Record<
      Unit['category'] | 'scout',
      ({ index: number } & (typeof units)[number])[]
    >,
  );

  const handleMaxClick = (index: number, available: number) => {
    setValue(`units.${index}.selected`, available);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row gap-4 justify-start">
        {displayGroups.map((group) => {
          const categoryUnits = groupedUnits[group];

          return (
            <div
              key={group}
              className="flex flex-1 flex-col gap-2"
            >
              <div className="grid grid-cols-1 gap-4 w-full">
                {categoryUnits.map((unit) => {
                  const isTierDisabled = disabledUnitTiers.includes(unit.tier);
                  const isAvailable = unit.available > 0;
                  const isDisabled = isTierDisabled || !isAvailable;

                  return (
                    <div
                      key={unit.unitId}
                      className={clsx(
                        'flex flex-col items-center gap-2',
                        !isAvailable && 'opacity-50',
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
                            handleMaxClick(unit.index, unit.available);
                          }}
                        >
                          ({unit.available})
                        </button>
                      </div>

                      <FormField
                        control={control}
                        name={`units.${unit.index}.selected`}
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormControl>
                              <Input
                                {...field}
                                id={`unit-${unit.unitId}`}
                                type="number"
                                min={0}
                                max={unit.available}
                                disabled={isDisabled}
                                className="px-1 text-left w-full bg-emerald-50/50 dark:bg-emerald-950/20"
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ''
                                      ? 0
                                      : Number.parseInt(e.target.value, 10),
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
