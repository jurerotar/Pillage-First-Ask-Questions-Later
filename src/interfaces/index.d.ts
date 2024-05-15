import type React from 'react';

// TODO: Re-enable these types once maps are seeded again
// type PRNGFunction = () => number;
//
// type PRNGFunctionType = 'quick' | 'double' | 'int32';
//
// type PRNGAlgorithm = (seed: string) => {
//   (): number;
// } & Record<PRNGFunctionType, PRNGFunction>;
//
// declare module 'esm-seedrandom' {
//   export const prng_alea: PRNGAlgorithm;
//   export const prng_arc4: PRNGAlgorithm;
//   export const prng_tychei: PRNGAlgorithm;
//   export const prng_xor128: PRNGAlgorithm;
//   export const prng_xor4096: PRNGAlgorithm;
//   export const prng_xorshift7: PRNGAlgorithm;
//   export const prng_xorwow: PRNGAlgorithm;
// }

declare module 'react' {
  export type FCWithChildren<P = object> = React.FC<
    P & {
      children: React.ReactNode;
    }
  >;
}
