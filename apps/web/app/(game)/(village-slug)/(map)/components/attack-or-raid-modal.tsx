import { useTranslation } from 'react-i18next';
import type { Tile } from '@pillage-first/types/models/tile';
import type { Tribe } from '@pillage-first/types/models/tribe';
import { AttackOrRaidActionSelector } from 'app/(game)/(village-slug)/components/send-troops/components/attack-or-raid-action-selector';
import {
  AttackOrRaidCatapultTargetOptions,
  AttackOrRaidConfirmationOptions,
} from 'app/(game)/(village-slug)/components/send-troops/components/attack-or-raid-confirmation-options';
import { TroopMovementConfirmationContent } from 'app/(game)/(village-slug)/components/send-troops/components/confirmation-modal';
import { SendTroopsModalContent } from 'app/(game)/(village-slug)/components/send-troops/components/send-troops-modal';
import { useAttackOrRaidForm } from 'app/(game)/(village-slug)/components/send-troops/hooks/use-attack-or-raid-form';
import { Dialog, DialogContent } from 'app/components/ui/dialog';

type AttackOrRaidTarget = {
  tileId: Tile['id'];
  tribe?: Tribe;
  isUnoccupiedOasis?: boolean;
};

type AttackOrRaidModalProps = {
  action?: 'attack' | 'raid';
  isActionSelectionEnabled?: boolean;
  isOpen: boolean;
  onClose: () => void;
  target: AttackOrRaidTarget;
};

export const AttackOrRaidModal = ({
  action = 'attack',
  isActionSelectionEnabled = true,
  isOpen,
  onClose,
  target,
}: AttackOrRaidModalProps) => {
  const { t } = useTranslation();
  const {
    catapultTargetBuildingIds,
    closeConfirmationStep,
    confirmationOption,
    disabledUnitTiers,
    form,
    formData,
    isConfirmDisabled,
    isConfirmationStepOpen,
    onConfirm,
    onFormSubmit,
    tribe,
  } = useAttackOrRaidForm({
    action,
    targetTileId: target.tileId,
    targetTribe: target.tribe,
    isTargetUnoccupiedOasis: target.isUnoccupiedOasis,
    onSuccess: onClose,
  });

  const confirmationTitle =
    formData.current?.action === 'attack' ? t('Attack') : t('Raid');

  const unitTableDetails =
    confirmationOption?.type === 'catapultTargets' ? (
      <AttackOrRaidCatapultTargetOptions
        catapultTargetBuildingIds={catapultTargetBuildingIds}
        form={form}
        targetCount={confirmationOption.targetCount}
      />
    ) : confirmationOption ? (
      <AttackOrRaidConfirmationOptions
        confirmationOption={confirmationOption}
        form={form}
      />
    ) : undefined;

  const unitTableDetailsLabel =
    confirmationOption?.type === 'catapultTargets' ||
    confirmationOption?.type === 'scoutingTarget'
      ? t('Target')
      : confirmationOption?.type === 'heroOasisAnimalAction'
        ? t('Action')
        : undefined;

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
            isConfirmDisabled={isConfirmDisabled}
            unitTableDetails={unitTableDetails}
            unitTableDetailsLabel={unitTableDetailsLabel}
          />
        ) : (
          <SendTroopsModalContent
            onClose={onClose}
            onSubmit={onFormSubmit}
            title={t('Send troops')}
            form={form}
            units={{
              disabledUnitTiers,
            }}
            target={{
              selector: 'coordinates',
              isDisabled: true,
              extraContent: (
                <AttackOrRaidActionSelector
                  isDisabled={!isActionSelectionEnabled}
                />
              ),
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
