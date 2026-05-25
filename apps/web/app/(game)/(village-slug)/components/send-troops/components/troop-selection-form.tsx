import type { ReactNode } from 'react';
import type { SubmitHandler, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag';
import { Button } from 'app/components/ui/button';
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import { Form } from 'app/components/ui/form';
import { getFormErrorBag } from 'app/utils/forms';
import type { BaseTroopFormValues, UnitSelection } from '../utils/schema';
import { CoordinateSelector, PlayerVillageSelector } from './target-selectors';
import { UnitSelector } from './unit-selector';

type TroopSelectionFormProps<T extends BaseTroopFormValues> = {
  form: UseFormReturn<T, unknown, T>;
  onSubmit: SubmitHandler<T>;
  title?: string;
  disabledUnitTiers?: UnitSelection['tier'][];
  maxUnits?: { unitId: UnitSelection['unitId']; amount: number }[];
  targetSelector?: 'coordinates' | 'playerVillage' | null;
  isTargetSelectorDisabled?: boolean;
  excludedVillageIds?: number[];
  extraTargetContent?: ReactNode;
  actions?: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isSubmitDisabled?: boolean;
  formClassName?: string;
  targetWrapperClassName?: string;
  showErrorBag?: boolean;
};

export const TroopSelectionForm = <T extends BaseTroopFormValues>({
  form,
  onSubmit,
  title,
  disabledUnitTiers,
  maxUnits,
  targetSelector = null,
  isTargetSelectorDisabled = false,
  excludedVillageIds,
  extraTargetContent,
  actions,
  submitLabel,
  cancelLabel,
  onCancel,
  isSubmitDisabled = false,
  formClassName = 'space-y-6',
  targetWrapperClassName = 'flex items-end gap-4',
  showErrorBag = true,
}: TroopSelectionFormProps<T>) => {
  const { t } = useTranslation();

  return (
    <>
      {title ? (
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
      ) : null}
      <Form {...form}>
        <form
          className={formClassName}
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <UnitSelector
            disabledUnitTiers={disabledUnitTiers}
            maxUnits={maxUnits}
          />

          {targetSelector || extraTargetContent ? (
            <div className={targetWrapperClassName}>
              {targetSelector === 'coordinates' ? (
                <CoordinateSelector disabled={isTargetSelectorDisabled} />
              ) : null}
              {targetSelector === 'playerVillage' ? (
                <PlayerVillageSelector
                  disabled={isTargetSelectorDisabled}
                  excludedVillageIds={excludedVillageIds}
                />
              ) : null}
              {extraTargetContent}
            </div>
          ) : null}

          {showErrorBag ? (
            <ErrorBag errorBag={getFormErrorBag(form.formState.errors)} />
          ) : null}

          {actions ?? (
            <DialogFooter>
              {onCancel ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                >
                  {cancelLabel ?? t('Cancel')}
                </Button>
              ) : null}
              <Button
                type="submit"
                disabled={isSubmitDisabled}
              >
                {submitLabel ?? t('Confirm')}
              </Button>
            </DialogFooter>
          )}
        </form>
      </Form>
    </>
  );
};
