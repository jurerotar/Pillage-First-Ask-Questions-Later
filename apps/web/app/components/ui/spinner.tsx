import type { VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import type { PropsWithChildren } from 'react';
import { LuLoaderCircle } from 'react-icons/lu';
import {
  loaderVariants,
  spinnerVariants,
} from 'app/components/ui/cvas/spinner-cva';

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
