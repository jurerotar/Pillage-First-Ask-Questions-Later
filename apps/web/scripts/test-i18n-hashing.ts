#!/usr/bin/env node

import {
  createKeyMapping,
  generateHashKey,
  transformToHashed,
} from './i18n-hash-utils';

// Test data with various edge cases
const testData = {
  'Simple Key': 'Simple Value',
  '{{variable}} with interpolation': '{{variable}} with interpolation',
  'Key with {{count}} and {{unit}}': 'Key with {{count}} and {{unit}}',
  Nested: {
    'Child Key': 'Child Value',
    'Another Child': 'Another Value',
  },
  'Plural Forms_one': 'Plural Forms_one',
  'Plural Forms_other': 'Plural Forms_other',
  'Special Characters !@#$%^&*()': 'Special Characters !@#$%^&*()',
  'Unicode ñáéíóú 🚀': 'Unicode ñáéíóú 🚀',
};

console.log('Testing i18n hashing functionality...\n');

// Test 1: Basic hashing function
console.log('1. Testing basic hash generation:');
const testString = 'Test String';
const hash1 = generateHashKey(testString);
const hash2 = generateHashKey(testString);
console.log(`   Input: "${testString}"`);
console.log(`   Hash 1: "${hash1}"`);
console.log(`   Hash 2: "${hash2}"`);
console.log(`   Consistent: ${hash1 === hash2 ? '✓' : '✗'}`);
console.log(`   Length: ${hash1.length} chars\n`);

// Test 2: Different inputs produce different hashes
console.log('2. Testing uniqueness:');
const hashA = generateHashKey('Input A');
const hashB = generateHashKey('Input B');
console.log(`   "Input A" -> "${hashA}"`);
console.log(`   "Input B" -> "${hashB}"`);
console.log(`   Unique: ${hashA !== hashB ? '✓' : '✗'}\n`);

// Test 3: Transform to hashed object
console.log('3. Testing object transformation:');
const transformed = transformToHashed(testData);
console.log(`   Original keys: ${Object.keys(testData).length}`);
console.log(`   Transformed keys: ${Object.keys(transformed).length}`);
console.log(
  `   Transformation successful: ${Object.keys(transformed).every((key) => /^[a-zA-Z0-9]{6}$/.test(key)) ? '✓' : '✗'}\n`,
);

// Test 4: Key mapping creation
console.log('4. Testing key mapping:');
const mapping = createKeyMapping(testData);
console.log(
  `   Mapping created: ${Object.keys(mapping).length > 0 ? '✓' : '✗'}`,
);
console.log(
  `   Sample mapping: "${Object.keys(mapping)[0]}" -> "${mapping[Object.keys(mapping)[0]]}"\n`,
);

// Test 5: Interpolation preservation
console.log('5. Testing interpolation preservation:');
const originalValue = '{{variable}} with interpolation';
const testObj = { [originalValue]: originalValue };
const transformedObj = transformToHashed(testObj);
const transformedKey = Object.keys(transformedObj)[0];
const transformedValue = transformedObj[transformedKey];
console.log(`   Original: "${originalValue}"`);
console.log(`   Transformed value: "${transformedValue}"`);
console.log(
  `   Interpolation preserved: ${transformedValue.includes('{{variable}}') ? '✓' : '✗'}\n`,
);

// Test 6: Nested objects
console.log('6. Testing nested object handling:');
const nestedTestData = {
  Level1: {
    Level2: {
      Level3: 'Deep Value',
    },
    Sibling: 'Sibling Value',
  },
};
const nestedTransformed = transformToHashed(nestedTestData);
console.log(
  `   Nested structure preserved: ${typeof nestedTransformed[generateHashKey('Level1')] === 'object' ? '✓' : '✗'}`,
);
console.log(
  `   Deep nesting preserved: ${nestedTransformed[generateHashKey('Level1')][generateHashKey('Level2')][generateHashKey('Level3')] === 'Deep Value' ? '✓' : '✗'}\n`,
);

// Test 7: Collision resistance (basic check)
console.log('7. Testing collision resistance:');
const testInputs = Array.from({ length: 100 }, (_, i) => `Test input ${i}`);
const hashes = testInputs.map((input) => generateHashKey(input));
const uniqueHashes = new Set(hashes);
console.log(`   Generated ${hashes.length} hashes`);
console.log(`   Unique hashes: ${uniqueHashes.size}`);
console.log(`   Collisions: ${hashes.length - uniqueHashes.size}`);
console.log(
  `   No collisions: ${hashes.length === uniqueHashes.size ? '✓' : '⚠'}\n`,
);

// Test 8: Hash length consistency
console.log('8. Testing hash length consistency:');
const lengths = hashes.map((h) => h.length);
const allSixChars = lengths.every((len) => len === 6);
console.log(`   All hashes 6 characters: ${allSixChars ? '✓' : '✗'}`);
if (!allSixChars) {
  console.log(`   Lengths: ${[...new Set(lengths)].sort().join(', ')}`);
}
console.log('');

console.log('Hashing tests completed!');
