import type React from 'react';
import clsx from 'clsx';

type DividerProps = {
  orientation?: 'vertical' | 'horizontal';
};

export const Divider: React.FC<DividerProps> = ({ orientation = 'vertical' }) => {
  return <span className={clsx(orientation === 'vertical' ? 'flex w-1' : 'h-1 w-full', 'rounded-md bg-gray-300')} />;
};
