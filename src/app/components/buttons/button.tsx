import clsx from 'clsx';
import type React from 'react';

type ButtonProps = {
  variant?: 'danger' | 'normal' | 'confirm';
  size?: 'xs' | 'sm' | 'base' | 'lg';
  disabled?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button: React.FC<ButtonProps> = (props) => {
  const { variant = 'normal', size = 'base', disabled = false, isLoading = false, onClick = () => {}, className = '', children } = props;

  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      onClick={onClick}
      className={clsx(
        size === 'xs' && 'px-2 py-1',
        size === 'sm' && 'px-4 py-2',
        size === 'base' && 'px-4 py-2',
        size === 'lg' && 'px-4 py-2',
        variant === 'normal' && 'bg-blue-400',
        variant === 'confirm' && 'bg-green-500',
        variant === 'danger' && 'bg-red-500',
        (isLoading || disabled) && 'bg-gray-500',
        className,
        'w-fit rounded-md text-xs text-white sm:text-base'
      )}
    >
      {children}
    </button>
  );
};
