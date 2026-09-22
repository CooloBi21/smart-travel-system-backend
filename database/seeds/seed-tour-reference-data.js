require('dotenv').config({ quiet: true });

const { Client } = require('pg');

async function main() {
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
        `Safety stop: expected "${process.env.DB_TARGET_NAME}" ` +
          `but connected to "${databaseName}".`,
      );
    }

    const categories = [
      {
        code: 'PACKAGE_TOUR',
        name: 'Tour trọn gói',
        description:
          'Tour bao gồm lịch trình và các dịch vụ được đóng gói.',
      },
      {
        code: 'DAY_TOUR',
        name: 'Tour trong ngày',
        description:
          'Tour ngắn hạn được tổ chức trong một ngày.',
      },
      {
        code: 'CUSTOM_TOUR',
        name: 'Tour tùy chỉnh',
        description:
          'Tour có lịch trình linh hoạt theo nhu cầu khách hàng.',
      },
    ];

    for (const category of categories) {
      await client.query(
        `
          INSERT INTO public.tour_categories (
            code,
            name,
            description,
            is_active
          )
          VALUES ($1, $2, $3, TRUE)
          ON CONFLICT (code)
          DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            is_active = TRUE,
            updated_at = now()
        `,
        [
          category.code,
          category.name,
          category.description,
        ],
      );
    }

    const destinations = [
      {
        name: 'Đà Lạt',
        slug: 'da-lat',
        description:
          'Điểm đến du lịch tại Lâm Đồng.',
        locationName: 'Đà Lạt, Lâm Đồng, Việt Nam',
        latitude: 11.9404,
        longitude: 108.4583,
      },
      {
        name: 'Đà Nẵng',
        slug: 'da-nang',
        description:
          'Điểm đến du lịch tại miền Trung Việt Nam.',
        locationName: 'Đà Nẵng, Việt Nam',
        latitude: 16.0544,
        longitude: 108.2022,
      },
      {
        name: 'Phú Quốc',
        slug: 'phu-quoc',
        description:
          'Điểm đến du lịch biển đảo tại Kiên Giang.',
        locationName: 'Phú Quốc, Kiên Giang, Việt Nam',
        latitude: 10.2899,
        longitude: 103.9840,
      },
    ];

    for (const destination of destinations) {
      await client.query(
        `
          INSERT INTO public.destinations (
            name,
            slug,
            description,
            location_name,
            latitude,
            longitude,
            status
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            'ACTIVE'
          )
          ON CONFLICT (slug)
          DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            location_name = EXCLUDED.location_name,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            status = 'ACTIVE',
            updated_at = now()
        `,
        [
          destination.name,
          destination.slug,
          destination.description,
          destination.locationName,
          destination.latitude,
          destination.longitude,
        ],
      );
    }

    await client.query('COMMIT');

    console.log(
      'Tour reference data seeded successfully.',
    );
    console.log(`Database: ${databaseName}`);
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
    'Tour reference seed failed:',
    error.message,
  );

  process.exitCode = 1;
});
