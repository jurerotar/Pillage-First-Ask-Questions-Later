import type { VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import type { ComponentProps } from 'react';
import { skeletonVariants } from 'app/components/ui/cvas/skeleton-cva';

type SkeletonProps = ComponentProps<'div'> &
  VariantProps<typeof skeletonVariants>;

export const Skeleton = ({ className, variant, ...props }: SkeletonProps) => {
  return (
    <div
      data-slot="skeleton"
      className={clsx(skeletonVariants({ variant }), className)}
      {...props}
    />
  );
};
