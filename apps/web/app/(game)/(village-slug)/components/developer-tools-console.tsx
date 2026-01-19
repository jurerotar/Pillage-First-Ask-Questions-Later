import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { VscTerminal } from 'react-icons/vsc';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';

export const DeveloperToolsButton = ({
  className,
  ...props
}: ComponentProps<'span'>) => {
  const { preferences } = usePreferences();

  if (!preferences.isDeveloperToolsConsoleEnabled) {
    return null;
  }

  return (
    <span
      className={className}
      {...props}
    >
      <VscTerminal className="text-inherit size-full" />
    </span>
  );
};

interface DevToolsConsoleProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeveloperToolsConsole = ({
  isOpen,
  onOpenChange,
}: DevToolsConsoleProps) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Developer tools')}</DialogTitle>
          <DialogDescription>
            {t('Specialized developer tools and debug information.')}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            {t('Console content will be implemented here.')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
