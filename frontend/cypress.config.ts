import { defineConfig } from 'cypress';
import { Pool } from 'pg';

const testDatabaseUrl = process.env.ZABAY_E2E_DATABASE_URL;

function assertTestDatabase(url: string | undefined): string {
  if (!url) {
    throw new Error('ZABAY_E2E_DATABASE_URL is required. Run test:e2e:local or configure an isolated test database.');
  }

  const databaseName = decodeURIComponent(new URL(url).pathname.slice(1));
  if (!/(^|[_-])test([_-]|$)/i.test(databaseName)) {
    throw new Error('Refusing Cypress database access: database name must contain a test segment.');
  }

  return url;
}

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://127.0.0.1:5174',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1440,
    viewportHeight: 900,
    retries: 0,
    video: false,
    setupNodeEvents(on) {
      const pool = new Pool({ connectionString: assertTestDatabase(testDatabaseUrl), max: 2 });

      on('task', {
        async 'db:registrationState'({ registrationId }: { registrationId: string }) {
          const result = await pool.query(
            `SELECT r.id, r.event_id, r.status, r.qr_pass_code,
                    count(a.id)::int AS attendance_count
             FROM registrations r
             LEFT JOIN attendance_records a ON a.registration_id = r.id
             WHERE r.id = $1
             GROUP BY r.id`,
            [registrationId]
          );
          return result.rows[0] || null;
        },
        async 'db:registrationCountByEmail'({ email }: { email: string }) {
          const result = await pool.query(
            'SELECT count(*)::int AS count FROM registrations WHERE attendee_email = $1',
            [email]
          );
          return result.rows[0].count as number;
        },
      });

      on('after:run', () => pool.end());
    },
  },
});
