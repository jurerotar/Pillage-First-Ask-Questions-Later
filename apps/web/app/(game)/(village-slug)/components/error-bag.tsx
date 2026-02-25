type ErrorBagProps = {
  errorBag: string[];
};

export const ErrorBag = ({ errorBag }: ErrorBagProps) => {
  if (errorBag.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-col ml-4 gap-1 list-disc">
      {errorBag.map((error) => (
        <li
          className="text-red-500 text-sm font-medium"
          key={error}
        >
          {error}
        </li>
      ))}
    </ul>
  );
};
