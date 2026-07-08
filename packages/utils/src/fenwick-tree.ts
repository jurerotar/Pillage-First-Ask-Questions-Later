/** Fenwick / Binary Indexed Tree for prefix sums. */
export class FenwickTree {
  private readonly size: number;
  private readonly bit: Float64Array;

  public constructor(valuesOrLength: number | ArrayLike<number>) {
    if (typeof valuesOrLength === 'number') {
      this.size = valuesOrLength;
      this.bit = new Float64Array(this.size + 1);
      return;
    }

    this.size = valuesOrLength.length;
    this.bit = new Float64Array(this.size + 1);

    for (let i = 0; i < this.size; i += 1) {
      this.add(i, valuesOrLength[i]);
    }
  }

  public add(index: number, value: number): void {
    let bitIndex = index + 1;

    while (bitIndex <= this.size) {
      this.bit[bitIndex] += value;
      bitIndex += bitIndex & -bitIndex;
    }
  }

  public sum(index: number): number {
    let bitIndex = index + 1;
    let sum = 0;

    while (bitIndex > 0) {
      sum += this.bit[bitIndex];
      bitIndex -= bitIndex & -bitIndex;
    }

    return sum;
  }

  public total(): number {
    return this.sum(this.size - 1);
  }

  public findByPrefix(value: number): number {
    let index = 0;
    let bitMask = 1;

    while (bitMask << 1 <= this.size) {
      bitMask <<= 1;
    }

    let remaining = value;

    for (; bitMask !== 0; bitMask >>= 1) {
      const nextIndex = index + bitMask;

      if (nextIndex <= this.size && this.bit[nextIndex] <= remaining) {
        remaining -= this.bit[nextIndex];
        index = nextIndex;
      }
    }

    return Math.min(this.size - 1, index);
  }
}
