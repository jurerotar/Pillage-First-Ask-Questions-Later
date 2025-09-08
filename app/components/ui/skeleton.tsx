import clsx from 'clsx';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

const skeletonVariants = cva('animate-pulse rounded-md', {
  variants: {
    variant: {
      default: 'bg-gray-300',
      dark: 'bg-gray-700',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

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
