import React from 'react';
import { overrideTailwindClasses } from 'tailwind-override';

type HamburgerButtonProps = {
  onClick: () => void;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const HamburgerButton: React.FC<HamburgerButtonProps> = (props) => {
  const {
    onClick,
    className = ''
  } = props;

  return (
    <button
      type="button"
      className={overrideTailwindClasses(`text-gray-800 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg p-2 inline-flex items-center dark:hover:bg-gray-600 dark:text-white ${className}`)}
      onClickCapture={onClick}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  );
};
