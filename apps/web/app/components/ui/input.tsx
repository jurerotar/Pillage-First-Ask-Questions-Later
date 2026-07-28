import type { VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import type { ComponentProps } from 'react';
import { inputVariants } from 'app/components/ui/cvas/input-cva';

export type InputProps = ComponentProps<'input'> &
  VariantProps<typeof inputVariants>;

export const Input = ({
  className,
  type,
  size,
  hideSpinner,
  ...props
}: InputProps) => {
  return (
    <input
      type={type}
      data-slot="input"
      className={clsx(inputVariants({ size, hideSpinner, className }))}
      {...props}
    />
  );
};
