import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { Tribe } from '@pillage-first/types/models/tribe';
import { Button } from 'app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import { Form } from 'app/components/ui/form';
import type { BaseTroopFormValues, UnitSelection } from '../utils/schema';
import { CoordinateSelector, PlayerVillageSelector } from './target-selectors';
import { UnitSelector } from './unit-selector';

type SendTroopsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  tribe: Tribe;
  form: UseFormReturn<BaseTroopFormValues>;
  disabledUnitTiers?: UnitSelection['tier'][];
  maxUnits?: { unitId: UnitSelection['unitId']; amount: number }[];
  targetSelector?: 'coordinates' | 'playerVillage';
};

export const SendTroopsModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  tribe,
  form,
  disabledUnitTiers,
  maxUnits,
  targetSelector = 'coordinates',
}: SendTroopsModalProps) => {
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
                <CoordinateSelector />
              ) : (
                <PlayerVillageSelector />
              )}
            </div>

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
