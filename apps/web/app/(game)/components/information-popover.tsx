import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { FaCircleInfo, FaXmark } from 'react-icons/fa6';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import {
  Popover,
  PopoverArrow,
  PopoverClose,
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
          <FaCircleInfo className="size-4 transition-colors" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className={clsx('w-80 max-w-[calc(100vw-2rem)] p-3', contentClassName)}
        side="bottom"
      >
        <PopoverArrow />
        <div className="flex items-start justify-between gap-2">
          <Text
            as="h4"
            className="text-xl font-medium"
          >
            {ariaLabel}
          </Text>
          <PopoverClose asChild>
            <Button
              aria-label="Close information popover"
              className="-mt-1 -mr-1"
              size="icon"
              variant="ghost"
            >
              <FaXmark className="size-4" />
            </Button>
          </PopoverClose>
        </div>
        {children}
      </PopoverContent>
    </Popover>
  );
};
