import type { ChangeEvent } from 'react';
import { Input, type InputProps } from 'app/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'app/components/ui/popover';
import { Slider } from 'app/components/ui/slider';

type LevelInputPopoverProps = {
  id: string;
  label: string;
  title?: string;
  value: number;
  onValueChange: (value: number) => void;
  className?: string;
  inputSize?: InputProps['size'];
  min?: number;
  max?: number;
};

export const LevelInputPopover = ({
  id,
  label,
  title = label,
  value,
  onValueChange,
  className = 'px-1 text-center',
  inputSize = 'numericDoubleDigit',
  min = 0,
  max = 20,
}: LevelInputPopoverProps) => {
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onValueChange(event.currentTarget.valueAsNumber);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Input
          aria-label={label}
          autoComplete="off"
          className={className}
          hideSpinner
          id={id}
          max={max}
          min={min}
          size={inputSize}
          type="number"
          value={value}
          onChange={handleInputChange}
          onFocus={(event) => {
            event.currentTarget.select();
          }}
        />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-64 p-3"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
        }}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">{title}</span>
            <span className="text-muted-foreground text-sm">
              {value}/{max}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-xs">{min}</span>
            <Slider
              min={min}
              max={max}
              value={[value]}
              onValueChange={([nextValue]) => {
                onValueChange(nextValue);
              }}
            />
            <span className="text-muted-foreground text-xs">{max}</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
