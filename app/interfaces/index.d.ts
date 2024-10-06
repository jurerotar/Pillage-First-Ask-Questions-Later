import type React from 'react';

declare module 'react' {
  export type FCWithChildren<P = object> = React.FC<
    P & {
      children: React.ReactNode;
    }
  >;
}
