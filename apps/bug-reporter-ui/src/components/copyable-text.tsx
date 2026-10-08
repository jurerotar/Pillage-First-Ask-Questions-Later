import { useState } from 'react';

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
    <div className="code-block">
      <button
        type="button"
        className="copy-button"
        aria-label={`Copy ${label}`}
        title={status === 'copied' ? 'Copied' : `Copy ${label}`}
        disabled={status === 'copying'}
        onClick={() => void copy()}
      >
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {status === 'copied' ? (
            <path d="m5 12 4 4L19 6" />
          ) : (
            <>
              <rect
                x="9"
                y="9"
                width="13"
                height="13"
                rx="2"
              />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </>
          )}
        </svg>
      </button>
      <pre>
        <code>{text}</code>
      </pre>
      <span
        className="sr-only"
        role="status"
      >
        {status === 'copied' ? 'Copied to clipboard.' : ''}
      </span>
      {status === 'error' && (
        <p role="alert">
          Could not copy to clipboard. Select and copy the text manually.
        </p>
      )}
    </div>
  );
};
