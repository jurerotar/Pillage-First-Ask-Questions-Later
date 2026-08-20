import { clsx } from 'clsx';
import {
  type PropsWithChildren,
  type PointerEvent as ReactPointerEvent,
  useRef,
  useState,
} from 'react';

type BuildingLayoutProps = PropsWithChildren<{
  className?: string;
}>;

export const Section = ({ children, className }: BuildingLayoutProps) => {
  return (
    <div className={clsx('relative flex flex-col gap-4', className)}>
      {children}
    </div>
  );
};

export const SectionContent = ({
  children,
  className,
}: BuildingLayoutProps) => {
  return (
    <div className={clsx('flex flex-col gap-2 relative', className)}>
      {children}
    </div>
  );
};

type DragScrollState = {
  pointerId: number;
  startX: number;
  scrollLeft: number;
  didDrag: boolean;
};

const dragActivationDistance = 4;

export const OverflowContainer = ({ children }: PropsWithChildren) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragScrollState | null>(null);
  const shouldBlockClickRef = useRef<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const stopDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;

    if (dragState === null || dragState.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    shouldBlockClickRef.current = dragState.didDrag;
    window.setTimeout(() => {
      shouldBlockClickRef.current = false;
    }, 100);
    dragStateRef.current = null;
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className={clsx(
        'overflow-x-scroll scrollbar-hidden',
        'md:cursor-grab md:active:cursor-grabbing',
        isDragging && 'select-none',
      )}
      onClickCapture={(event) => {
        if (!shouldBlockClickRef.current) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        shouldBlockClickRef.current = false;
      }}
      onPointerCancel={stopDragging}
      onPointerDown={(event) => {
        const container = containerRef.current;

        if (
          container === null ||
          event.pointerType !== 'mouse' ||
          event.button !== 0 ||
          container.scrollWidth <= container.clientWidth
        ) {
          return;
        }

        event.currentTarget.setPointerCapture(event.pointerId);
        dragStateRef.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          scrollLeft: container.scrollLeft,
          didDrag: false,
        };
      }}
      onPointerMove={(event) => {
        const container = containerRef.current;
        const dragState = dragStateRef.current;

        if (
          container === null ||
          dragState === null ||
          dragState.pointerId !== event.pointerId
        ) {
          return;
        }

        const deltaX = event.clientX - dragState.startX;

        if (Math.abs(deltaX) >= dragActivationDistance) {
          dragState.didDrag = true;
          setIsDragging(true);
        }

        if (dragState.didDrag) {
          event.preventDefault();
          container.scrollLeft = dragState.scrollLeft - deltaX;
        }
      }}
      onPointerUp={stopDragging}
      onLostPointerCapture={() => {
        dragStateRef.current = null;
        setIsDragging(false);
      }}
    >
      {children}
    </div>
  );
};
