import {
  RadioGroup as RadioGroupPrimitive,
  Radio as RadioPrimitive,
} from '@base-ui/react';
import { clsx } from 'clsx';
import { LuCircle } from 'react-icons/lu';

export const RadioGroup = <Value,>(props: RadioGroupPrimitive.Props<Value>) => {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      {...props}
      className={clsx('grid gap-3', props.className)}
    />
  );
};

export const RadioGroupItem = (props: RadioPrimitive.Root.Props) => {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={clsx(
        'border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        props.className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center"
      >
        <LuCircle className="fill-primary absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  );
};
