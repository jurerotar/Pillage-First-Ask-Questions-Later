import { createHash } from 'node:crypto';

const hashCache = new Map<string, string>();

export const generateHashKey = (text: string): string => {
  if (hashCache.has(text)) {
    return hashCache.get(text)!;
  }
  const md5Hash = createHash('md5').update(text).digest('hex');
  const result = md5Hash.substring(0, 6);
  hashCache.set(text, result);

  return result;
};

type LocalizationObject = Record<string, string>;

export const transformToHashed = (
  obj: LocalizationObject,
): LocalizationObject => {
  const result: LocalizationObject = {};

  for (const [key, value] of Object.entries(obj)) {
    result[generateHashKey(key)] = value;
  }

  return result;
};
