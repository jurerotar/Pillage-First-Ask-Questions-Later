import { randomInt } from './math';

declare const lootTableBrand: unique symbol;

export type LootTableAmountRange = readonly [number, number];
export type LootTableAmount = number | LootTableAmountRange;

export const lootAmountRange = (
  min: number,
  max: number,
): LootTableAmountRange => {
  return [min, max];
};

export type LootTableResult = {
  amount: LootTableAmount;
};

type IntRangeInclusive<
  End extends number,
  Values extends readonly number[] = [],
> = Values['length'] extends End
  ? Values[number] | End
  : IntRangeInclusive<End, readonly [...Values, Values['length']]>;

export type LootTablePercentage = IntRangeInclusive<100>;

type LootTableResultEntry<T extends LootTableResult> = {
  percentage: LootTablePercentage;
  result: T;
  table?: never;
};

type NestedLootTableEntry<T extends LootTableResult> = {
  percentage: LootTablePercentage;
  table: LootTable<T>;
  result?: never;
};

export type LootTableEntry<T extends LootTableResult> =
  | LootTableResultEntry<T>
  | NestedLootTableEntry<T>;

export type LootTable<T extends LootTableResult> =
  readonly LootTableEntry<T>[] & {
    readonly [lootTableBrand]: T;
  };
export type ResolvedLootTableResult<T extends LootTableResult> = Omit<
  T,
  'amount'
> & { amount: number };

type LootTableEntryResult<Entry> = Entry extends {
  result: infer Result extends LootTableResult;
}
  ? Result
  : Entry extends { table: LootTable<infer Result extends LootTableResult> }
    ? Result
    : never;

type LootTableResultUnion<
  Entries extends readonly LootTableEntry<LootTableResult>[],
> = LootTableEntryResult<Entries[number]>;

type TupleOf<
  Length extends number,
  Tuple extends readonly unknown[] = [],
> = number extends Length
  ? readonly unknown[]
  : Tuple['length'] extends Length
    ? Tuple
    : TupleOf<Length, readonly [...Tuple, unknown]>;

type Add<Left extends number, Right extends number> = [
  ...TupleOf<Left>,
  ...TupleOf<Right>,
]['length'] &
  number;

type SumPercentages<
  Entries extends readonly { percentage: number }[],
  Total extends number = 0,
> = Entries extends readonly [
  infer Head extends { percentage: number },
  ...infer Tail extends readonly { percentage: number }[],
]
  ? SumPercentages<Tail, Add<Total, Head['percentage']>>
  : Total;

type TotalPercentageAtMost100<
  Entries extends readonly { percentage: number }[],
> = TupleOf<101>[SumPercentages<Entries>] extends undefined ? never : unknown;

export const defineLootTable = <
  const Entries extends readonly LootTableEntry<LootTableResult>[],
>(
  lootTable: Entries & TotalPercentageAtMost100<Entries>,
): LootTable<LootTableResultUnion<Entries>> => {
  return lootTable as unknown as LootTable<LootTableResultUnion<Entries>>;
};

const isNestedLootTableEntry = <T extends LootTableResult>(
  entry: LootTableEntry<T>,
): entry is NestedLootTableEntry<T> => 'table' in entry;

const resolveLootTableAmount = (amount: LootTableAmount): number => {
  if (typeof amount === 'number') {
    return amount;
  }

  const [min, max] = amount;

  return randomInt(min, max);
};

const resolveLootTableResult = <T extends LootTableResult>(
  result: T,
): ResolvedLootTableResult<T> => {
  return {
    ...result,
    amount: resolveLootTableAmount(result.amount),
  };
};

export const rollLootTable = <T extends LootTableResult>(
  lootTable: LootTable<T>,
): ResolvedLootTableResult<T> | null => {
  const roll = Math.random() * 100;
  let threshold = 0;

  for (const entry of lootTable) {
    threshold += entry.percentage;

    if (roll < threshold) {
      if (isNestedLootTableEntry(entry)) {
        return rollLootTable(entry.table);
      }

      return resolveLootTableResult(entry.result);
    }
  }

  return null;
};
