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
import { usePlayerVillageListing } from 'app/(game)/(village-slug)/hooks/use-player-village-listing';
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
import { PlayerVillageSelector } from './target-selectors';
import { UnitSelector } from './unit-selector';

type RelocateTroopsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  tribe: Tribe;
  mode?: 'incoming' | 'outgoing';
  tileId: number;
  villageId?: number;
  villageName?: string;
  troops: Troop[];
};

export const RelocateTroopsModal = ({
  isOpen,
  onClose,
  title,
  tribe,
  mode = 'incoming',
  tileId,
  villageId,
  villageName,
  troops,
}: RelocateTroopsModalProps) => {
  const { t, i18n } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { playerVillages } = usePlayerVillageListing();
  const { relocateReinforcements, relocateSentReinforcements } =
    useVillageTroops();
  const form = useForm<BaseTroopFormValues>({
    defaultValues: {
      target: {},
      units: [],
    },
  });
  const units = form.watch('units');
  const target = form.watch('target');
  const hasSelectedTroops = units.some(({ selected }) => selected > 0);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const troopAmountByUnitId = new Map(
      troops.map(({ unitId, amount }) => [unitId, amount] as const),
    );
    const tribeUnits = [...getUnitsByTribe(tribe), getUnitDefinition('HERO')];

    form.reset({
      target: {},
      units: tribeUnits.map((unitDef) => ({
        unitId: unitDef.id,
        selected: 0,
        available: troopAmountByUnitId.get(unitDef.id) ?? 0,
        tier: unitDef.tier,
        category: unitDef.category,
      })),
    });
  }, [form, isOpen, tribe, troops]);

  const onSubmit = form.handleSubmit(({ units, target: formTarget }) => {
    const selectedTroops = units.filter(({ selected }) => selected > 0);

    if (selectedTroops.length === 0) {
      return;
    }

    const relocatedTroopSummary = selectedTroops.map(({ unitId, selected }) => {
      const unitName = t(`UNITS.${unitId}.NAME`, { count: selected });

      return `${selected} ${unitName}`;
    });
    const formattedTroopList = new Intl.ListFormat(i18n.language, {
      style: 'long',
      type: 'conjunction',
    }).format(relocatedTroopSummary);

    if (mode === 'incoming') {
      relocateReinforcements(
        {
          sourceTileId: tileId,
          troops: selectedTroops.map(({ unitId, selected }) => ({
            unitId,
            amount: selected,
          })),
        },
        {
          onSuccess: () => {
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

      return;
    }

    if (formTarget.x === undefined || formTarget.y === undefined) {
      return;
    }

    const targetVillage = playerVillages.find(
      (village) =>
        village.coordinates.x === formTarget.x &&
        village.coordinates.y === formTarget.y,
    );

    if (!targetVillage) {
      return;
    }

    relocateSentReinforcements(
      {
        stationedTileId: tileId,
        targetTileId: targetVillage.tileId,
        troops: selectedTroops.map(({ unitId, selected }) => ({
          unitId,
          amount: selected,
        })),
      },
      {
        onSuccess: () => {
          toast(
            t(
              '{{troops}} are now moving from {{sourceVillage}} to {{targetVillage}}',
              {
                troops: formattedTroopList,
                sourceVillage: villageName,
                targetVillage: targetVillage.name,
              },
            ),
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
            {mode === 'incoming'
              ? t(
                  'Select the reinforcements to absorb into this village. Chosen troops will become part of your local garrison.',
                )
              : t(
                  'Select the reinforcements to move out of this village and choose their next destination.',
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
            {mode === 'outgoing' && (
              <div className="flex items-end gap-4">
                <PlayerVillageSelector
                  excludedVillageIds={villageId ? [villageId] : []}
                />
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                {t('Cancel')}
              </Button>
              <Button
                type="submit"
                disabled={
                  !hasSelectedTroops ||
                  (mode === 'outgoing' &&
                    (target.x === undefined || target.y === undefined))
                }
              >
                {t('Confirm')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
