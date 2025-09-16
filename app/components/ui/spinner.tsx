import type { PropsWithChildren } from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { LuLoaderCircle } from 'react-icons/lu';
import { clsx } from 'clsx';

const spinnerVariants = cva(
  'flex-col items-center justify-center text-gray-200',
  {
    variants: {
      show: {
        true: 'flex',
        false: 'hidden',
      },
    },
    defaultVariants: {
      show: true,
    },
  },
);

const loaderVariants = cva('animate-spin text-gray-200', {
  variants: {
    size: {
      small: 'size-6',
      medium: 'size-8',
      large: 'size-12',
    },
  },
  defaultVariants: {
    size: 'medium',
  },
});

type SpinnerContentProps = VariantProps<typeof spinnerVariants> &
  VariantProps<typeof loaderVariants> & {
    className?: string;
  };

export const Spinner = ({
  size,
  show,
  children,
  className,
}: PropsWithChildren<SpinnerContentProps>) => {
  return (
    <span className={spinnerVariants({ show })}>
      <LuLoaderCircle className={clsx(loaderVariants({ size }), className)} />
      {children}
    </span>
  );
};
