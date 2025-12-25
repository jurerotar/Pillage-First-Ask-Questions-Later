import { clsx } from 'clsx';
import { Slider as SliderPrimitive } from 'radix-ui';
import { type ComponentProps, useMemo } from 'react';

type SliderProps = ComponentProps<typeof SliderPrimitive.Root> & {
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
        defaultValue={defaultValue}
        value={value}
        min={min}
        max={max}
        className={clsx(
          'relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
          className,
        )}
        {...props}
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className={clsx(
            'bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5',
          )}
        >
          <SliderPrimitive.Range
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
            className="border-primary bg-background ring-ring/50 block size-4 shrink-0 rounded-full border shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Root>
      {marks.length > 0 && (
        <span className="text-muted-foreground text-xs">{marks[1]}</span>
      )}
    </>
  );
};
