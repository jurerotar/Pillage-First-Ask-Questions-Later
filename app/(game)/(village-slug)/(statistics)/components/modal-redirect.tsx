import {
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  Dialog,
} from 'app/components/ui/dialog';
import { useDialog } from 'app/hooks/use-dialog';
import { useNavigate } from 'react-router';

interface ModalRedirectProps {
  content: {
    title: string;
    description: string;
    text: string;
  };
}

export const ModalRedirect: React.FC<ModalRedirectProps> = ({ content }) => {
  const { isOpen } = useDialog<number>(true);
  const { title, description, text } = content;
  const navigate = useNavigate();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        navigate(-1);
      }}
    >
      <DialogPortal>
        <DialogOverlay />
        <DialogContent>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-red-500">
            {description}
          </DialogDescription>
          <p>{text}</p>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};
