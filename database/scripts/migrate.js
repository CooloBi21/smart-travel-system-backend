require('dotenv').config({ quiet: true });

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Client } = require('pg');

const MIGRATIONS_DIR = path.join(
  process.cwd(),
  'database',
  'migrations'
);

function buildConnectionConfig() {
  // Sau này dùng được với Supabase / cloud PostgreSQL.
  if (process.env.MIGRATION_DATABASE_URL) {
    return {
      connectionString: process.env.MIGRATION_DATABASE_URL,
      ssl:
        process.env.DB_SSL === 'true'
          ? { rejectUnauthorized: false }
          : undefined
    };
  }

  const required = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_TARGET_NAME'
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing database configuration: ${missing.join(', ')}`
    );
  }

  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_TARGET_NAME,
    ssl:
      process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false
  };
}

function checksum(content) {
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex');
}

async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      checksum CHAR(64) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
  }

  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => /^\d{3}_.+\.sql$/.test(file))
    .sort();
}

async function main() {
  const client = new Client(buildConnectionConfig());

  let lockAcquired = false;

  try {
    await client.connect();

    const dbInfo = await client.query(`
      SELECT
        current_database() AS database_name,
        current_user
    `);

    console.log('\n========================================');
    console.log(' Smart Travel System - DB Migration');
    console.log('========================================');
    console.table(dbInfo.rows);

    await client.query(
      `SELECT pg_advisory_lock(hashtext($1))`,
      ['smart_travel_system_schema_migrations']
    );

    lockAcquired = true;

    await ensureMigrationTable(client);

    const appliedResult = await client.query(`
      SELECT version, checksum
      FROM schema_migrations
      ORDER BY version
    `);

    const applied = new Map(
      appliedResult.rows.map((row) => [
        row.version,
        row.checksum.trim()
      ])
    );

    const files = getMigrationFiles();

    if (files.length === 0) {
      console.log('\nNo migration files found.');
      console.log('Migration system initialized successfully.');
      return;
    }

    let appliedCount = 0;

    for (const file of files) {
      const fullPath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(fullPath, 'utf8').replace(/^\uFEFF/, '');
      const fileChecksum = checksum(sql);

      if (applied.has(file)) {
        const storedChecksum = applied.get(file);

        if (storedChecksum !== fileChecksum) {
          throw new Error(
            `Migration "${file}" was already applied but its checksum changed.`
          );
        }

        console.log(`[SKIP] ${file}`);
        continue;
      }

      console.log(`\n[APPLY] ${file}`);

      await client.query('BEGIN');

      try {
        await client.query(sql);

        await client.query(
          `
          INSERT INTO schema_migrations (
            version,
            checksum
          )
          VALUES ($1, $2)
          `,
          [file, fileChecksum]
        );

        await client.query('COMMIT');

        appliedCount++;
        console.log(`[OK] ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');

        throw new Error(
          `Migration "${file}" failed: ${err.message}`
        );
      }
    }

    console.log('\n========================================');
    console.log(`Applied migrations: ${appliedCount}`);
    console.log('Database migration completed successfully.');
    console.log('========================================');

  } catch (err) {
    console.error('\nMIGRATION FAILED');
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    if (lockAcquired) {
      try {
        await client.query(
          `SELECT pg_advisory_unlock(hashtext($1))`,
          ['smart_travel_system_schema_migrations']
        );
      } catch (_) {
        // Ignore unlock errors during shutdown.
      }
    }

    await client.end().catch(() => {});
  }
}

main();
