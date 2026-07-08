import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { FaCircleInfo } from 'react-icons/fa6';
import { Button } from 'app/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'app/components/ui/popover';

type InformationPopoverProps = {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export const InformationPopover = ({
  ariaLabel,
  children,
  className,
  contentClassName,
}: InformationPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label={ariaLabel}
          className={clsx('absolute top-0 right-0', className)}
          title={ariaLabel}
          variant="outline"
        >
          <FaCircleInfo className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className={clsx('w-80 max-w-[calc(100vw-2rem)] p-3', contentClassName)}
        side="bottom"
      >
        {children}
      </PopoverContent>
    </Popover>
  );
};
