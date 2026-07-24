import { useTranslation } from 'react-i18next';
import type { Tile } from '@pillage-first/types/models/tile';
import { AttackOrRaidActionSelector } from 'app/(game)/(village-slug)/components/send-troops/components/attack-or-raid-action-selector';
import { TroopMovementConfirmationContent } from 'app/(game)/(village-slug)/components/send-troops/components/confirmation-modal';
import { SendTroopsModalContent } from 'app/(game)/(village-slug)/components/send-troops/components/send-troops-modal';
import { useAttackOrRaidForm } from 'app/(game)/(village-slug)/components/send-troops/hooks/use-attack-or-raid-form';
import { Dialog, DialogContent } from 'app/components/ui/dialog';

type AttackOrRaidModalProps = {
  isOpen: boolean;
  onClose: () => void;
  targetTileId: Tile['id'];
};

export const AttackOrRaidModal = ({
  isOpen,
  onClose,
  targetTileId,
}: AttackOrRaidModalProps) => {
  const { t } = useTranslation();
  const {
    closeConfirmationStep,
    disabledUnitTiers,
    form,
    formData,
    isConfirmationStepOpen,
    onConfirm,
    onFormSubmit,
    tribe,
  } = useAttackOrRaidForm({
    action: 'attack',
    targetTileId,
    onSuccess: onClose,
  });
  const confirmationTitle =
    formData.current?.action === 'attack' ? t('Attack') : t('Raid');

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
            title={t('Send troops')}
            form={form}
            disabledUnitTiers={disabledUnitTiers}
            targetSelector="coordinates"
            isTargetSelectorDisabled
            extraContent={<AttackOrRaidActionSelector />}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
