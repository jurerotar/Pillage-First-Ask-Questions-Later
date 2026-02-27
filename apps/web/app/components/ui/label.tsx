import { Field as FieldPrimitive } from '@base-ui/react';
import { clsx } from 'clsx';

export const Label = ({ className, ...props }: FieldPrimitive.Label.Props) => {
  return (
    <FieldPrimitive.Root>
      <FieldPrimitive.Label
        data-slot="label"
        className={clsx(
          'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
          className,
        )}
        {...props}
      />
    </FieldPrimitive.Root>
  );
};
