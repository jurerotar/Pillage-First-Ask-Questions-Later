import { FaRedditAlien } from 'react-icons/fa';
import { FaDiscord } from 'react-icons/fa6';
import { Button } from 'app/components/ui/button';

type CopyReleaseButtonProps = {
  text: string;
  platform: 'Reddit' | 'Discord';
};

export const CopyReleaseButton = ({
  text,
  platform,
}: CopyReleaseButtonProps) => {
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={async () => navigator.clipboard.writeText(text)}
      title={`Copy release markdown for ${platform}`}
      aria-label={`Copy release markdown for ${platform}`}
      className="flex items-center gap-1 p-1.5 text-xs rounded border border-black/10 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      {platform === 'Discord' ? (
        <FaDiscord className="size-5" />
      ) : (
        <FaRedditAlien className="size-5" />
      )}
    </Button>
  );
};
