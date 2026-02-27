import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import type { ComponentProps } from 'react';

export const inputVariants = cva(
  'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex min-w-0 rounded-md border bg-transparent text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
  {
    variants: {
      size: {
        default: 'h-9 w-full px-3 py-1',
        fit: 'h-9 w-fit px-1',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

export type InputProps = ComponentProps<'input'> &
  VariantProps<typeof inputVariants>;

export const Input = ({ className, type, size, ...props }: InputProps) => {
  return (
    <input
      type={type}
      data-slot="input"
      className={clsx(inputVariants({ size, className }))}
      {...props}
    />
  );
};
