import type React from 'react';

type CloseButtonProps = {
  onClick: () => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const CloseButton: React.FC<CloseButtonProps> = (props) => {
  const { onClick } = props;

  return (
    <button
      aria-label="Close button"
      type="button"
      className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
      onClickCapture={onClick}
    >
      <svg
        className="size-5"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Close button</title>
        <path
          fillRule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
};
