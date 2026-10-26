const path = require('node:path');
const fs = require('node:fs');
const dotenv = require('dotenv');
const {
  loadConfig,
  getSafeConfigSummary,
  deepFreeze,
  ConfigValidationError,
} = require('./loadConfig');

const repoRootEnv = path.resolve(__dirname, '../../../.env');
const cwdEnv = path.resolve(process.cwd(), '.env');

if (fs.existsSync(repoRootEnv)) {
  dotenv.config({ path: repoRootEnv });
} else if (fs.existsSync(cwdEnv)) {
  dotenv.config({ path: cwdEnv });
} else {
  dotenv.config();
}

const rawConfig = loadConfig(process.env);

// Attach helper references and freeze the exported config
const configWithHelpers = {
  ...rawConfig,
  loadConfig,
  getSafeConfigSummary,
  deepFreeze,
  ConfigValidationError,
};

// Also attach a self-reference `config` property so both default require and destructured `{ config }` work
configWithHelpers.config = configWithHelpers;

const frozenConfig = deepFreeze(configWithHelpers);

module.exports = frozenConfig;
