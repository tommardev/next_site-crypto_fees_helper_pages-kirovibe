#!/usr/bin/env node

// Build verification script for Netlify deployment
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying build configuration...');

// Check required files
const requiredFiles = [
  'package.json',
  'next.config.js',
  'tsconfig.json',
  'src/pages/index.tsx'
];

let hasErrors = false;

requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.error(`❌ Missing required file: ${file}`);
    hasErrors = true;
  } else {
    console.log(`✅ Found: ${file}`);
  }
});

// Check TypeScript dependencies
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const hasTypeScript = packageJson.dependencies?.typescript || packageJson.devDependencies?.typescript;
const hasTypesNode = packageJson.dependencies?.['@types/node'] || packageJson.devDependencies?.['@types/node'];

if (!hasTypeScript) {
  console.error('❌ Missing TypeScript dependency');
  hasErrors = true;
} else {
  console.log('✅ TypeScript dependency found');
}

if (!hasTypesNode) {
  console.error('❌ Missing @types/node dependency');
  hasErrors = true;
} else {
  console.log('✅ @types/node dependency found');
}

// Check environment variables
const envExample = fs.existsSync('.env.local.example');
if (envExample) {
  console.log('✅ Environment example file found');
} else {
  console.warn('⚠️  No .env.local.example file found');
}

if (hasErrors) {
  console.error('\n❌ Build verification failed');
  process.exit(1);
} else {
  console.log('\n✅ Build verification passed');
}