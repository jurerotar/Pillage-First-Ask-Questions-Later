import type { ComponentProps, ReactNode } from 'react';
import { LevelInputPopover } from './level-input-popover';

type SimulatorLevelInputProps = ComponentProps<typeof LevelInputPopover> & {
  icon: ReactNode;
};

export const SimulatorLevelInput = ({
  icon,
  label,
  ...props
}: SimulatorLevelInputProps) => (
  <span
    className="flex cursor-pointer items-center gap-1"
    data-tooltip-content={label}
    data-tooltip-id="general-tooltip"
  >
    <span className="inline-flex items-center justify-center">
      <span className="sr-only">{label}</span>
      {icon}
    </span>
    <LevelInputPopover
      label={label}
      {...props}
    />
  </span>
);
