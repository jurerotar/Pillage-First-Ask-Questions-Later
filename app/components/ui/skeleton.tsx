import type React from 'react';
import clsx from 'clsx';
import { cva, type VariantProps } from 'class-variance-authority';

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

type SkeletonProps = React.ComponentProps<'div'> &
  VariantProps<typeof skeletonVariants>;

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant,
  ...props
}) => {
  return (
    <div
      data-slot="skeleton"
      className={clsx(skeletonVariants({ variant }), className)}
      {...props}
    />
  );
};
