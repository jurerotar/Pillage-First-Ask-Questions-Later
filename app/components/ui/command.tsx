import type React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { LuSearch } from 'react-icons/lu';
import clsx from 'clsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';

export const Command: React.FC<
  React.ComponentProps<typeof CommandPrimitive>
> = ({ className, ...props }) => {
  return (
    <CommandPrimitive
      data-slot="command"
      className={clsx(
        'bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md',
        className,
      )}
      {...props}
    />
  );
};

type CommandDialogProps = React.ComponentProps<typeof Dialog> & {
  title: string;
  description: string;
};

export const CommandDialog: React.FC<CommandDialogProps> = ({
  title,
  description,
  children,
  ...props
}) => {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent className="overflow-hidden p-0">
        <Command className="[&_[cmdk-group-heading]]:text-muted-foreground **:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export const CommandInput: React.FC<
  React.ComponentProps<typeof CommandPrimitive.Input>
> = ({ className, ...props }) => {
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex h-9 items-center gap-2 border-b px-3"
    >
      <LuSearch className="size-4 shrink-0 opacity-50" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={clsx(
          'placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    </div>
  );
};

export const CommandList: React.FC<
  React.ComponentProps<typeof CommandPrimitive.List>
> = ({ className, ...props }) => {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={clsx(
        'max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto',
        className,
      )}
      {...props}
    />
  );
};

export const CommandEmpty: React.FC<
  React.ComponentProps<typeof CommandPrimitive.Empty>
> = ({ ...props }) => {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="py-6 text-center text-sm"
      {...props}
    />
  );
};

export const CommandGroup: React.FC<
  React.ComponentProps<typeof CommandPrimitive.Group>
> = ({ className, ...props }) => {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={clsx(
        'text-foreground [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium',
        className,
      )}
      {...props}
    />
  );
};

export const CommandSeparator: React.FC<
  React.ComponentProps<typeof CommandPrimitive.Separator>
> = ({ className, ...props }) => {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={clsx('bg-border -mx-1 h-px', className)}
      {...props}
    />
  );
};

export const CommandItem: React.FC<
  React.ComponentProps<typeof CommandPrimitive.Item>
> = ({ className, ...props }) => {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={clsx(
        "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
};

export const CommandShortcut: React.FC<React.ComponentProps<'span'>> = ({
  className,
  ...props
}) => {
  return (
    <span
      data-slot="command-shortcut"
      className={clsx(
        'text-muted-foreground ml-auto text-xs tracking-widest',
        className,
      )}
      {...props}
    />
  );
};
