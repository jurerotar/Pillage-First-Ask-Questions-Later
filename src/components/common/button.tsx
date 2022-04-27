import React from 'react';

type ButtonProps = {
  variant?: 'danger' | 'normal';
  size?: 'small' | 'normal' | 'large';
  disabled?: boolean;
  isLoading?: boolean;
  onClick: () => void;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button: React.FC<ButtonProps> = (props): JSX.Element => {
  const {
    variant = 'normal',
    size = 'normal',
    disabled = false,
    isLoading = false,
    onClick,
    children
  } = props;

  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`
        rounded-md px-4 py-2 text-white w-fit
        ${size === 'normal' && 'text-base'}
        ${variant === 'normal' && 'bg-blue-400'}
        ${variant === 'danger' && 'bg-red-500'}
        ${(isLoading || disabled) && 'bg-gray-500'}
      `}
    >
      {children}
    </button>
  );
};

export default Button;
