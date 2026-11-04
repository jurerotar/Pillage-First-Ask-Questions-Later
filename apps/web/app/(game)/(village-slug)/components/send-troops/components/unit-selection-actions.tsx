import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuListChecks, LuListX } from 'react-icons/lu';
import { Button } from 'app/components/ui/button';
import type { BaseTroopFormValues } from '../utils/schema';
import type { TroopSelectionFormUnitsOptions } from './troop-selection-form';

export const UnitSelectionActions = ({
  disabledUnitTiers,
  maxUnits,
  maxTotalUnits,
}: TroopSelectionFormUnitsOptions) => {
  const { t } = useTranslation();
  const { control, getValues, setValue } =
    useFormContext<BaseTroopFormValues>();
  const units = useWatch({ control, name: 'units' }) ?? [];

  const limits = new Map(
    maxUnits?.map(({ unitId, amount }) => [unitId, amount]),
  );

  const selectLabel = (() => {
    if (
      maxTotalUnits !== undefined ||
      units.some(
        (unit) => (limits.get(unit.unitId) ?? unit.available) < unit.available,
      )
    ) {
      return t('Fill selection');
    }

    return t('Select all');
  })();

  const updateSelection = (select: boolean) => {
    let remaining = maxTotalUnits ?? Number.POSITIVE_INFINITY;

    const selectedUnits = getValues('units').map((unit) => {
      if (!select || disabledUnitTiers?.includes(unit.tier)) {
        return { ...unit, selected: 0 };
      }

      const unitLimit = limits.get(unit.unitId) ?? unit.available;
      const selected = Math.max(
        0,
        Math.min(unit.available, unitLimit, remaining),
      );
      remaining -= selected;

      return { ...unit, selected };
    });

    setValue('units', selectedUnits, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <div className="mr-auto flex shrink-0 items-center gap-2 self-center">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={selectLabel}
        onClick={() => updateSelection(true)}
      >
        <LuListChecks className="size-4" />
      </Button>
      {units.some(({ selected }) => selected > 0) && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t('Deselect all')}
          onClick={() => updateSelection(false)}
        >
          <LuListX className="size-4" />
        </Button>
      )}
    </div>
  );
};
