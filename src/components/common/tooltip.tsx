import React, { useEffect, useRef, useState } from 'react';
import { Point } from 'interfaces/models/common';
import clsx from 'clsx';

type TooltipProps = {
  tooltipContent: string | React.ReactNode;
  offsetX?: number;
  offsetY?: number;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

export const Tooltip: React.FC<TooltipProps> = (props) => {
  const {
    tooltipContent,
    offsetY = 0,
    offsetX = 0,
    className = '',
    children
  } = props;

  const ref = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState<Point>({
    x: 0,
    y: 0
  });

  const updateCurrentPosition = (event: MouseEvent): void => {
    setPosition({
      x: event.clientX,
      y: event.clientY
    });
  };

  useEffect(() => {
    const localRef = ref.current;
    if (!localRef) {
      return;
    }
    localRef?.addEventListener('mousemove', updateCurrentPosition, false);
    return () => {
      localRef?.removeEventListener('mousemove', updateCurrentPosition, false);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="tooltip inline-flex"
    >
      {children}
      <div
        className={clsx(className, 'tooltip-popup duration-default pointer-events-none fixed z-30 w-fit rounded-md bg-black p-2 transition-opacity delay-150')}
        style={{
          top: `${position.y + offsetY}px`,
          left: `${position.x + offsetX}px`
        }}
      >
        {typeof tooltipContent === 'string' ? (
          <p className="text-xs text-white">
            {tooltipContent}
          </p>
        ) : tooltipContent}
      </div>
    </div>
  );
};
