import { useTranslation } from 'react-i18next';
import type { Tile } from '@pillage-first/types/models/tile';
import { TroopMovementConfirmationContent } from 'app/(game)/(village-slug)/components/send-troops/components/confirmation-modal';
import { ReinforcementRelocationActionSelector } from 'app/(game)/(village-slug)/components/send-troops/components/reinforcement-relocation-action-selector';
import { SendTroopsModalContent } from 'app/(game)/(village-slug)/components/send-troops/components/send-troops-modal';
import { useFoundNewVillageTroopForm } from 'app/(game)/(village-slug)/components/send-troops/hooks/use-found-new-village-troop-form';
import { useReinforcementRelocationTroopForm } from 'app/(game)/(village-slug)/components/send-troops/hooks/use-reinforcement-relocation-troop-form';
import { Dialog, DialogContent } from 'app/components/ui/dialog';

export type MapSendTroopsAction = {
  mode: 'found-new-village' | 'reinforcement';
  isRelocationEnabled?: boolean;
  targetTileId: Tile['id'];
};

type MapSendTroopsModalProps = {
  action: MapSendTroopsAction | null;
  isOpen: boolean;
  onClose: () => void;
};

type FoundNewVillageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  targetTileId: Tile['id'];
};

const FoundNewVillageModal = ({
  isOpen,
  onClose,
  targetTileId,
}: FoundNewVillageModalProps) => {
  const { t } = useTranslation();
  const {
    closeConfirmationStep,
    disabledUnitTiers,
    form,
    formData,
    isConfirmationStepOpen,
    maxUnits,
    onConfirm,
    onFormSubmit,
    tribe,
  } = useFoundNewVillageTroopForm({ targetTileId, onSuccess: onClose });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent>
        {isConfirmationStepOpen && formData.current ? (
          <TroopMovementConfirmationContent
            onBack={closeConfirmationStep}
            onConfirm={onConfirm}
            formData={formData.current}
            title={t('Found a new village')}
            tribe={tribe}
            backLabel={t('Back')}
          />
        ) : (
          <SendTroopsModalContent
            onClose={onClose}
            onSubmit={onFormSubmit}
            title={t('Found a new village')}
            form={form}
            disabledUnitTiers={disabledUnitTiers}
            maxUnits={maxUnits}
            targetSelector="coordinates"
            isTargetSelectorDisabled
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

type ReinforceVillageModalProps = {
  isOpen: boolean;
  isRelocationEnabled?: boolean;
  onClose: () => void;
  targetTileId: Tile['id'];
};

const ReinforceVillageModal = ({
  isOpen,
  isRelocationEnabled = true,
  onClose,
  targetTileId,
}: ReinforceVillageModalProps) => {
  const { t } = useTranslation();
  const {
    closeConfirmationStep,
    form,
    formData,
    isConfirmationStepOpen,
    onConfirm,
    onFormSubmit,
    tribe,
  } = useReinforcementRelocationTroopForm({
    action: 'reinforcement',
    targetTileId,
    onSuccess: onClose,
  });
  const confirmationTitle =
    formData.current?.action === 'reinforcement'
      ? t('Reinforcement')
      : t('Relocation');

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent>
        {isConfirmationStepOpen && formData.current ? (
          <TroopMovementConfirmationContent
            onBack={closeConfirmationStep}
            onConfirm={onConfirm}
            formData={formData.current}
            title={confirmationTitle}
            tribe={tribe}
            backLabel={t('Back')}
          />
        ) : (
          <SendTroopsModalContent
            onClose={onClose}
            onSubmit={onFormSubmit}
            title={
              isRelocationEnabled
                ? t('Reinforce or relocate')
                : t('Reinforcement')
            }
            form={form}
            targetSelector="coordinates"
            isTargetSelectorDisabled
            extraContent={
              <ReinforcementRelocationActionSelector
                isRelocationEnabled={isRelocationEnabled}
              />
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export const MapSendTroopsModal = ({
  action,
  isOpen,
  onClose,
}: MapSendTroopsModalProps) => {
  if (!action) {
    return null;
  }

  const key = `${action.mode}-${action.targetTileId}-${action.isRelocationEnabled ?? true}`;

  if (action.mode === 'found-new-village') {
    return (
      <FoundNewVillageModal
        key={key}
        isOpen={isOpen}
        onClose={onClose}
        targetTileId={action.targetTileId}
      />
    );
  }

  return (
    <ReinforceVillageModal
      key={key}
      isOpen={isOpen}
      isRelocationEnabled={action.isRelocationEnabled}
      onClose={onClose}
      targetTileId={action.targetTileId}
    />
  );
};
