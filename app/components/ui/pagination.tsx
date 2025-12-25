import { clsx } from 'clsx';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { LuChevronLeft, LuChevronRight, LuEllipsis } from 'react-icons/lu';
import type { usePagination } from 'app/(game)/(village-slug)/hooks/use-pagination';
import { type Button, buttonVariants } from 'app/components/ui/button';

export const PaginationWrapper = ({
  className,
  ...props
}: ComponentProps<'nav'>) => {
  return (
    <nav
      aria-label="pagination"
      data-slot="pagination"
      className={clsx(className)}
      {...props}
    />
  );
};

export const PaginationContent = ({
  className,
  ...props
}: ComponentProps<'ul'>) => {
  return (
    <ul
      data-slot="pagination-content"
      className={clsx('flex flex-row items-center gap-1', className)}
      {...props}
    />
  );
};

export const PaginationItem = (props: ComponentProps<'li'>) => {
  return (
    <li
      data-slot="pagination-item"
      {...props}
    />
  );
};

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<ComponentProps<typeof Button>, 'size'> &
  ComponentProps<'button'>;

export const PaginationLink = ({
  className,
  isActive,
  size = 'icon',
  ...props
}: PaginationLinkProps) => {
  return (
    <button
      type="button"
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
}: ComponentProps<typeof PaginationLink>) => {
  const { t } = useTranslation();

  return (
    <PaginationLink
      aria-label={t('Go to previous page')}
      size="default"
      className={clsx('gap-1 px-2.5 sm:pl-2.5', className)}
      {...props}
    >
      <LuChevronLeft />
    </PaginationLink>
  );
};

export const PaginationNext = ({
  className,
  ...props
}: ComponentProps<typeof PaginationLink>) => {
  const { t } = useTranslation();

  return (
    <PaginationLink
      aria-label={t('Go to next page')}
      size="default"
      className={clsx('gap-1 px-2.5 sm:pr-2.5', className)}
      {...props}
    >
      <LuChevronRight />
    </PaginationLink>
  );
};

export const PaginationEllipsis = ({
  className,
  ...props
}: ComponentProps<'span'>) => {
  const { t } = useTranslation();

  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={clsx('flex size-9 items-center justify-center', className)}
      {...props}
    >
      <LuEllipsis className="size-4" />
      <span className="sr-only">{t('More pages')}</span>
    </span>
  );
};

type PaginationProps = ReturnType<typeof usePagination>;

export const Pagination = (props: PaginationProps) => {
  const {
    pageCount,
    isPaginationNextEnabled,
    isPaginationPreviousEnabled,
    paginationElements,
    setPage,
    page,
  } = props;

  const { t } = useTranslation();

  return (
    <PaginationWrapper>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            aria-label={t('Previous')}
            {...(isPaginationPreviousEnabled && {
              onClick: () => setPage((p) => Math.max(1, p - 1)),
            })}
          />
        </PaginationItem>

        {paginationElements.map((p) =>
          typeof p === 'number' ? (
            <PaginationItem key={p}>
              <PaginationLink
                isActive={p === page}
                onClick={() => setPage(p)}
                aria-label={t('Page {{n}}', { n: p })}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationEllipsis />
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            aria-label={t('Next')}
            {...(isPaginationNextEnabled && {
              onClick: () => setPage((p) => Math.min(pageCount, p + 1)),
            })}
          />
        </PaginationItem>
      </PaginationContent>
    </PaginationWrapper>
  );
};
