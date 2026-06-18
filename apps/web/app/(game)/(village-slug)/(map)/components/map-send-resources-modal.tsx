import { useTranslation } from 'react-i18next';
import { SendResourcesModal } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/marketplace/components/send-resources-modal';
import type { VillageOption } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/marketplace/utils/villages';

export type MapSendResourcesAction = {
  targetVillage: VillageOption;
};

type MapSendResourcesModalProps = {
  action: MapSendResourcesAction | null;
  isOpen: boolean;
  onClose: () => void;
};

export const MapSendResourcesModal = ({
  action,
  isOpen,
  onClose,
}: MapSendResourcesModalProps) => {
  const { t } = useTranslation();

  if (!action) {
    return null;
  }

  return (
    <SendResourcesModal
      key={action.targetVillage.id}
      isOpen={isOpen}
      onClose={onClose}
      title={t('Send resources')}
      initialTargetVillage={action.targetVillage}
      isTargetVillageSelectorDisabled
    />
  );
};
