import type { VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import type { ComponentProps } from 'react';
import { buttonVariants } from 'app/components/ui/cvas/button-cva';

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants>;

export const Button = ({ className, variant, size, ...props }: ButtonProps) => {
  return (
    <button
      data-slot="button"
      type="button"
      className={clsx(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
};
