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

export type TroopSelectionFormUnitsOptions = {
  disabledUnitTiers?: UnitSelection['tier'][];
  maxUnits?: { unitId: UnitSelection['unitId']; amount: number }[];
  maxTotalUnits?: number;
};

export type TroopSelectionFormTargetOptions = {
  selector?: 'coordinates' | 'playerVillage' | null;
  isDisabled?: boolean;
  excludedVillageIds?: number[];
  extraContent?: ReactNode;
  wrapperClassName?: string;
};

export type TroopSelectionFormFooterOptions = {
  content?: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isSubmitDisabled?: boolean;
};

export type TroopSelectionFormProps<T extends BaseTroopFormValues> = {
  form: UseFormReturn<T, unknown, T>;
  onSubmit: SubmitHandler<T>;
  title?: string;
  units?: TroopSelectionFormUnitsOptions;
  target?: TroopSelectionFormTargetOptions;
  footer?: TroopSelectionFormFooterOptions;
};

export const TroopSelectionForm = <T extends BaseTroopFormValues>({
  form,
  onSubmit,
  title,
  units,
  target,
  footer,
}: TroopSelectionFormProps<T>) => {
  const { t } = useTranslation();
  const resolvedDisabledUnitTiers = units?.disabledUnitTiers;
  const resolvedMaxUnits = units?.maxUnits;
  const resolvedMaxTotalUnits = units?.maxTotalUnits;
  const resolvedTargetSelector = target?.selector ?? null;
  const resolvedIsTargetSelectorDisabled = target?.isDisabled ?? false;
  const resolvedExcludedVillageIds = target?.excludedVillageIds;
  const resolvedExtraTargetContent = target?.extraContent;
  const resolvedTargetWrapperClassName =
    target?.wrapperClassName ?? 'flex items-start gap-4';
  const resolvedActions = footer?.content;
  const resolvedSubmitLabel = footer?.submitLabel;
  const resolvedCancelLabel = footer?.cancelLabel;
  const resolvedOnCancel = footer?.onCancel;
  const resolvedIsSubmitDisabled = footer?.isSubmitDisabled ?? false;

  return (
    <>
      {title ? (
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
      ) : null}
      <Form {...form}>
        <form
          className="space-y-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <UnitSelector
            disabledUnitTiers={resolvedDisabledUnitTiers}
            maxUnits={resolvedMaxUnits}
            maxTotalUnits={resolvedMaxTotalUnits}
          />

          {resolvedTargetSelector || resolvedExtraTargetContent ? (
            <div className={resolvedTargetWrapperClassName}>
              {resolvedTargetSelector === 'coordinates' ? (
                <CoordinateSelector
                  disabled={resolvedIsTargetSelectorDisabled}
                />
              ) : null}
              {resolvedTargetSelector === 'playerVillage' ? (
                <PlayerVillageSelector
                  disabled={resolvedIsTargetSelectorDisabled}
                  excludedVillageIds={resolvedExcludedVillageIds}
                />
              ) : null}
              {resolvedExtraTargetContent}
            </div>
          ) : null}

          <ErrorBag errorBag={getFormErrorBag(form.formState.errors)} />

          {resolvedActions ?? (
            <DialogFooter>
              {resolvedOnCancel ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resolvedOnCancel}
                  className="ml-auto"
                >
                  {resolvedCancelLabel ?? t('Cancel')}
                </Button>
              ) : null}
              <Button
                type="submit"
                disabled={resolvedIsSubmitDisabled}
                className={resolvedOnCancel ? undefined : 'ml-auto'}
              >
                {resolvedSubmitLabel ?? t('Confirm')}
              </Button>
            </DialogFooter>
          )}
        </form>
      </Form>
    </>
  );
};
