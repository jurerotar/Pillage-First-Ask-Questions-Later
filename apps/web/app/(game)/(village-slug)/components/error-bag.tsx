import { Children, isValidElement, type ReactNode } from 'react';

type ErrorBagProps = {
  errorBag: (string | ReactNode)[];
};

export const ErrorBag = ({ errorBag }: ErrorBagProps) => {
  const errors = Children.toArray(errorBag);

  if (errors.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-col ml-4 gap-1 list-disc">
      {errors.map((error) => (
        <li
          className="text-red-500 text-sm font-medium"
          key={isValidElement(error) ? error.key : String(error)}
        >
          {error}
        </li>
      ))}
    </ul>
  );
};
