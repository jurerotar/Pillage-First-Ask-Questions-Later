import type { ReactNode } from 'react';
import type { SubmitHandler, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { Tribe } from '@pillage-first/types/models/tribe';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag';
import { Button } from 'app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import { Form } from 'app/components/ui/form';
import { getFormErrorBag } from 'app/utils/forms';
import type { BaseTroopFormValues, UnitSelection } from '../utils/schema';
import { CoordinateSelector, PlayerVillageSelector } from './target-selectors';
import { UnitSelector } from './unit-selector';

type SendTroopsModalProps<T extends BaseTroopFormValues> = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: SubmitHandler<T>;
  title: string;
  tribe: Tribe;
  form: UseFormReturn<T>;
  disabledUnitTiers?: UnitSelection['tier'][];
  maxUnits?: { unitId: UnitSelection['unitId']; amount: number }[];
  targetSelector?: 'coordinates' | 'playerVillage';
  isTargetSelectorDisabled?: boolean;
  extraContent?: ReactNode;
};

export const SendTroopsModal = <T extends BaseTroopFormValues>({
  isOpen,
  onClose,
  onSubmit,
  title,
  tribe,
  form,
  disabledUnitTiers,
  maxUnits,
  targetSelector = 'coordinates',
  isTargetSelectorDisabled = false,
  extraContent,
}: SendTroopsModalProps<T>) => {
  const { t } = useTranslation();

  void tribe;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-6"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <UnitSelector
              disabledUnitTiers={disabledUnitTiers}
              maxUnits={maxUnits}
            />

            <div className="flex items-end gap-4">
              {targetSelector === 'coordinates' ? (
                <CoordinateSelector disabled={isTargetSelectorDisabled} />
              ) : (
                <PlayerVillageSelector disabled={isTargetSelectorDisabled} />
              )}

              {extraContent}
            </div>

            <ErrorBag errorBag={getFormErrorBag(form.formState.errors)} />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                {t('Cancel')}
              </Button>
              <Button type="submit">{t('Confirm')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
