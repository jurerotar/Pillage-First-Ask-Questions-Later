import type React from 'react';
import { Slot } from 'radix-ui';
import { LuChevronRight } from 'react-icons/lu';
import { cn } from 'app/utils/tailwind';

export const Breadcrumb: React.FC<React.ComponentProps<'nav'>> = ({ ...props }) => {
  return (
    <nav
      aria-label="breadcrumb"
      data-slot="breadcrumb"
      {...props}
    />
  );
};

export const BreadcrumbList: React.FC<React.ComponentProps<'ol'>> = ({ className, ...props }) => {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn('text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5', className)}
      {...props}
    />
  );
};

export const BreadcrumbItem: React.FC<React.ComponentProps<'li'>> = ({ className, ...props }) => {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn('inline-flex items-center gap-1.5', className)}
      {...props}
    />
  );
};

type BreadcrumbLinkProps = React.ComponentProps<'a'> & {
  asChild?: boolean;
};

export const BreadcrumbLink: React.FC<BreadcrumbLinkProps> = ({ asChild, className, ...props }) => {
  const Comp = asChild ? Slot.Root : 'a';

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn('hover:text-foreground transition-colors', className)}
      {...props}
    />
  );
};

export const BreadcrumbPage: React.FC<React.ComponentProps<'span'>> = ({ className, ...props }) => {
  return (
    // biome-ignore lint/a11y/useFocusableInteractive: TODO: Fix when you can
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn('text-foreground font-normal', className)}
      {...props}
    />
  );
};

export const BreadcrumbSeparator: React.FC<React.ComponentProps<'li'>> = ({ children, className, ...props }) => {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn('[&>svg]:size-3.5', className)}
      {...props}
    >
      {children ?? <LuChevronRight />}
    </li>
  );
};
