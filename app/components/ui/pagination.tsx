import type React from 'react';
import { LuChevronLeft, LuChevronRight, LuEllipsis } from 'react-icons/lu';
import { type Button, buttonVariants } from 'app/components/ui/button';
import clsx from 'clsx';

export const Pagination = ({
  className,
  ...props
}: React.ComponentProps<'nav'>) => {
  return (
    <nav
      aria-label="pagination"
      data-slot="pagination"
      className={clsx('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  );
};

export const PaginationContent = ({
  className,
  ...props
}: React.ComponentProps<'ul'>) => {
  return (
    <ul
      data-slot="pagination-content"
      className={clsx('flex flex-row items-center gap-1', className)}
      {...props}
    />
  );
};

export const PaginationItem = ({ ...props }: React.ComponentProps<'li'>) => {
  return (
    <li
      data-slot="pagination-item"
      {...props}
    />
  );
};

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, 'size'> &
  React.ComponentProps<'a'>;

export const PaginationLink = ({
  className,
  isActive,
  size = 'icon',
  ...props
}: PaginationLinkProps) => {
  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={clsx(
        buttonVariants({
          variant: isActive ? 'outline' : 'ghost',
          size,
        }),
        className,
      )}
      {...props}
    />
  );
};

export const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={clsx('gap-1 px-2.5 sm:pl-2.5', className)}
      {...props}
    >
      <LuChevronLeft />
      <span className="hidden sm:block">Previous</span>
    </PaginationLink>
  );
};

export const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={clsx('gap-1 px-2.5 sm:pr-2.5', className)}
      {...props}
    >
      <span className="hidden sm:block">Next</span>
      <LuChevronRight />
    </PaginationLink>
  );
};

export const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<'span'>) => {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={clsx('flex size-9 items-center justify-center', className)}
      {...props}
    >
      <LuEllipsis className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
};
