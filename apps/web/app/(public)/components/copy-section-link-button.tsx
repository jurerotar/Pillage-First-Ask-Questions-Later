import { useState } from 'react';
import { LuLink } from 'react-icons/lu';

type CopySectionLinkButtonProps = {
  sectionId: string;
  sectionType: string;
};

export const CopySectionLinkButton = ({
  sectionId,
  sectionType,
}: CopySectionLinkButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const copySectionLink = async () => {
    const url = new URL(window.location.href);
    url.hash = sectionId;

    await navigator.clipboard.writeText(url.toString());
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 2_000);
  };

  const label = isCopied ? 'Link copied' : `Copy link to this ${sectionType}`;

  return (
    <button
      type="button"
      onClick={copySectionLink}
      title={label}
      aria-label={label}
      className="ml-1 inline-flex size-6 shrink-0 align-middle items-center justify-center rounded text-muted-foreground hover:text-foreground focus-visible:opacity-100"
    >
      <LuLink className="size-4" />
    </button>
  );
};
