type WordSeparator = '-' | '_' | ' ';

type CamelCaseWords<Value extends string> =
  Value extends `${infer Head}${WordSeparator}${infer Tail}`
    ? `${Head}${Capitalize<CamelCaseWords<Tail>>}`
    : Value;

export type CamelCase<Value extends string> = string extends Value
  ? string
  : CamelCaseWords<Lowercase<Value>>;

export type SnakeCase<Value extends string> = string extends Value
  ? string
  : Lowercase<Value>;
