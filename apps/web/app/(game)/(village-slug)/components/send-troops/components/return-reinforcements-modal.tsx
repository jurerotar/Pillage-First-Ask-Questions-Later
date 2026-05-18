import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  getUnitDefinition,
  getUnitsByTribe,
} from '@pillage-first/game-assets/utils/units';
import type { Tribe } from '@pillage-first/types/models/tribe';
import type { Troop } from '@pillage-first/types/models/troop';
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
import { TroopMovementConfirmationModal } from './confirmation-modal';
import { PlayerVillageSelector } from './target-selectors';
import { UnitSelector } from './unit-selector';

type ReturnReinforcementsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  tribe: Tribe;
  sourceTileId: number;
  troops: Troop[];
};

export const ReturnReinforcementsModal = ({
  isOpen,
  onClose,
  title,
  tribe,
  sourceTileId,
  troops,
}: ReturnReinforcementsModalProps) => {
  const { t } = useTranslation();
  const { playerVillages } = usePlayerVillageListing();
  const { returnReinforcements } = useVillageTroops();
  const sourceVillage = playerVillages.find(
    (village) => village.tileId === sourceTileId,
  );
  const sourceVillageCoordinates = sourceVillage?.coordinates;
  const {
    isOpen: isConfirmationOpen,
    openModal: openConfirmation,
    closeModal: closeConfirmation,
    modalArgs: confirmationArgs,
  } = useDialog<BaseTroopFormValues>();
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
      target: sourceVillageCoordinates
        ? {
            x: sourceVillageCoordinates.x,
            y: sourceVillageCoordinates.y,
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
  }, [form, isOpen, sourceVillageCoordinates, tribe, troops]);

  const onSubmit = form.handleSubmit(({ units }) => {
    if (!sourceVillageCoordinates) {
      return;
    }

    openConfirmation({
      target: {
        x: sourceVillageCoordinates.x,
        y: sourceVillageCoordinates.y,
      },
      units: units.map((unit) => ({
        ...unit,
        available: unit.selected,
      })),
    });
  });

  const onConfirmReturnAction = () => {
    const pendingReturnData = confirmationArgs.current;

    if (
      pendingReturnData?.target.x === undefined ||
      pendingReturnData.target.y === undefined ||
      sourceVillage?.id === undefined
    ) {
      return;
    }

    const selectedTroops = pendingReturnData.units.filter(
      ({ selected }) => selected > 0,
    );

    if (selectedTroops.length === 0) {
      return;
    }

    returnReinforcements(
      {
        troops: selectedTroops.map(({ unitId, selected }) => ({
          unitId,
          amount: selected,
        })),
        sourceTileId,
      },
      {
        onSuccess: () => {
          closeConfirmation();
          onClose();
        },
      },
    );
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {t(
                'Select the units to send back to their home village. Units not currently stationed here cannot be selected.',
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
                <Button type="submit">{t('Confirm')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {isConfirmationOpen && (
        <TroopMovementConfirmationModal
          isOpen
          onClose={closeConfirmation}
          onConfirm={onConfirmReturnAction}
          formData={confirmationArgs.current!}
          title={title}
          tribe={tribe}
        />
      )}
    </>
  );
};
