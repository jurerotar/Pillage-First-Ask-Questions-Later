import type React from 'react';
import { clsx } from 'clsx';

type TableProps = React.TableHTMLAttributes<HTMLTableElement>;

export const Table: React.FC<TableProps> = ({ className, ...props }) => (
  <table
    className={clsx('border border-border table-fixed min-w-full w-max', className)}
    {...props}
  />
);

type TableHeaderProps = React.HTMLAttributes<HTMLTableSectionElement> & {
  sticky?: boolean;
};

export const TableHeader: React.FC<TableHeaderProps> = ({ className, sticky, ...props }) => (
  <thead
    className={clsx('bg-muted/50 border-b border-border', sticky && 'sticky top-0', className)}
    {...props}
  />
);

type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>;

export const TableBody: React.FC<TableBodyProps> = ({ className, ...props }) => (
  <tbody
    className={clsx(className)}
    {...props}
  />
);

type TableRowProps = React.HTMLAttributes<HTMLTableRowElement>;

export const TableRow: React.FC<TableRowProps> = ({ className, ...props }) => (
  <tr
    className={clsx('border-b border-border last:border-0 transition-colors hover:bg-muted/50', className)}
    {...props}
  />
);

type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>;

export const TableCell: React.FC<TableCellProps> = ({ className, ...props }) => (
  <td
    className={clsx('p-2 text-center border-r last:border-r-0', className)}
    {...props}
  />
);

type TableHeaderCellProps = React.ThHTMLAttributes<HTMLTableCellElement>;

export const TableHeaderCell: React.FC<TableHeaderCellProps> = ({ className, ...props }) => (
  <th
    className={clsx('p-2 font-medium text-center border-r last:border-r-0', className)}
    {...props}
  />
);
