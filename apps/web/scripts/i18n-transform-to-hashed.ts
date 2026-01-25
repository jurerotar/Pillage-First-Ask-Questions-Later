#!/usr/bin/env node

import { readFile, writeFile, readdir, mkdir } from 'fs/promises';
import { resolve, join } from 'path';
import { generateHashKey, transformToHashed, createKeyMapping } from './i18n-hash-utils';

interface TransformOptions {
  inputDir: string;
  outputDir: string;
  locale: string;
  namespace?: string;
}

async function transformLocalizationFiles(options: TransformOptions): Promise<void> {
  const { inputDir, outputDir, locale, namespace } = options;
  
  // Create output directory if it doesn't exist
  try {
    await mkdir(outputDir, { recursive: true });
  } catch (error) {
    // Ignore if directory already exists
  }
  
  if (namespace) {
    // Transform a specific namespace file
    const inputFile = join(inputDir, locale, 'extracted', `${namespace}.json`);
    const outputFile = join(outputDir, locale, 'hashed', `${namespace}.json`);
    
    try {
      const content = await readFile(inputFile, 'utf-8');
      const json = JSON.parse(content);
      
      const hashedObj = transformToHashed(json);
      const hashedContent = JSON.stringify(hashedObj, null, 2);
      
      // Ensure output directory exists
      await mkdir(join(outputDir, locale, 'hashed'), { recursive: true });
      
      await writeFile(outputFile, hashedContent, 'utf-8');
      console.log(`Transformed ${inputFile} -> ${outputFile}`);
      
      // Create key mapping file for development/debugging
      const mapping = createKeyMapping(json);
      const mappingOutputFile = join(outputDir, locale, 'hashed', `${namespace}.mapping.json`);
      const mappingContent = JSON.stringify(mapping, null, 2);
      await writeFile(mappingOutputFile, mappingContent, 'utf-8');
      console.log(`Created mapping file: ${mappingOutputFile}`);
    } catch (error) {
      console.error(`Error transforming ${inputFile}:`, error);
    }
  } else {
    // Transform all namespace files in the extracted directory
    const extractedDir = join(inputDir, locale, 'extracted');
    const files = await readdir(extractedDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const namespaceName = file.replace('.json', '');
        await transformLocalizationFiles({
          inputDir,
          outputDir,
          locale,
          namespace: namespaceName
        });
      }
    }
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  // Default values
  const inputDir = args.find(arg => arg.startsWith('--input='))?.split('=')[1] || './app/localization/locales';
  const outputDir = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || './app/localization/locales';
  const locale = args.find(arg => arg.startsWith('--locale='))?.split('=')[1] || 'en-US';
  const namespace = args.find(arg => arg.startsWith('--namespace='))?.split('=')[1];
  
  console.log(`Transforming localization files...`);
  console.log(`Input directory: ${inputDir}`);
  console.log(`Output directory: ${outputDir}`);
  console.log(`Locale: ${locale}`);
  if (namespace) {
    console.log(`Namespace: ${namespace}`);
  }
  
  await transformLocalizationFiles({
    inputDir,
    outputDir,
    locale,
    namespace
  });
  
  console.log('Transformation completed!');
}

if (require.main === module) {
  main().catch(error => {
    console.error('Error during transformation:', error);
    process.exit(1);
  });
}