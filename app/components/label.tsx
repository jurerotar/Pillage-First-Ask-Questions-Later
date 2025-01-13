import clsx from 'clsx';
import type React from 'react';

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  htmlFor: React.LabelHTMLAttributes<HTMLLabelElement>['htmlFor'];
};

export const Label: React.FC<LabelProps> = ({ className, ...props }) => {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: It's required in type
    <label
      className={clsx('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)}
      {...props}
    />
  );
};
