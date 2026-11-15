import { useEffect, useRef, useState } from 'react';

export const useTruncate = (lineCount = 3) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const measurementRef = useRef<HTMLDivElement>(null);
  const measurementTextRef = useRef<HTMLSpanElement>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const content = contentRef.current;
    const measurement = measurementRef.current;
    const text = measurementTextRef.current;
    if (!content || !measurement || !text) {
      return;
    }

    const measure = () => {
      const lineHeight = Number.parseFloat(
        getComputedStyle(content).lineHeight,
      );
      const maximumHeight = lineHeight * lineCount + 1;
      if (content.scrollHeight <= maximumHeight) {
        setPreviewText(null);
        return;
      }

      // biome-ignore lint/performance/useDomNodeTextContent: Preserve spaces between rendered paragraphs and list items.
      const words = content.innerText.trim().split(/\s+/u);
      let start = 0;
      let end = words.length;
      while (start < end) {
        const middle = Math.ceil((start + end) / 2);
        text.textContent = words.slice(0, middle).join(' ');
        if (measurement.getBoundingClientRect().height <= maximumHeight) {
          start = middle;
        } else {
          end = middle - 1;
        }
      }
      setPreviewText(words.slice(0, start).join(' '));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    measure();

    return () => observer.disconnect();
  }, [lineCount]);

  const toggleExpanded = () => setIsExpanded((expanded) => !expanded);

  return {
    contentRef,
    measurementRef,
    measurementTextRef,
    previewText,
    isExpanded,
    isTruncated: previewText !== null,
    toggleExpanded,
  };
};
