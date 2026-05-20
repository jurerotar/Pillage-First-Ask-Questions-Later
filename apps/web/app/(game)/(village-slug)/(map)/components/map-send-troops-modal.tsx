import { useTranslation } from 'react-i18next';
import type { Coordinates } from '@pillage-first/types/models/coordinates';
import { TroopMovementConfirmationContent } from 'app/(game)/(village-slug)/components/send-troops/components/confirmation-modal';
import { ReinforcementRelocationActionSelector } from 'app/(game)/(village-slug)/components/send-troops/components/reinforcement-relocation-action-selector';
import { SendTroopsModalContent } from 'app/(game)/(village-slug)/components/send-troops/components/send-troops-modal';
import { useFoundNewVillageTroopForm } from 'app/(game)/(village-slug)/components/send-troops/hooks/use-found-new-village-troop-form';
import { useReinforcementRelocationTroopForm } from 'app/(game)/(village-slug)/components/send-troops/hooks/use-reinforcement-relocation-troop-form';
import { Dialog, DialogContent } from 'app/components/ui/dialog';

export type MapSendTroopsAction = {
  mode: 'found-new-village' | 'reinforcement';
  target: Coordinates;
};

type MapSendTroopsModalProps = {
  action: MapSendTroopsAction | null;
  isOpen: boolean;
  onClose: () => void;
};

type FoundNewVillageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  target: Coordinates;
};

const FoundNewVillageModal = ({
  isOpen,
  onClose,
  target,
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
  } = useFoundNewVillageTroopForm({ target, onSuccess: onClose });

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
            tribe={tribe}
            form={form}
            disabledUnitTiers={disabledUnitTiers}
            maxUnits={maxUnits}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

type ReinforceVillageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  target: Coordinates;
};

const ReinforceVillageModal = ({
  isOpen,
  onClose,
  target,
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
    target,
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
            title={t('Reinforce or relocate')}
            tribe={tribe}
            form={form}
            targetSelector="coordinates"
            isTargetSelectorDisabled
            extraContent={<ReinforcementRelocationActionSelector />}
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

  const key = `${action.mode}-${action.target.x}-${action.target.y}`;

  if (action.mode === 'found-new-village') {
    return (
      <FoundNewVillageModal
        key={key}
        isOpen={isOpen}
        onClose={onClose}
        target={action.target}
      />
    );
  }

  return (
    <ReinforceVillageModal
      key={key}
      isOpen={isOpen}
      onClose={onClose}
      target={action.target}
    />
  );
};
