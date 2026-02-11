import crypto from 'node:crypto';

/**
 * Generates a hash key from the input text using MD5 and returns a shortened base62 representation
 * @param text The input text to hash
 * @returns A 6-character base62 hash key
 */
export function generateHashKey(text: string): string {
  // Create MD5 hash of the input text
  const md5Hash = crypto.createHash('md5').update(text).digest('hex');

  // Convert first 6 bytes of hash to base62 for a shorter, readable key
  // Take first 6 characters of hex (3 bytes = 24 bits) and convert to base62
  const hexSegment = md5Hash.substring(0, 6);
  const num = Number.parseInt(hexSegment, 16);

  // Base62 alphabet (0-9, a-z, A-Z)
  const alphabet =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  let value = num;

  // Convert to base62
  if (value === 0) {
    return '0';
  }

  while (value > 0) {
    result = alphabet[value % 62] + result;
    value = Math.floor(value / 62);
  }

  // Pad to ensure consistent length (6 chars)
  return result.padStart(6, '0').substring(0, 6);
}

/**
 * Transforms a localization object by replacing keys with hash keys
 * @param obj The localization object to transform
 * @returns A new object with hashed keys
 */
export function transformToHashed(
  obj: Record<string, any>,
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively transform nested objects
      result[generateHashKey(key)] = transformToHashed(value);
    } else {
      // Transform the key but keep the value as is
      result[generateHashKey(key)] = value;
    }
  }

  return result;
}

/**
 * Creates a mapping between original keys and hashed keys
 * @param obj The localization object to create mapping for
 * @returns An object with hashed keys as properties and original keys as values
 */
export function createKeyMapping(
  obj: Record<string, any>,
): Record<string, string> {
  const mapping: Record<string, string> = {};

  function traverse(current: Record<string, any>, prefix = ''): void {
    for (const [key, value] of Object.entries(current)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        // Recursively traverse nested objects
        traverse(value, fullKey);
      } else {
        // Map the hash of the full key path to the full key path itself
        const hashKey = generateHashKey(fullKey);
        mapping[hashKey] = fullKey;
      }
    }
  }

  traverse(obj);
  return mapping;
}
