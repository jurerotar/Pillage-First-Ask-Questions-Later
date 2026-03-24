import { clsx } from 'clsx';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { Unit } from '@pillage-first/types/models/unit';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/components/icons/icons';
import { FormControl, FormField, FormItem } from 'app/components/ui/form';
import { Input } from 'app/components/ui/input';
import type { SendTroopsFormData, UnitSelection } from './send-troops-form';

interface UnitSelectorProps {
  units: UnitSelection[];
  disabledUnitCategories?: Unit['category'][];
}

export const UnitSelector = ({
  units,
  disabledUnitCategories = [],
}: UnitSelectorProps) => {
  const { t } = useTranslation();
  const { control, setValue } = useFormContext<SendTroopsFormData>();

  const handleMaxClick = (index: number, available: number) => {
    setValue(`units.${index}.selected`, available);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {units.map((unit, index) => {
        const isDisabled = disabledUnitCategories.includes(
          unit.category as Unit['category'],
        );
        return (
          <div
            key={unit.unitId}
            className="flex items-center gap-2"
          >
            <Icon
              type={unitIdToUnitIconMapper(unit.unitId as Unit['id'])}
              className="size-5"
            />
            <FormField
              control={control}
              name={`units.${index}.selected`}
              render={({ field }) => (
                <FormItem className="gap-1">
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      disabled={isDisabled}
                      className="w-12 h-8 px-1 text-center bg-emerald-50/50 dark:bg-emerald-950/20"
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ''
                            ? 0
                            : Number.parseInt(e.target.value, 10),
                        )
                      }
                      aria-label={`${unit.unitId} count`}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <span
              className={clsx(
                'text-sm cursor-pointer hover:underline',
                unit.available > 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-400 dark:text-gray-500',
              )}
              onClick={() => handleMaxClick(index, unit.available)}
            >
              ({unit.available})
            </span>
          </div>
        );
      })}
    </div>
  );
};
