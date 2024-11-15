import { clamp } from 'app/utils/common';
import type React from 'react';

type ProgressBarProps = {
  value: number;
} & React.HTMLProps<HTMLDivElement>;

export const ProgressBar: React.FC<ProgressBarProps> = (props) => {
  const { value } = props;

  const progressValue: number = clamp(value, 0, 100);

  return (
    <div className="relative flex h-1 w-full rounded-xl bg-gray-300">
      <div
        className="absolute h-1 rounded-xl bg-blue-300 transition-all duration-300"
        style={{
          width: `${progressValue}%`,
        }}
      />
    </div>
  );
};
