require('dotenv').config({ quiet: true });

const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const PASSWORD_ROUNDS = 12;

async function main() {
  const email = process.env.SEED_COMPANY_ADMIN_EMAIL
    ?.trim()
    .toLowerCase();

  const password =
    process.env.SEED_COMPANY_ADMIN_PASSWORD;

  const fullName =
    process.env.SEED_COMPANY_ADMIN_FULL_NAME?.trim();

  if (!email || !password || !fullName) {
    throw new Error(
      'Missing SEED_COMPANY_ADMIN_EMAIL, ' +
        'SEED_COMPANY_ADMIN_PASSWORD or ' +
        'SEED_COMPANY_ADMIN_FULL_NAME.',
    );
  }

  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_TARGET_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
  });

  try {
    await client.connect();
    await client.query('BEGIN');

    const databaseResult = await client.query(`
      SELECT current_database() AS database_name
    `);

    const databaseName =
      databaseResult.rows[0]?.database_name;

    if (databaseName !== process.env.DB_TARGET_NAME) {
      throw new Error(
        `Safety stop: expected database "${process.env.DB_TARGET_NAME}" ` +
          `but connected to "${databaseName}".`,
      );
    }

    const roleResult = await client.query(`
      SELECT id
      FROM public.roles
      WHERE code = 'COMPANY_ADMIN'
      LIMIT 1
    `);

    const companyAdminRole = roleResult.rows[0];

    if (!companyAdminRole) {
      throw new Error(
        'COMPANY_ADMIN role does not exist.',
      );
    }

    const existingResult = await client.query(
      `
        SELECT
          u.id,
          u.password_hash,
          u.full_name,
          u.is_active,
          r.code AS role_code
        FROM public.users u
        INNER JOIN public.roles r
          ON r.id = u.role_id
        WHERE LOWER(u.email) = LOWER($1)
        LIMIT 1
      `,
      [email],
    );

    const existingUser = existingResult.rows[0];

    if (existingUser) {
      if (
        existingUser.role_code !== 'COMPANY_ADMIN'
      ) {
        throw new Error(
          'Safety stop: seed email already belongs to a non-COMPANY_ADMIN account.',
        );
      }

      const passwordMatches =
        await bcrypt.compare(
          password,
          existingUser.password_hash,
        );

      const shouldUpdate =
        !passwordMatches ||
        existingUser.full_name !== fullName ||
        existingUser.is_active !== true;

      if (shouldUpdate) {
        const passwordHash = passwordMatches
          ? existingUser.password_hash
          : await bcrypt.hash(
              password,
              PASSWORD_ROUNDS,
            );

        await client.query(
          `
            UPDATE public.users
            SET
              full_name = $1,
              password_hash = $2,
              is_active = TRUE
            WHERE id = $3
          `,
          [
            fullName,
            passwordHash,
            existingUser.id,
          ],
        );

        console.log(
          'COMPANY_ADMIN seed updated.',
        );
      } else {
        console.log(
          'COMPANY_ADMIN seed already up to date.',
        );
      }
    } else {
      const passwordHash = await bcrypt.hash(
        password,
        PASSWORD_ROUNDS,
      );

      await client.query(
        `
          INSERT INTO public.users (
            role_id,
            email,
            password_hash,
            full_name,
            is_active
          )
          VALUES ($1, $2, $3, $4, TRUE)
        `,
        [
          companyAdminRole.id,
          email,
          passwordHash,
          fullName,
        ],
      );

      console.log(
        'COMPANY_ADMIN seed created.',
      );
    }

    await client.query('COMMIT');

    console.log(`Database: ${databaseName}`);
    console.log(`Company admin email: ${email}`);
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {}

    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(
    'COMPANY_ADMIN seed failed:',
    error.message,
  );

  process.exitCode = 1;
});
