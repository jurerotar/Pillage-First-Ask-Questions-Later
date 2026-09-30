import { useState } from 'react';
import { LuLink } from 'react-icons/lu';

type CopyReleaseLinkButtonProps = {
  sectionId: string;
};

export const CopyReleaseLinkButton = ({
  sectionId,
}: CopyReleaseLinkButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyReleaseLink = async () => {
    const url = new URL(window.location.href);
    url.hash = sectionId;

    await navigator.clipboard.writeText(url.toString());
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 2_000);
  };

  return (
    <button
      type="button"
      onClick={copyReleaseLink}
      title={isCopied ? 'Link copied' : 'Copy link to this release'}
      aria-label={isCopied ? 'Link copied' : 'Copy link to this release'}
      className="inline-flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground focus-visible:opacity-100"
    >
      <LuLink className="size-4" />
    </button>
  );
};
