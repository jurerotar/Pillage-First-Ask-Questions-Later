import type React from 'react';

export const WarningAlert: React.FCWithChildren = ({ children }) => {
  return (
    <div
      className="flex bg-yellow-100 rounded-lg p-2 text-sm text-yellow-700"
      role="alert"
    >
      <svg
        className="w-5 h-5 inline mr-3"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Note</title>
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
      <div>
        <span className="font-medium">Warning!</span> {children}
      </div>
    </div>
  );
};
