export const partition = <T>(
  array: T[],
  predicate: (element: T) => boolean,
): [T[], T[]] => {
  const truthy: T[] = [];
  const falsy: T[] = [];

  for (let i = 0, len = array.length; i < len; i += 1) {
    const el = array[i];
    if (predicate(el)) {
      truthy.push(el);
    } else {
      falsy.push(el);
    }
  }

  return [truthy, falsy];
};
