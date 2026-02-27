import { Dialog as DialogPrimitive } from '@base-ui/react';
import { clsx } from 'clsx';
import type { ComponentProps } from 'react';
import { LuX } from 'react-icons/lu';

export const Dialog = (props: DialogPrimitive.Root.Props) => {
  return <DialogPrimitive.Root {...props} />;
};

export const DialogTrigger = (props: DialogPrimitive.Trigger.Props) => {
  return (
    <DialogPrimitive.Trigger
      data-slot="dialog-trigger"
      {...props}
    />
  );
};

export const DialogPortal = (props: DialogPrimitive.Portal.Props) => {
  return <DialogPrimitive.Portal {...props} />;
};

export const DialogClose = (props: DialogPrimitive.Close.Props) => {
  return (
    <DialogPrimitive.Close
      data-slot="dialog-close"
      {...props}
    >
      <LuX className="size-4" />
    </DialogPrimitive.Close>
  );
};

export const DialogBackdrop = ({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) => {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={clsx(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        className,
      )}
      {...props}
    />
  );
};

export const DialogContent = ({
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props) => {
  return (
    <DialogPrimitive.Portal>
      <DialogBackdrop />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={clsx(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-1rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-xs border p-4 shadow-lg duration-200 sm:max-w-lg',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
          <span className="sr-only">Close</span>
          <LuX className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
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
      className={clsx(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  );
};

export const DialogTitle = ({
  className,
  ...props
}: DialogPrimitive.Title.Props) => {
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
}: DialogPrimitive.Description.Props) => {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={clsx('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
};
