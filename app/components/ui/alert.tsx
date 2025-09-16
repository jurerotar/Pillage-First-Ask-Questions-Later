import { clsx } from 'clsx';
import type { ReactNode } from 'react';

type AlertVariant = 'warning' | 'error' | 'info' | 'success';

const variantStyles: Record<AlertVariant, { bg: string; text: string }> = {
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  error: { bg: 'bg-red-100', text: 'text-red-700' },
  info: { bg: 'bg-blue-100', text: 'text-blue-700' },
  success: { bg: 'bg-green-100', text: 'text-green-700' },
};

const AlertIcon = () => (
  <svg
    className="w-5 h-5 inline mr-3 flex-shrink-0"
    fill="currentColor"
    viewBox="0 0 20 20"
    height={20}
    width={20}
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Alert</title>
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
      clipRule="evenodd"
    />
  </svg>
);

type AlertProps = {
  variant?: AlertVariant;
  children: ReactNode;
};

export const Alert = ({ variant = 'warning', children }: AlertProps) => {
  const { bg, text } = variantStyles[variant];

  return (
    <div
      className={clsx('flex rounded-lg p-2 text-sm', text, bg)}
      role="alert"
    >
      <AlertIcon />
      <div>{children}</div>
    </div>
  );
};
