export const formatNumberWithCommas = (number: number): string => {
  return number.toString().replaceAll(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const truncateToShortForm = (value: number): string => {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1_000_000) {
    const raw = absValue / 1_000_000;
    const truncated = Math.trunc(raw * 10) / 10;
    const intPart = Math.trunc(truncated);
    const showDecimal = intPart < 100;

    return `${sign}${showDecimal ? truncated : intPart}M`;
  }

  if (absValue >= 1000) {
    const raw = absValue / 1000;
    const truncated = Math.trunc(raw * 10) / 10;
    const intPart = Math.trunc(truncated);
    const showDecimal = intPart < 100;

    return `${sign}${showDecimal ? truncated : intPart}K`;
  }

  return `${value}`;
};

export const formatPercentage = (num: number, isIncreasing = true): string => {
  if (isIncreasing) {
    const percentage = (num - 1) * 100;
    return `${Math.round(percentage)}%`;
  }

  const percentage = num * 100;
  return `${Math.round(percentage)}%`;
};

export const formatNumber = (number: number): string => {
  if (!Number.isInteger(number)) {
    return 'NaN';
  }

  return number.toLocaleString();
};
