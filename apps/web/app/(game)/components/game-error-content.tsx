import clsx from 'clsx';
import type { ReactNode } from 'react';
import { useState } from 'react';

const ErrorMessage = ({ message }: { message: ReactNode }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClipped, setIsClipped] = useState(false);

  const updateMessageRef = (messageElement: HTMLParagraphElement | null) => {
    if (!messageElement) {
      return;
    }

    setIsClipped(messageElement.scrollHeight > messageElement.clientHeight);
  };

  return (
    <>
      <p
        ref={updateMessageRef}
        className={clsx(
          'mt-1 whitespace-pre-wrap text-red-900',
          !isExpanded && 'line-clamp-2',
        )}
      >
        {message}
      </p>
      {isClipped && !isExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="mt-1 text-sm font-medium text-red-900 underline"
        >
          see more
        </button>
      )}
    </>
  );
};

type GameErrorContentProps = {
  title: ReactNode;
  message: ReactNode;
  description?: ReactNode;
  steps: ReactNode;
  actions: ReactNode;
  technicalDetails?: ReactNode;
};

export const GameErrorContent = ({
  title,
  message,
  description,
  steps,
  actions,
  technicalDetails,
}: GameErrorContentProps) => {
  return (
    <main className="container mx-auto max-w-2xl p-2 flex flex-col gap-4">
      <div
        role="alert"
        aria-live="assertive"
        className="rounded-md border border-red-300 bg-red-50 p-2 text-red-900"
      >
        <h1 className="text-lg font-medium">{title}</h1>
        <ErrorMessage message={message} />
      </div>

      {description}

      <p className="text-foreground font-medium">Try these steps:</p>
      <ul className="list-disc pl-6 space-y-1">{steps}</ul>

      <div className="flex flex-wrap gap-2">{actions}</div>

      {technicalDetails}
    </main>
  );
};
