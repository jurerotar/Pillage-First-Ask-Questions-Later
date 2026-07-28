import { cva } from 'class-variance-authority';

export const spinnerVariants = cva(
  'flex-col items-center justify-center text-muted',
  {
    variants: {
      show: {
        true: 'flex',
        false: 'hidden',
      },
    },
    defaultVariants: {
      show: true,
    },
  },
);

export const loaderVariants = cva('animate-spin text-muted', {
  variants: {
    size: {
      small: 'size-6',
      medium: 'size-8',
      large: 'size-12',
    },
  },
  defaultVariants: {
    size: 'medium',
  },
});
