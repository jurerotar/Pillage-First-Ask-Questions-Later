import { Dialog, DialogContent } from 'app/components/ui/dialog';
import type { VillageOption } from '../utils/villages';
import { SendResourcesForm } from './send-resources-form';

type SendResourcesModalProps = {
  initialTargetVillage?: VillageOption;
  isOpen: boolean;
  isTargetVillageSelectorDisabled?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
};

export const SendResourcesModal = ({
  isOpen,
  onClose,
  onSuccess,
  ...props
}: SendResourcesModalProps) => {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent>
        <SendResourcesForm
          isDialogContent
          onCancel={onClose}
          onSuccess={() => {
            onSuccess?.();
            onClose();
          }}
          {...props}
        />
      </DialogContent>
    </Dialog>
  );
};
