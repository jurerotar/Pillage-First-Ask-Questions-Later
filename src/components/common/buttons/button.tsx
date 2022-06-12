import React from 'react';

type ButtonProps = {
  variant?: 'danger' | 'normal' | 'confirm';
  size?: 'xs' | 'sm' | 'base' | 'lg';
  disabled?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button: React.FC<ButtonProps> = (props): JSX.Element => {
  const {
    variant = 'normal',
    size = 'base',
    disabled = false,
    isLoading = false,
    onClick = () => {},
    className = '',
    children
  } = props;

  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`
        rounded-md text-white w-fit transition-colors duration-default text-xs sm:text-base
        ${size === 'xs' && 'px-2 py-1'}
        ${size === 'sm' && 'px-4 py-2'}
        ${size === 'base' && 'px-4 py-2'}
        ${size === 'lg' && 'px-4 py-2'}
        ${variant === 'normal' && 'bg-blue-400'}
        ${variant === 'confirm' && 'bg-green-500'}
        ${variant === 'danger' && 'bg-red-500'}
        ${(isLoading || disabled) && 'bg-gray-500'}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default Button;
