import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';

type TableProps = TableHTMLAttributes<HTMLTableElement>;

export const Table = ({ className, ...props }: TableProps) => (
  <table
    className={clsx('border border-border table-fixed min-w-full', className)}
    {...props}
  />
);

type TableHeaderProps = HTMLAttributes<HTMLTableSectionElement> & {
  sticky?: boolean;
};

export const TableHeader = ({
  className,
  sticky,
  ...props
}: TableHeaderProps) => (
  <thead
    className={clsx(
      'bg-muted/50 border-b border-border',
      sticky && 'sticky top-0',
      className,
    )}
    {...props}
  />
);

type TableBodyProps = HTMLAttributes<HTMLTableSectionElement>;

export const TableBody = ({ className, ...props }: TableBodyProps) => (
  <tbody
    className={className}
    {...props}
  />
);

export const tableRowVariants = cva('transition-colors hover:bg-muted/50 ', {
  variants: {
    border: {
      true: 'border-b border-border last:border-0',
    },
  },
  defaultVariants: {
    border: true,
  },
});

type TableRowProps = HTMLAttributes<HTMLTableRowElement> &
  VariantProps<typeof tableRowVariants>;

export const TableRow = ({ className, border, ...props }: TableRowProps) => (
  <tr
    className={clsx(tableRowVariants({ className, border }))}
    {...props}
  />
);

export const tableCellVariants = cva('text-center', {
  variants: {
    variant: {
      default: 'p-2 ',
      wide: 'py-2 px-1',
    },
    border: {
      true: 'border-r last:border-r-0',
    },
  },
  defaultVariants: {
    variant: 'default',
    border: true,
  },
});

type TableCellProps = TdHTMLAttributes<HTMLTableCellElement> &
  VariantProps<typeof tableCellVariants>;

export const TableCell = ({
  className,
  variant,
  border,
  ...props
}: TableCellProps) => (
  <td
    className={clsx(tableCellVariants({ className, variant, border }))}
    {...props}
  />
);

type TableHeaderCellProps = ThHTMLAttributes<HTMLTableCellElement>;

export const TableHeaderCell = ({
  className,
  ...props
}: TableHeaderCellProps) => (
  <th
    className={clsx(
      'p-2 font-medium text-center border-r last:border-r-0',
      className,
    )}
    {...props}
  />
);
