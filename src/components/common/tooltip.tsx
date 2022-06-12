import React, { useEffect, useRef, useState } from 'react';
import { Point } from 'interfaces/models/common/point';

type TooltipProps = {
  tooltipContent: string | React.ReactNode;
  offsetX?: number;
  offsetY?: number;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

const Tooltip: React.FC<TooltipProps> = (props): JSX.Element => {
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
    if (!ref.current) {
      return;
    }
    ref.current?.addEventListener('mousemove', updateCurrentPosition, false);
    return () => {
      ref.current?.removeEventListener('mousemove', updateCurrentPosition, false);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="inline-flex tooltip"
    >
      {children}
      <div
        className={`tooltip-popup delay-150 transition-opacity duration-default fixed w-fit z-30 pointer-events-none rounded-md p-2 bg-black ${className}`}
        style={{
          top: `${position.y + offsetY}px`,
          left: `${position.x + offsetX}px`
        }}
      >
        {typeof tooltipContent === 'string' ? (
          <p className="text-white text-xs">
            {tooltipContent}
          </p>
        ) : tooltipContent}
      </div>
    </div>
  );
};

export default Tooltip;
