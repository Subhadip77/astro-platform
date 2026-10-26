const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const {
  getMigrationFiles,
  splitSqlStatements,
} = require('../src/db/migrate');
const db = require('../src/db/index');

const MIGRATIONS_DIR = path.resolve(__dirname, '../../db/migrations');

describe('Database Migrations (S10) — Structure and Integrity', () => {
  it('discovers all 11 required migrations in alphanumeric order', () => {
    const migrations = getMigrationFiles(MIGRATIONS_DIR);
    assert.strictEqual(migrations.length, 11);

    const expectedVersions = [
      '001', '002', '003', '004', '005',
      '006', '007', '008', '009', '010', '011',
    ];

    migrations.forEach((m, idx) => {
      assert.strictEqual(m.version, expectedVersions[idx]);
      assert(m.filename.endsWith('.sql'));
      assert(m.sql.length > 0);
    });
  });

  it('verifies all migration files specify InnoDB, utf8mb4, and utf8mb4_unicode_ci', () => {
    const migrations = getMigrationFiles(MIGRATIONS_DIR);

    for (const m of migrations) {
      assert(
        m.sql.includes('ENGINE=InnoDB'),
        `Migration ${m.filename} must specify ENGINE=InnoDB`
      );
      assert(
        m.sql.includes('CHARSET=utf8mb4'),
        `Migration ${m.filename} must specify CHARSET=utf8mb4`
      );
      assert(
        m.sql.includes('COLLATE=utf8mb4_unicode_ci'),
        `Migration ${m.filename} must specify COLLATE=utf8mb4_unicode_ci`
      );
    }
  });

  it('correctly splits multi-statement SQL strings and strips comments', () => {
    const sampleSql = `
      -- First comment line
      CREATE TABLE test_one (id INT PRIMARY KEY);
      /* Block comment */
      CREATE TABLE test_two (
        id INT PRIMARY KEY,
        name VARCHAR(50)
      );
    `;

    const statements = splitSqlStatements(sampleSql);
    assert.strictEqual(statements.length, 2);
    assert(statements[0].startsWith('CREATE TABLE test_one'));
    assert(statements[1].startsWith('CREATE TABLE test_two'));
  });

  it('validates leads table migration (003) contains encryption & consent fields', () => {
    const migrations = getMigrationFiles(MIGRATIONS_DIR);
    const leadsMigration = migrations.find((m) => m.version === '003');
    assert.ok(leadsMigration);

    assert(leadsMigration.sql.includes('encrypted_dob'));
    assert(leadsMigration.sql.includes('encrypted_tob'));
    assert(leadsMigration.sql.includes('whatsapp_number'));
    assert(leadsMigration.sql.includes('consent_given'));
    assert(leadsMigration.sql.includes('consent_timestamp'));
  });

  it('validates birth_profiles table migration (004) contains encryption and ayanamsa', () => {
    const migrations = getMigrationFiles(MIGRATIONS_DIR);
    const bpMigration = migrations.find((m) => m.version === '004');
    assert.ok(bpMigration);

    assert(bpMigration.sql.includes('encrypted_dob'));
    assert(bpMigration.sql.includes('encrypted_tob'));
    assert(bpMigration.sql.includes('ayanamsa'));
    assert(bpMigration.sql.includes('consent_given'));
  });

  it('validates api_cache table migration (005) contains hash key and expiration', () => {
    const migrations = getMigrationFiles(MIGRATIONS_DIR);
    const cacheMigration = migrations.find((m) => m.version === '005');
    assert.ok(cacheMigration);

    assert(cacheMigration.sql.includes('cache_key VARCHAR(64)'));
    assert(cacheMigration.sql.includes('response_data JSON'));
    assert(cacheMigration.sql.includes('expires_at TIMESTAMP'));
    assert(cacheMigration.sql.includes('uk_api_cache_key'));
  });

  it('validates astrologers table migration (008) contains configurable commission', () => {
    const migrations = getMigrationFiles(MIGRATIONS_DIR);
    const astroMigration = migrations.find((m) => m.version === '008');
    assert.ok(astroMigration);

    assert(astroMigration.sql.includes('commission_percentage'));
    assert(astroMigration.sql.includes('is_verified'));
    assert(astroMigration.sql.includes('languages JSON'));
    assert(astroMigration.sql.includes('specialities JSON'));
  });

  it('validates commissions table migration (010) contains financial audit ledger fields', () => {
    const migrations = getMigrationFiles(MIGRATIONS_DIR);
    const commMigration = migrations.find((m) => m.version === '010');
    assert.ok(commMigration);

    assert(commMigration.sql.includes('total_amount'));
    assert(commMigration.sql.includes('commission_rate'));
    assert(commMigration.sql.includes('platform_fee'));
    assert(commMigration.sql.includes('astrologer_payout'));
    assert(commMigration.sql.includes('payout_status'));
  });

  it('validates blog_meta table migration (011) contains localized slug mapping', () => {
    const migrations = getMigrationFiles(MIGRATIONS_DIR);
    const blogMigration = migrations.find((m) => m.version === '011');
    assert.ok(blogMigration);

    assert(blogMigration.sql.includes('slug'));
    assert(blogMigration.sql.includes('language'));
    assert(blogMigration.sql.includes('translation_of'));
    assert(blogMigration.sql.includes('uk_blog_slug_lang'));
  });

  it('validates database client module exports transaction and query helpers', () => {
    assert.strictEqual(typeof db.getPool, 'function');
    assert.strictEqual(typeof db.query, 'function');
    assert.strictEqual(typeof db.withTransaction, 'function');
    assert.strictEqual(typeof db.closePool, 'function');
  });
});
