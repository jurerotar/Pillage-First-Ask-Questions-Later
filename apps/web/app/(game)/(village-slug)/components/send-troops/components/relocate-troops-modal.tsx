import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  getUnitDefinition,
  getUnitsByTribe,
} from '@pillage-first/game-assets/utils/units';
import type { Tribe } from '@pillage-first/types/models/tribe';
import type { Troop } from '@pillage-first/types/models/troop';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useVillageTroops } from 'app/(game)/(village-slug)/hooks/use-village-troops';
import { Button } from 'app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import { Form } from 'app/components/ui/form';
import type { BaseTroopFormValues } from '../utils/schema';
import { UnitSelector } from './unit-selector';

type RelocateTroopsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  tribe: Tribe;
  sourceTileId: number;
  troops: Troop[];
};

export const RelocateTroopsModal = ({
  isOpen,
  onClose,
  title,
  tribe,
  sourceTileId,
  troops,
}: RelocateTroopsModalProps) => {
  const { t, i18n } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { relocateReinforcements } = useVillageTroops();
  const form = useForm<BaseTroopFormValues>({
    defaultValues: {
      target: {},
      units: [],
    },
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const troopAmountByUnitId = new Map(
      troops.map(({ unitId, amount }) => [unitId, amount] as const),
    );
    const tribeUnits = [...getUnitsByTribe(tribe), getUnitDefinition('HERO')];

    form.reset({
      units: tribeUnits.map((unitDef) => ({
        unitId: unitDef.id,
        selected: 0,
        available: troopAmountByUnitId.get(unitDef.id) ?? 0,
        tier: unitDef.tier,
        category: unitDef.category,
      })),
    });
  }, [form, isOpen, tribe, troops]);

  const onSubmit = form.handleSubmit(({ units }) => {
    const selectedTroops = units.filter(({ selected }) => selected > 0);

    if (selectedTroops.length === 0) {
      return;
    }

    relocateReinforcements(
      {
        sourceTileId,
        troops: selectedTroops.map(({ unitId, selected }) => ({
          unitId,
          amount: selected,
        })),
      },
      {
        onSuccess: () => {
          const relocatedTroopSummary = selectedTroops.map(
            ({ unitId, selected }) => {
              const unitName = t(`UNITS.${unitId}.NAME`, { count: selected });

              return `${selected} ${unitName}`;
            },
          );
          const formattedTroopList = new Intl.ListFormat(i18n.language, {
            style: 'long',
            type: 'conjunction',
          }).format(relocatedTroopSummary);

          toast(
            t("{{troops}} are now part of {{villageName}}'s garrison", {
              troops: formattedTroopList,
              villageName: currentVillage.name,
            }),
          );
          onClose();
        },
      },
    );
  });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {t(
              'Select the reinforcements to absorb into this village. Chosen troops will become part of your local garrison.',
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={onSubmit}
          >
            <UnitSelector
              maxUnits={troops.map(({ unitId, amount }) => ({
                unitId,
                amount,
              }))}
            />
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
