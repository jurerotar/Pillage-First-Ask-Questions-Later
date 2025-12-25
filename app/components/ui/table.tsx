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
    className={clsx(
      'border border-border table-fixed min-w-full w-max',
      className,
    )}
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

type TableRowProps = HTMLAttributes<HTMLTableRowElement>;

export const TableRow = ({ className, ...props }: TableRowProps) => (
  <tr
    className={clsx(
      'border-b border-border last:border-0 transition-colors hover:bg-muted/50',
      className,
    )}
    {...props}
  />
);

type TableCellProps = TdHTMLAttributes<HTMLTableCellElement>;

export const TableCell = ({ className, ...props }: TableCellProps) => (
  <td
    className={clsx('p-2 text-center border-r last:border-r-0', className)}
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
