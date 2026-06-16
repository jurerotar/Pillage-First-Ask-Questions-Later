import { IoCopyOutline } from 'react-icons/io5';

type CopyReleaseButtonProps = {
  text: string;
};

export const CopyReleaseButton = ({ text }: CopyReleaseButtonProps) => {
  return (
    <button
      type="button"
      onClick={async () => navigator.clipboard.writeText(text)}
      title="Copy release markdown"
      className="absolute top-0 right-0 p-1.5 text-xs rounded border border-black/10 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      <IoCopyOutline className="size-4" />
    </button>
  );
};
