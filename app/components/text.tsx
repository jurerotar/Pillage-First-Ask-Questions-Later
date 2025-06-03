import React from 'react';
import { clsx } from 'clsx';

type TextElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label' | 'p' | 'span';

const elementStyles: Record<TextElement, string> = {
  h1: 'text-2xl lg:text-3xl text-gray-800',
  h2: 'text-xl font-medium text-gray-800',
  h3: 'font-medium text-gray-800',
  h4: 'text-gray-800',
  h5: 'text-gray-800',
  h6: 'text-gray-800',
  p: 'text-gray-800 leading-6',
  label: '',
  span: '',
};

type TextVariant = 'body' | 'orange' | 'green' | 'muted';

// TODO: Think of better names lol
const variantStyles: Record<TextVariant, string> = {
  body: 'text-black',
  orange: 'text-orange-500',
  green: 'text-green-600',
  muted: 'text-gray-400',
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
