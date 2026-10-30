import { Slider as SliderPrimitive } from '@base-ui/react';
import { clsx } from 'clsx';
import { type ComponentProps, useMemo } from 'react';

type SliderProps = Omit<
  ComponentProps<typeof SliderPrimitive.Root>,
  'value' | 'defaultValue' | 'onValueChange'
> & {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
} & {
  marks?: (string | number)[];
};

export const Slider = (props: SliderProps) => {
  const {
    className,
    defaultValue,
    value,
    min = 0,
    max = 100,
    marks = [],
    onValueChange,
    ...rootProps
  } = props;

  const _values = useMemo(() => {
    return Array.isArray(value)
      ? value
      : Array.isArray(defaultValue)
        ? defaultValue
        : [min, max];
  }, [value, defaultValue, min, max]);

  return (
    <>
      {marks.length > 0 && (
        <span className="text-muted-foreground text-xs">{marks[0]}</span>
      )}
      <SliderPrimitive.Root
        data-slot="slider"
        defaultValue={
          defaultValue ?? (value === undefined ? [min, max] : undefined)
        }
        value={value}
        min={min}
        max={max}
        className={clsx(
          'relative flex w-full touch-none items-center non-selectable data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
          className,
        )}
        thumbAlignment="edge"
        thumbCollisionBehavior="none"
        {...rootProps}
        onValueChange={(value) =>
          onValueChange?.(Array.isArray(value) ? value : [value as number])
        }
      >
        <SliderPrimitive.Control className="relative flex w-full items-center touch-none data-[orientation=vertical]:h-full data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col">
          <SliderPrimitive.Track
            data-slot="slider-track"
            className={clsx(
              'bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5',
            )}
          >
            <SliderPrimitive.Indicator
              data-slot="slider-range"
              className={clsx(
                'bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full',
              )}
            />
          </SliderPrimitive.Track>
          {Array.from({ length: _values.length }, (_, index) => (
            <SliderPrimitive.Thumb
              data-slot="slider-thumb"
              // biome-ignore lint/suspicious/noArrayIndexKey: It's works with steps, so it's fine
              key={index}
              index={index}
              className="border-primary bg-background ring-ring/50 block size-4 shrink-0 rounded-full border shadow-sm transition-[color,background-color,border-color] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden data-disabled:pointer-events-none data-disabled:opacity-50"
            />
          ))}
        </SliderPrimitive.Control>
      </SliderPrimitive.Root>
      {marks.length > 0 && (
        <span className="text-muted-foreground text-xs">{marks[1]}</span>
      )}
    </>
  );
};
