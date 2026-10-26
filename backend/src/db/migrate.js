#!/usr/bin/env node

/**
 * Astro Platform — Database Migration Runner
 *
 * Runs SQL migrations sequentially from db/migrations/ in alphanumeric order.
 * Tracks applied migrations in the schema_migrations table.
 */

const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');
const { config } = require('../config');

const DEFAULT_MIGRATIONS_DIR = path.resolve(__dirname, '../../../db/migrations');

function getMigrationFiles(migrationsDir = DEFAULT_MIGRATIONS_DIR) {
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found at: ${migrationsDir}`);
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  return files.map((filename) => {
    const fullPath = path.join(migrationsDir, filename);
    const sql = fs.readFileSync(fullPath, 'utf8');
    const version = filename.split('_')[0];
    const name = filename.replace(/\.sql$/, '');
    return {
      version,
      filename,
      name,
      fullPath,
      sql,
    };
  });
}

function splitSqlStatements(sql) {
  // Strip block comments (/* ... */) and line comments (-- ...)
  const cleanSql = sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');

  return cleanSql
    .split(';')
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0);
}

async function ensureDatabaseAndTable(migrationsDir = DEFAULT_MIGRATIONS_DIR) {
  // Connect without DB first to ensure target DB exists
  const adminConnection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    charset: 'utf8mb4_unicode_ci',
  });

  try {
    await adminConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.db.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
  } finally {
    await adminConnection.end();
  }

  // Connect to the database
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
    charset: 'utf8mb4_unicode_ci',
  });

  // Ensure schema_migrations exists
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      version VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  return connection;
}

async function getAppliedMigrations(connection) {
  const [rows] = await connection.query(
    'SELECT version, name, applied_at FROM schema_migrations ORDER BY version ASC;'
  );
  return rows;
}

async function migrateUp(migrationsDir = DEFAULT_MIGRATIONS_DIR, options = {}) {
  const logger = options.logger || console;
  const connection = await ensureDatabaseAndTable(migrationsDir);

  try {
    const appliedRows = await getAppliedMigrations(connection);
    const appliedVersions = new Set(appliedRows.map((r) => r.version));
    const allMigrations = getMigrationFiles(migrationsDir);

    const pending = allMigrations.filter((m) => !appliedVersions.has(m.version));

    if (pending.length === 0) {
      logger.log('✓ Database schema is already up to date. No pending migrations.');
      return { appliedCount: 0, applied: [] };
    }

    logger.log(`Found ${pending.length} pending migration(s). Applying...`);
    const appliedNow = [];

    for (const migration of pending) {
      logger.log(`  Applying: ${migration.filename}...`);
      const statements = splitSqlStatements(migration.sql);

      for (const statement of statements) {
        await connection.query(statement);
      }

      await connection.query(
        'INSERT INTO schema_migrations (version, name) VALUES (?, ?);',
        [migration.version, migration.name]
      );

      appliedNow.push(migration.name);
      logger.log(`  ✓ Applied:  ${migration.filename}`);
    }

    logger.log(`\n✓ Successfully applied ${appliedNow.length} migration(s).`);
    return { appliedCount: appliedNow.length, applied: appliedNow };
  } finally {
    await connection.end();
  }
}

async function migrateStatus(migrationsDir = DEFAULT_MIGRATIONS_DIR, options = {}) {
  const logger = options.logger || console;
  const connection = await ensureDatabaseAndTable(migrationsDir);

  try {
    const appliedRows = await getAppliedMigrations(connection);
    const appliedMap = new Map(appliedRows.map((r) => [r.version, r]));
    const allMigrations = getMigrationFiles(migrationsDir);

    logger.log('\n======================================================');
    logger.log('        ASTRO PLATFORM — MIGRATION STATUS             ');
    logger.log('======================================================');
    logger.log('Version | Status  | Migration Name             | Applied At');
    logger.log('--------|---------|----------------------------|-------------------');

    for (const m of allMigrations) {
      const applied = appliedMap.get(m.version);
      const status = applied ? 'APPLIED' : 'PENDING';
      const appliedAt = applied ? new Date(applied.applied_at).toISOString() : '-';
      logger.log(
        `${m.version.padEnd(7)} | ${status.padEnd(7)} | ${m.name.padEnd(26)} | ${appliedAt}`
      );
    }
    logger.log('======================================================\n');

    return {
      total: allMigrations.length,
      applied: appliedRows.length,
      pending: allMigrations.length - appliedRows.length,
    };
  } finally {
    await connection.end();
  }
}

module.exports = {
  getMigrationFiles,
  splitSqlStatements,
  migrateUp,
  migrateStatus,
};

if (require.main === module) {
  const command = process.argv[2] || 'up';
  if (command === 'status') {
    migrateStatus()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error('\n✗ Migration status check failed:', err.message);
        process.exit(1);
      });
  } else {
    migrateUp()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error('\n✗ Migration failed:', err.message);
        process.exit(1);
      });
  }
}
