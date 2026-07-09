import { clsx } from 'clsx';
import type { PropsWithChildren } from 'react';

type BuildingLayoutProps = PropsWithChildren<{
  className?: string;
}>;

export const Section = ({ children, className }: BuildingLayoutProps) => {
  return (
    <div className={clsx('relative flex flex-col gap-4', className)}>
      {children}
    </div>
  );
};

export const SectionContent = ({
  children,
  className,
}: BuildingLayoutProps) => {
  return (
    <div className={clsx('flex flex-col gap-2 relative', className)}>
      {children}
    </div>
  );
};
