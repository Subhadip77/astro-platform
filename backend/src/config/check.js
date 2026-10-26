#!/usr/bin/env node

const path = require('node:path');
const fs = require('node:fs');
const dotenv = require('dotenv');
const { loadConfig, getSafeConfigSummary, ConfigValidationError } = require('./loadConfig');

const repoRootEnv = path.resolve(__dirname, '../../../.env');
const cwdEnv = path.resolve(process.cwd(), '.env');

if (fs.existsSync(repoRootEnv)) {
  dotenv.config({ path: repoRootEnv });
} else if (fs.existsSync(cwdEnv)) {
  dotenv.config({ path: cwdEnv });
} else {
  dotenv.config();
}

try {
  const config = loadConfig(process.env);
  const summary = getSafeConfigSummary(config);

  console.log('====================================================');
  console.log('    ASTRO PLATFORM — CONFIGURATION VERIFICATION     ');
  console.log('====================================================');
  console.log(JSON.stringify(summary, null, 2));
  console.log('----------------------------------------------------');
  console.log('✓ Configuration is valid. All required keys loaded.');
  console.log('====================================================');
  process.exit(0);
} catch (error) {
  console.error('\n✗ Configuration Check Failed:');
  if (error instanceof ConfigValidationError) {
    console.error(error.message);
  } else {
    console.error(error.message || error);
  }
  process.exit(1);
}
