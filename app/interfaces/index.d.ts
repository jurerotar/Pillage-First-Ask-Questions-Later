import type React from 'react';

declare module 'react' {
  export type FCWithChildren<P = unknown> = React.FC<
    React.PropsWithChildren<P>
  >;
}
