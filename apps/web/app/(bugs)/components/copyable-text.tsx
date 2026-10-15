import { useState } from 'react';
import { LuCheck, LuCopy } from 'react-icons/lu';
import { Button } from 'app/components/ui/button';

export const CopyableText = ({
  text,
  label,
}: {
  text: string;
  label: string;
}) => {
  const [status, setStatus] = useState<'idle' | 'copying' | 'copied' | 'error'>(
    'idle',
  );

  const copy = async () => {
    setStatus('copying');
    try {
      await navigator.clipboard.writeText(text);
      setStatus('copied');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="relative min-h-15 min-w-0 rounded-md border bg-background py-4 pr-16 pl-4">
      <Button
        variant="outline"
        type="button"
        className="absolute top-3 right-3 size-9 p-2"
        aria-label={`Copy ${label}`}
        title={status === 'copied' ? 'Copied' : `Copy ${label}`}
        disabled={status === 'copying'}
        onClick={() => void copy()}
      >
        {status === 'copied' ? (
          <LuCheck
            aria-hidden="true"
            className="size-4.5"
          />
        ) : (
          <LuCopy
            aria-hidden="true"
            className="size-4.5"
          />
        )}
      </Button>
      <pre className="m-0 whitespace-pre-wrap font-mono text-sm wrap-anywhere">
        <code className="font-[inherit]">{text}</code>
      </pre>
      <span
        className="sr-only"
        role="status"
      >
        {status === 'copied' ? 'Copied to clipboard.' : ''}
      </span>
      {status === 'error' && (
        <p
          className="text-destructive"
          role="alert"
        >
          Could not copy to clipboard. Select and copy the text manually.
        </p>
      )}
    </div>
  );
};
