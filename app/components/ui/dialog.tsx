import type React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from 'app/utils/tailwind';
import { LuX } from 'react-icons/lu';

export const Dialog: React.FC<React.ComponentProps<typeof DialogPrimitive.Root>> = ({ ...props }) => {
  return (
    <DialogPrimitive.Root
      data-slot="dialog"
      {...props}
    />
  );
};

export const DialogTrigger: React.FC<React.ComponentProps<typeof DialogPrimitive.Trigger>> = ({ ...props }) => {
  return (
    <DialogPrimitive.Trigger
      data-slot="dialog-trigger"
      {...props}
    />
  );
};

export const DialogPortal: React.FC<React.ComponentProps<typeof DialogPrimitive.Portal>> = ({ ...props }) => {
  return (
    <DialogPrimitive.Portal
      data-slot="dialog-portal"
      {...props}
    />
  );
};

export const DialogClose: React.FC<React.ComponentProps<typeof DialogPrimitive.Close>> = ({ ...props }) => {
  return (
    <DialogPrimitive.Close
      data-slot="dialog-close"
      {...props}
    >
      <LuX className="size-4" />
    </DialogPrimitive.Close>
  );
};

export const DialogOverlay: React.FC<React.ComponentProps<typeof DialogPrimitive.Overlay>> = ({ className, ...props }) => {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        className,
      )}
      {...props}
    />
  );
};

export const DialogContent: React.FC<React.ComponentProps<typeof DialogPrimitive.Content>> = ({ className, children, ...props }) => {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
};

export const DialogHeader: React.FC<React.ComponentProps<'div'>> = ({ className, ...props }) => {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  );
};

export const DialogFooter: React.FC<React.ComponentProps<'div'>> = ({ className, ...props }) => {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
};

export const DialogTitle: React.FC<React.ComponentProps<typeof DialogPrimitive.Title>> = ({ className, ...props }) => {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-lg leading-none font-semibold', className)}
      {...props}
    />
  );
};

export const DialogDescription: React.FC<React.ComponentProps<typeof DialogPrimitive.Description>> = ({ className, ...props }) => {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
};
