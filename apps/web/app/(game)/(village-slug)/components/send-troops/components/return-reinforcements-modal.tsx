import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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
import { useDialog } from 'app/hooks/use-dialog';
import type { BaseTroopFormValues } from '../utils/schema';
import { TroopMovementConfirmationContent } from './confirmation-modal';
import { PlayerVillageSelector } from './target-selectors';
import { UnitSelector } from './unit-selector';

type ReturnReinforcementsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  tribe: Tribe;
  mode?: 'incoming' | 'outgoing';
  tileId: number;
  troops: Troop[];
};

export const ReturnReinforcementsModal = ({
  isOpen,
  onClose,
  title,
  tribe,
  mode = 'incoming',
  tileId,
  troops,
}: ReturnReinforcementsModalProps) => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { playerVillages } = usePlayerVillageListing();
  const { returnReinforcements, returnSentReinforcements } = useVillageTroops();
  const selectedVillage = playerVillages.find(
    (village) => village.tileId === tileId,
  );
  const targetCoordinates =
    mode === 'incoming'
      ? selectedVillage?.coordinates
      : currentVillage.coordinates;
  const {
    isOpen: isConfirmationStepOpen,
    openModal: openConfirmationStep,
    closeModal: closeConfirmationStep,
    modalArgs: confirmationStepData,
  } = useDialog<BaseTroopFormValues>();
  const form = useForm<BaseTroopFormValues>({
    defaultValues: {
      target: {},
      units: [],
    },
  });
  const units = form.watch('units');
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
      target: targetCoordinates
        ? {
            x: targetCoordinates.x,
            y: targetCoordinates.y,
          }
        : {},
      units: tribeUnits.map((unitDef) => ({
        unitId: unitDef.id,
        selected: 0,
        available: troopAmountByUnitId.get(unitDef.id) ?? 0,
        tier: unitDef.tier,
        category: unitDef.category,
      })),
    });
  }, [form, isOpen, targetCoordinates, tribe, troops]);

  const onSubmit = form.handleSubmit(({ units }) => {
    if (!targetCoordinates) {
      return;
    }

    openConfirmationStep({
      target: {
        x: targetCoordinates.x,
        y: targetCoordinates.y,
      },
      units: units.map((unit) => ({
        ...unit,
        available: unit.selected,
      })),
    });
  });

  const onConfirmReturnAction = () => {
    const pendingReturnData = confirmationStepData.current;

    if (
      pendingReturnData?.target.x === undefined ||
      pendingReturnData.target.y === undefined ||
      selectedVillage?.id === undefined
    ) {
      return;
    }

    const selectedTroops = pendingReturnData.units.filter(
      ({ selected }) => selected > 0,
    );

    if (selectedTroops.length === 0) {
      return;
    }

    const mutationArgs = {
      troops: selectedTroops.map(({ unitId, selected }) => ({
        unitId,
        amount: selected,
      })),
    };

    const onSuccess = () => {
      closeConfirmationStep();
      onClose();
    };

    if (mode === 'incoming') {
      returnReinforcements(
        {
          ...mutationArgs,
          sourceTileId: tileId,
        },
        { onSuccess },
      );

      return;
    }

    returnSentReinforcements(
      {
        ...mutationArgs,
        stationedTileId: tileId,
      },
      { onSuccess },
    );
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent>
        {isConfirmationStepOpen && confirmationStepData.current ? (
          <TroopMovementConfirmationContent
            onBack={closeConfirmationStep}
            onConfirm={onConfirmReturnAction}
            formData={confirmationStepData.current}
            title={title}
            tribe={tribe}
            originCoordinates={
              mode === 'outgoing' ? selectedVillage?.coordinates : undefined
            }
            backLabel={t('Back')}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>
                {mode === 'incoming'
                  ? t(
                      'Select the units to send back to their home village. Units not currently stationed here cannot be selected.',
                    )
                  : t(
                      'Select the units to recall from this village back to your current village.',
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
                <div className="flex items-end gap-4">
                  <PlayerVillageSelector disabled />
                </div>
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
                    disabled={!hasSelectedTroops}
                  >
                    {t('Confirm')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
