import { cva } from 'class-variance-authority';

export const skeletonVariants = cva(
  'animate-pulse rounded-md bg-gray-300 dark:bg-gray-700',
  {
    variants: {
      variant: {
        default: '',
        dark: 'bg-gray-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);
