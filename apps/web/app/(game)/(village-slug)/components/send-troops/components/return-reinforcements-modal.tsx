import { useTranslation } from 'react-i18next';
import type { Tribe } from '@pillage-first/types/models/tribe';
import type { Troop } from '@pillage-first/types/models/troop';
import { natureUnitIdSchema } from '@pillage-first/types/models/unit';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useVillageTroops } from 'app/(game)/(village-slug)/hooks/use-village-troops';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import { useDialog } from 'app/hooks/use-dialog';
import { useTroopSelectionForm } from '../hooks/use-troop-selection-form';
import type { BaseTroopFormValues } from '../utils/schema';
import { TroopMovementConfirmationContent } from './confirmation-modal';
import { TroopSelectionForm } from './troop-selection-form';

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
  const { returnReinforcements, returnSentReinforcements } = useVillageTroops();
  const targetTileId = mode === 'incoming' ? tileId : currentVillage.tileId;
  const {
    isOpen: isConfirmationStepOpen,
    openModal: openConfirmationStep,
    closeModal: closeConfirmationStep,
    modalArgs: confirmationStepData,
  } = useDialog<BaseTroopFormValues>();
  const { form, hasSelectedTroops, maxUnits } = useTroopSelectionForm({
    isOpen,
    tribe,
    troops,
    targetTileId,
  });
  const selectedConfirmationUnits =
    confirmationStepData.current?.units.filter(
      ({ selected }) => selected > 0,
    ) ?? [];
  const isReturningOnlyAnimals =
    selectedConfirmationUnits.length > 0 &&
    selectedConfirmationUnits.every(
      ({ unitId }) => natureUnitIdSchema.safeParse(unitId).success,
    );

  const onSubmit = ({ target, units }: BaseTroopFormValues) => {
    openConfirmationStep({
      target,
      units: units.map((unit) => ({
        ...unit,
        available: unit.selected,
      })),
    });
  };

  const onConfirmReturnAction = () => {
    const pendingReturnData = confirmationStepData.current;

    if (pendingReturnData?.target.tileId === undefined) {
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
            originTileId={mode === 'outgoing' ? tileId : undefined}
            backLabel={t('Back')}
            hideMovementDetails={isReturningOnlyAnimals}
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
            <TroopSelectionForm
              form={form}
              onSubmit={onSubmit}
              maxUnits={maxUnits}
              formClassName="space-y-4"
              isSubmitDisabled={!hasSelectedTroops}
              onCancel={onClose}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
