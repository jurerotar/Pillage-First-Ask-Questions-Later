// Helper type to lowercase the first character of a string
type LowerFirst<S extends string> = S extends `${infer F}${infer R}`
  ? `${Lowercase<F>}${R}`
  : S;

// Helper type to capitalize the first character of a string
type CapitalizeFirst<S extends string> = S extends `${infer F}${infer R}`
  ? `${Uppercase<F>}${R}`
  : S;

// Recursive helper to capitalize each word after the first underscore
type CapitalizeWords<S extends string> =
  S extends `${infer First}_${infer Rest}`
    ? `${CapitalizeFirst<Lowercase<First>>}${CapitalizeWords<Rest>}`
    : CapitalizeFirst<Lowercase<S>>;

// Main type to transform "ABC_ABC" or single-word keys like "HELLO" to "abcAbc" or "hello"
export type UpperCaseToCamelCase<S extends string> =
  S extends `${infer First}_${infer Rest}`
    ? `${LowerFirst<Lowercase<First>>}${CapitalizeWords<Rest>}`
    : LowerFirst<Lowercase<S>>;

// Custom Pick type to pick specific literals
export type PickLiteral<T, U> = T extends U ? T : never;
