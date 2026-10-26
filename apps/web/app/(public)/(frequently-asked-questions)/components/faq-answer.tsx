import { clsx } from 'clsx';
import { type ReactNode, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useTruncate } from 'app/hooks/use-truncate';

export const FaqAnswer = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation('public');
  const id = useId();
  const {
    contentRef,
    measurementRef,
    measurementTextRef,
    previewText,
    isExpanded,
    isTruncated,
    toggleExpanded,
  } = useTruncate();

  const isCollapsed = isTruncated && !isExpanded;
  const buttonClassName =
    'cursor-pointer font-medium text-link underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-sm';

  const renderPreview = (text: ReactNode, expanded = false) => (
    <>
      <span hidden={expanded}>{text} </span>
      <span className="whitespace-nowrap">
        <span hidden={expanded}>… </span>
        <button
          type="button"
          className={buttonClassName}
          aria-controls={id}
          aria-expanded={expanded}
          onClick={toggleExpanded}
        >
          {expanded ? t('Show less') : t('Show more')}
        </button>
      </span>
    </>
  );

  return (
    <div
      id={id}
      className="relative overflow-hidden leading-6 text-foreground"
    >
      <div
        ref={contentRef}
        aria-hidden={isCollapsed || undefined}
        inert={isCollapsed || undefined}
        className={clsx(
          'flow-root',
          isCollapsed &&
            'absolute inset-x-0 top-0 opacity-0 pointer-events-none select-none',
        )}
      >
        {children}
      </div>
      <div className={clsx(!isTruncated && 'hidden')}>
        {renderPreview(previewText, isExpanded)}
      </div>
      <div
        ref={measurementRef}
        aria-hidden="true"
        inert
        className="absolute inset-x-0 top-0 invisible pointer-events-none"
      >
        {renderPreview(<span ref={measurementTextRef} />)}
      </div>
    </div>
  );
};
