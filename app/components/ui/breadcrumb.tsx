import type { ComponentProps } from 'react';
import clsx from 'clsx';
import { Link } from 'react-router';
import { LuChevronRight } from 'react-icons/lu';

export const Breadcrumb = (props: ComponentProps<'nav'>) => {
  return (
    <nav
      aria-label="breadcrumb"
      data-slot="breadcrumb"
      {...props}
    />
  );
};

export const BreadcrumbList = ({
  className,
  ...props
}: ComponentProps<'ol'>) => {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={clsx(
        'text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5',
        className,
      )}
      {...props}
    />
  );
};

export const BreadcrumbItem = ({
  className,
  ...props
}: ComponentProps<'li'>) => {
  return (
    <li
      data-slot="breadcrumb-item"
      className={clsx('inline-flex items-center gap-1.5', className)}
      {...props}
    />
  );
};

export const BreadcrumbLink = ({
  className,
  ...props
}: ComponentProps<typeof Link>) => {
  return (
    <Link
      data-slot="breadcrumb-link"
      className={clsx(
        'hover:text-foreground transition-colors underline',
        className,
      )}
      {...props}
    />
  );
};

export const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: ComponentProps<'li'>) => {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={clsx(className, 'inline-flex items-center')}
      {...props}
    >
      {children ?? <LuChevronRight className="size-3.5 inline-flex" />}
    </li>
  );
};
