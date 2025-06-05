import React from 'react';
import { clsx } from 'clsx';

type TextElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';

const elementStyles: Record<TextElement, string> = {
  h1: 'text-2xl lg:text-3xl text-foreground',
  h2: 'text-xl font-medium text-foreground',
  h3: 'font-medium text-foreground',
  h4: 'text-foreground',
  h5: 'text-foreground',
  h6: 'text-foreground',
  p: 'text-foreground leading-6',
};

type TextVariant = 'body' | 'orange' | 'green' | 'muted';

const variantStyles: Record<TextVariant, string> = {
  body: 'text-foreground',
  orange: 'text-warning',
  green: 'text-success',
  muted: 'text-muted-foreground',
};

type TextProps = React.HTMLAttributes<HTMLElement> & {
  as?: TextElement;
  variant?: TextVariant;
  children: React.ReactNode;
};

export const Text: React.FC<TextProps> = ({ as = 'p', variant = 'body', className, children, ...props }) => {
  return React.createElement(
    as,
    {
      className: clsx(variantStyles[variant], elementStyles[as], 'transition-colors', className),
      ...props,
    },
    children,
  );
};
