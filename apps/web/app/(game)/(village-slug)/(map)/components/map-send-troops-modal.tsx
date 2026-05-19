import { useTranslation } from 'react-i18next';
import type { Coordinates } from '@pillage-first/types/models/coordinates';
import { TroopMovementConfirmationModal } from 'app/(game)/(village-slug)/components/send-troops/components/confirmation-modal';
import { SendTroopsModal } from 'app/(game)/(village-slug)/components/send-troops/components/send-troops-modal';
import { useFoundNewVillageTroopForm } from 'app/(game)/(village-slug)/components/send-troops/hooks/use-found-new-village-troop-form';
import { useReinforcementRelocationTroopForm } from 'app/(game)/(village-slug)/components/send-troops/hooks/use-reinforcement-relocation-troop-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from 'app/components/ui/form';
import { RadioGroup, RadioGroupItem } from 'app/components/ui/radio-group';

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
    closeConfirmationModal,
    disabledUnitTiers,
    form,
    formData,
    isConfirmationModalOpen,
    maxUnits,
    onConfirm,
    onFormSubmit,
    tribe,
  } = useFoundNewVillageTroopForm({ target, onSuccess: onClose });

  return (
    <>
      <SendTroopsModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={onFormSubmit}
        title={t('Found a new village')}
        tribe={tribe}
        form={form}
        disabledUnitTiers={disabledUnitTiers}
        maxUnits={maxUnits}
      />

      {formData.current && (
        <TroopMovementConfirmationModal
          isOpen={isConfirmationModalOpen}
          onClose={closeConfirmationModal}
          onConfirm={onConfirm}
          formData={formData.current}
          title={t('Found a new village')}
          tribe={tribe}
        />
      )}
    </>
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
    closeConfirmationModal,
    form,
    formData,
    isConfirmationModalOpen,
    onConfirm,
    onFormSubmit,
    tribe,
  } = useReinforcementRelocationTroopForm({
    action: 'reinforcement',
    target,
    onSuccess: onClose,
  });

  return (
    <>
      <SendTroopsModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={onFormSubmit}
        title={t('Reinforce or relocate')}
        tribe={tribe}
        form={form}
        targetSelector="coordinates"
        isTargetSelectorDisabled
        extraContent={
          <FormField
            control={form.control}
            name="action"
            render={({ field }) => (
              <FormItem className="space-y-2 border-l dark:border-border pl-4">
                <FormLabel>{t('Action')}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-2"
                  >
                    <FormItem className="flex items-center space-x-4 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="reinforcement" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {t('Reinforcement')}
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-4 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="relocation" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {t('Relocation')}
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />
        }
      />

      {formData.current && (
        <TroopMovementConfirmationModal
          isOpen={isConfirmationModalOpen}
          onClose={closeConfirmationModal}
          onConfirm={onConfirm}
          formData={formData.current}
          title={
            formData.current.action === 'reinforcement'
              ? t('Reinforcement')
              : t('Relocation')
          }
          tribe={tribe}
        />
      )}
    </>
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
