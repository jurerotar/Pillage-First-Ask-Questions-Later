import { cva } from 'class-variance-authority';

export const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md border border-transparent text-sm font-medium not-data-pressed:hover:bg-muted not-data-pressed:hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 data-pressed:bg-accent data-pressed:text-accent-foreground data-pressed:border-green-600 dark:data-pressed:border-green-400 data-pressed:[&_svg]:text-green-700 dark:data-pressed:[&_svg]:text-green-400 not-data-pressed:[&_svg]:text-muted-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,background-color,border-color] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          'not-data-pressed:bg-transparent data-[slot=toggle-group-item]:not-data-pressed:bg-muted data-[slot=toggle-group-item]:not-data-pressed:text-muted-foreground data-[slot=toggle-group-item]:not-data-pressed:hover:bg-accent',
        outline:
          'not-data-pressed:border-input not-data-pressed:bg-transparent shadow-xs not-data-pressed:hover:bg-accent not-data-pressed:hover:text-accent-foreground',
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
