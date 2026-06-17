import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import { useSendResourcesForm } from '../hooks/use-send-resources-form';
import type { VillageOption } from '../utils/villages';
import {
  SendResourcesConfirmationStep,
  SendResourcesFormContent,
} from './send-resources-form';

type SendResourcesModalProps = {
  initialTargetVillage?: VillageOption;
  isOpen: boolean;
  isTargetVillageSelectorDisabled?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
};

export const SendResourcesModal = ({
  initialTargetVillage,
  isOpen,
  isTargetVillageSelectorDisabled = false,
  onClose,
  onSuccess,
  title,
}: SendResourcesModalProps) => {
  const formState = useSendResourcesForm({
    initialTargetVillage,
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
  });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent>
        {formState.isConfirmationOpen ? (
          <SendResourcesConfirmationStep
            formState={formState}
            onConfirm={onClose}
          />
        ) : (
          <SendResourcesFormContent
            formState={formState}
            header={
              title ? (
                <DialogHeader>
                  <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
              ) : null
            }
            isTargetVillageSelectorDisabled={isTargetVillageSelectorDisabled}
            onCancel={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
