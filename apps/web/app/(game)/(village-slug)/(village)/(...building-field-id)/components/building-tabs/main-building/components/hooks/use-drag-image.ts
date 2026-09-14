import { useCallback, useEffect, useRef } from 'react';

export const useDragImage = () => {
  const dragImageRef = useRef<HTMLElement | null>(null);

  const removeDragImage = useCallback(() => {
    dragImageRef.current?.remove();
    dragImageRef.current = null;
  }, []);

  const setDragImage = useCallback(
    (sourceElement: HTMLElement, dataTransfer: DataTransfer) => {
      removeDragImage();

      const dragImage = sourceElement.cloneNode(true) as HTMLElement;
      const { width, height } = sourceElement.getBoundingClientRect();

      Object.assign(dragImage.style, {
        position: 'fixed',
        top: '-1000px',
        left: '-1000px',
        width: `${width}px`,
        height: `${height}px`,
        pointerEvents: 'none',
        opacity: '1',
        transform: 'none',
      });

      document.body.append(dragImage);
      dataTransfer.setDragImage(dragImage, width / 2, height / 2);
      dragImageRef.current = dragImage;
    },
    [removeDragImage],
  );

  useEffect(() => removeDragImage, [removeDragImage]);

  return { removeDragImage, setDragImage };
};
