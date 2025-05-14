import type React from 'react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { LuCircle } from 'react-icons/lu';
import clsx from 'clsx';

export const RadioGroup: React.FC<React.ComponentProps<typeof RadioGroupPrimitive.Root>> = ({ className, ...props }) => {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={clsx('grid gap-3', className)}
      {...props}
    />
  );
};

export const RadioGroupItem: React.FC<React.ComponentProps<typeof RadioGroupPrimitive.Item>> = ({ className, ...props }) => {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={clsx(
        'border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center"
      >
        <LuCircle className="fill-primary absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
};
