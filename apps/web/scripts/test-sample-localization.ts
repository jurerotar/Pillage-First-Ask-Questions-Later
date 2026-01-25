#!/usr/bin/env node

import { readFile } from 'fs/promises';
import { join } from 'path';
import { transformToHashed, createKeyMapping } from './i18n-hash-utils';

async function testSampleLocalization() {
  console.log('Testing with sample localization files...\n');
  
  try {
    // Load the actual app.json file
    const appJsonPath = join(process.cwd(), 'app', 'localization', 'locales', 'en-US', 'extracted', 'app.json');
    const appJsonContent = await readFile(appJsonPath, 'utf-8');
    const appJson = JSON.parse(appJsonContent);
    
    console.log(`Loaded app.json with ${Object.keys(appJson).length} keys\n`);
    
    // Test transformation
    console.log('1. Testing transformation of app.json:');
    const startTime = Date.now();
    const hashedAppJson = transformToHashed(appJson);
    const endTime = Date.now();
    
    console.log(`   Original keys: ${Object.keys(appJson).length}`);
    console.log(`   Transformed keys: ${Object.keys(hashedAppJson).length}`);
    console.log(`   Transformation time: ${endTime - startTime}ms`);
    console.log(`   Keys match: ${Object.keys(appJson).length === Object.keys(hashedAppJson).length ? '✓' : '✗'}\n`);
    
    // Verify that values are preserved
    console.log('2. Verifying value preservation:');
    const originalValues = Object.values(appJson);
    const hashedValues = Object.values(hashedAppJson);
    const valuesPreserved = originalValues.every((val, idx) => val === hashedValues[idx]);
    console.log(`   Values preserved: ${valuesPreserved ? '✓' : '✗'}`);
    
    // Show a few examples
    const sampleKeys = Object.keys(appJson).slice(0, 3);
    console.log('   Sample transformations:');
    for (const key of sampleKeys) {
      const hashedKey = Object.keys(hashedAppJson).find(hk => hashedAppJson[hk] === appJson[key]);
      if (hashedKey) {
        console.log(`     "${key}" -> "${hashedKey}"`);
      }
    }
    console.log('');
    
    // Test key mapping creation
    console.log('3. Testing key mapping creation:');
    const mappingStartTime = Date.now();
    const keyMapping = createKeyMapping(appJson);
    const mappingEndTime = Date.now();
    
    console.log(`   Mapping entries: ${Object.keys(keyMapping).length}`);
    console.log(`   Mapping time: ${mappingEndTime - mappingStartTime}ms`);
    
    // Show a few mapping examples
    const mappingEntries = Object.entries(keyMapping).slice(0, 3);
    console.log('   Sample mappings:');
    for (const [hash, original] of mappingEntries) {
      console.log(`     "${hash}" -> "${original}"`);
    }
    console.log('');
    
    // Test interpolation preservation in real data
    console.log('4. Testing interpolation preservation in real data:');
    const interpolationKeys = Object.keys(appJson).filter(key => 
      key.includes('{{') && key.includes('}}')
    );
    
    if (interpolationKeys.length > 0) {
      console.log(`   Found ${interpolationKeys.length} keys with interpolation`);
      console.log('   Sample interpolated values:');
      
      for (const key of interpolationKeys.slice(0, 3)) {
        const hashedKey = Object.keys(hashedAppJson).find(hk => hashedAppJson[hk] === appJson[key]);
        console.log(`     Original: "${key}"`);
        console.log(`     Value: "${appJson[key]}"`);
        console.log(`     Hashed key: "${hashedKey}"`);
        console.log('');
      }
    } else {
      console.log('   No interpolation keys found in sample');
    }
    
    // Calculate size difference
    console.log('5. Calculating size difference:');
    const originalSize = Buffer.byteLength(JSON.stringify(appJson), 'utf8');
    const hashedSize = Buffer.byteLength(JSON.stringify(hashedAppJson), 'utf8');
    const sizeReduction = ((originalSize - hashedSize) / originalSize) * 100;
    
    console.log(`   Original size: ${originalSize.toLocaleString()} bytes`);
    console.log(`   Hashed size: ${hashedSize.toLocaleString()} bytes`);
    console.log(`   Size reduction: ${sizeReduction.toFixed(2)}%`);
    console.log(`   Bytes saved: ${(originalSize - hashedSize).toLocaleString()}\n`);
    
    console.log('✅ Sample localization tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during sample localization test:', error);
    process.exit(1);
  }
}

testSampleLocalization();