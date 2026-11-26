import type { ReactNode } from 'react';

export const WikiSteps = ({ children }: { children: ReactNode }) => {
  return (
    <ol className="flex list-decimal flex-col gap-2 ps-6 text-foreground leading-6 marker:font-semibold">
      {children}
    </ol>
  );
};
