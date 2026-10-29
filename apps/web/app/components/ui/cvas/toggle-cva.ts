import { cva } from 'class-variance-authority';

export const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md border border-transparent text-sm font-medium data-[state=off]:hover:bg-muted data-[state=off]:hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground data-[state=on]:border-green-600 dark:data-[state=on]:border-green-400 data-[state=on]:[&_svg]:text-green-700 dark:data-[state=on]:[&_svg]:text-green-400 data-[state=off]:[&_svg]:text-muted-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,background-color,border-color] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          'data-[state=off]:bg-transparent data-[slot=toggle-group-item]:data-[state=off]:bg-muted data-[slot=toggle-group-item]:data-[state=off]:text-muted-foreground data-[slot=toggle-group-item]:data-[state=off]:hover:bg-accent',
        outline:
          'data-[state=off]:border-input data-[state=off]:bg-transparent shadow-xs data-[state=off]:hover:bg-accent data-[state=off]:hover:text-accent-foreground',
      },
      size: {
        default: 'h-9 px-2 min-w-9',
        sm: 'h-8 px-1.5 min-w-8',
        lg: 'h-10 px-2.5 min-w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);
