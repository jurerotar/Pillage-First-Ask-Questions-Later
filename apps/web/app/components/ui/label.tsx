import { clsx } from 'clsx';
import type { ComponentProps } from 'react';

export const Label = ({
  className,
  htmlFor,
  children,
  ...props
}: ComponentProps<'label'>) => {
  return (
    <label
      htmlFor={htmlFor}
      data-slot="label"
      className={clsx(
        'flex items-center gap-2 text-sm leading-none font-medium non-selectable group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </label>
  );
};
