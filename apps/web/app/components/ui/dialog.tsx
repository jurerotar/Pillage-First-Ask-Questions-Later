import { Dialog as DialogPrimitive } from '@base-ui/react';
import { clsx } from 'clsx';
import {
  type ComponentProps,
  createContext,
  isValidElement,
  useContext,
  useLayoutEffect,
  useRef,
} from 'react';
import { LuX } from 'react-icons/lu';

type DismissHandlers = {
  onEscapeKeyDown?: (event: Event) => void;
  onInteractOutside?: (event: Event) => void;
};
const DismissContext = createContext<{ current: DismissHandlers } | null>(null);

export const Dialog = ({
  onOpenChange,
  ...props
}: ComponentProps<typeof DialogPrimitive.Root>) => {
  const handlers = useRef<DismissHandlers>({});
  return (
    <DismissContext value={handlers}>
      <DialogPrimitive.Root
        onOpenChange={(open, details) => {
          const event = new Event('dismiss', { cancelable: true });
          if (!open && details.reason === 'escape-key') {
            handlers.current.onEscapeKeyDown?.(event);
          }
          if (
            !open &&
            (details.reason === 'outside-press' ||
              details.reason === 'focus-out')
          ) {
            handlers.current.onInteractOutside?.(event);
          }
          if (event.defaultPrevented) {
            details.cancel();
            return;
          }
          onOpenChange?.(open, details);
        }}
        data-slot="dialog"
        {...props}
      />
    </DismissContext>
  );
};

export const DialogTrigger = ({
  asChild,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Trigger> & { asChild?: boolean }) => {
  return (
    <DialogPrimitive.Trigger
      data-slot="dialog-trigger"
      render={asChild && isValidElement(children) ? children : undefined}
      {...props}
    >
      {asChild ? undefined : children}
    </DialogPrimitive.Trigger>
  );
};

export const DialogPortal = ({
  ...props
}: ComponentProps<typeof DialogPrimitive.Portal>) => {
  return (
    <DialogPrimitive.Portal
      data-slot="dialog-portal"
      {...props}
    />
  );
};

export const DialogClose = ({
  ...props
}: ComponentProps<typeof DialogPrimitive.Close>) => {
  return (
    <DialogPrimitive.Close
      data-slot="dialog-close"
      {...props}
    >
      <LuX className="size-4" />
    </DialogPrimitive.Close>
  );
};

export const DialogOverlay = ({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Backdrop>) => {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={clsx(
        'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 fixed inset-0 z-50 bg-black/50',
        className,
      )}
      {...props}
    />
  );
};

type DialogContentProps = ComponentProps<typeof DialogPrimitive.Popup> & {
  closeDisabled?: boolean;
  onEscapeKeyDown?: (event: Event) => void;
  onInteractOutside?: (event: Event) => void;
};

export const DialogContent = ({
  className,
  children,
  closeDisabled = false,
  onEscapeKeyDown,
  onInteractOutside,
  ...props
}: DialogContentProps) => {
  const handlers = useContext(DismissContext);
  useLayoutEffect(() => {
    if (handlers) {
      handlers.current = { onEscapeKeyDown, onInteractOutside };
    }
    return () => {
      if (handlers) {
        handlers.current = {};
      }
    };
  }, [handlers, onEscapeKeyDown, onInteractOutside]);
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={clsx(
          'bg-background data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-1rem)] max-h-[calc(100dvh-1rem)] overflow-y-auto translate-x-[-50%] translate-y-[-50%] gap-4 rounded-xs border p-4 shadow-lg sm:max-w-lg',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          disabled={closeDisabled}
          className="ring-offset-background focus:ring-ring data-open:bg-accent data-open:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
        >
          <span className="sr-only">Close</span>
          <LuX className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
};

export const DialogHeader = ({
  className,
  ...props
}: ComponentProps<'div'>) => {
  return (
    <div
      data-slot="dialog-header"
      className={clsx('flex flex-col gap-2 text-left', className)}
      {...props}
    />
  );
};

export const DialogFooter = ({
  className,
  ...props
}: ComponentProps<'div'>) => {
  return (
    <div
      data-slot="dialog-footer"
      className={clsx('flex gap-2 flex-row justify-end', className)}
      {...props}
    />
  );
};

export const DialogTitle = ({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>) => {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={clsx('text-lg leading-none font-semibold', className)}
      {...props}
    />
  );
};

export const DialogDescription = ({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) => {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={clsx('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
};
