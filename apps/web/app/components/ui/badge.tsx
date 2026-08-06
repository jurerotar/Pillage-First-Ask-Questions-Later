import type { VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import type { ComponentProps } from 'react';
import { badgeVariants } from 'app/components/ui/cvas/badge-cva';

type BadgeProps = ComponentProps<'span'> & VariantProps<typeof badgeVariants>;

export const Badge = ({ className, variant, ...props }: BadgeProps) => {
  return (
    <span
      data-slot="badge"
      className={clsx(badgeVariants({ variant }), className)}
      {...props}
    />
  );
};
