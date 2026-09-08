import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { LuCircleAlert } from 'react-icons/lu';

type AlertVariant = 'warning' | 'error' | 'info' | 'success';

const variantStyles: Record<AlertVariant, { bg: string; text: string }> = {
  warning: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
  },
  error: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
  },
  info: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
  },
  success: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
  },
};

type AlertProps = {
  variant?: AlertVariant;
  children: ReactNode;
};

export const Alert = ({ variant = 'warning', children }: AlertProps) => {
  const { bg, text } = variantStyles[variant];

  return (
    <div
      className={clsx('flow-root rounded-lg p-2 text-sm sm:flex', text, bg)}
      role="alert"
    >
      <LuCircleAlert
        aria-hidden="true"
        className="float-left mr-3 mt-0.5 size-5 shrink-0 sm:float-none"
      />
      {children}
    </div>
  );
};
