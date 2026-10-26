import { defineConfig } from 'cypress';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import { unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeQrVideo } from './cypress/support/qr-video';

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
      const videoPath = join(tmpdir(), `zabay-camera-${process.pid}.y4m`);
      let cameraRegistration: { id: string; qr_pass_code: string; event_title: string } | null = null;

      on('before:spec', async (spec) => {
        if (!spec.relative.endsWith('camera.cy.ts')) return;
        const api = `http://127.0.0.1:${process.env.ZABAY_E2E_API_PORT || '5500'}`;
        const login = await fetch(`${api}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: process.env.CYPRESS_OPERATOR_USERNAME, password: process.env.CYPRESS_OPERATOR_PASSWORD }) });
        if (!login.ok) throw new Error(`Camera fixture login: HTTP ${login.status}`);
        const csrf = (await login.json()).csrfToken;
        const cookie = login.headers.get('set-cookie')?.split(';')[0] || '';
        const post = async (endpoint: string, body: object) => {
          const response = await fetch(`${api}${endpoint}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', cookie, 'x-csrf-token': csrf },
            body: JSON.stringify(body),
          });
          if (!response.ok) throw new Error(`Camera fixture API ${endpoint}: HTTP ${response.status}`);
          return (await response.json()).data;
        };
        const event = await post('/api/events', {
          title: `E2E camera ${randomUUID()}`,
          category: 'Community & Civic',
          event_type: 'public',
          is_private: false,
          start_date: '2035-12-11T08:00:00Z',
          end_date: '2035-12-11T17:00:00Z',
          organizer_id: 'usr-org-1',
          expected_attendance: 20,
          max_capacity: 100,
          ticket_price: 10,
        });
        const account = await fetch(`${api}/api/auth/register`, {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: 'Cypress Camera Attendee', email: `camera-${randomUUID()}@example.test`, password: 'camera-test-secret' }),
        });
        if (!account.ok) throw new Error(`Camera fixture account: HTTP ${account.status}`);
        const accountCsrf = (await account.json()).csrfToken;
        const accountCookie = account.headers.get('set-cookie')?.split(';')[0] || '';
        const registerResponse = await fetch(`${api}/api/attendees/register`, {
          method: 'POST', headers: { 'content-type': 'application/json', cookie: accountCookie, 'x-csrf-token': accountCsrf, origin: process.env.CYPRESS_BASE_URL || 'http://127.0.0.1:5174' },
          body: JSON.stringify({
          event_id: event.id,
          attendee_name: 'Cypress Camera Attendee',
          attendee_email: `camera-${randomUUID()}@example.test`,
          ticket_type: 'General Admission',
          }),
        });
        if (!registerResponse.ok) throw new Error(`Camera fixture registration: HTTP ${registerResponse.status}`);
        const registration = (await registerResponse.json()).data;
        cameraRegistration = { ...registration, event_title: event.title };
        writeQrVideo(videoPath, cameraRegistration.qr_pass_code);
      });

      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family !== 'chromium') return launchOptions;
        launchOptions.args.push('--use-fake-ui-for-media-stream');
        launchOptions.args.push('--use-fake-device-for-media-stream');
        launchOptions.args.push(`--use-file-for-fake-video-capture=${videoPath}`);
        return launchOptions;
      });

      on('task', {
        'camera:registration'() {
          if (!cameraRegistration) throw new Error('Camera registration was not created before the camera spec');
          return cameraRegistration;
        },
        // Synthetic fixtures use ONLY the disposable Cypress test DB, never API auth rate limits.
        async 'db:createSyntheticRosterPass'({ eventId }: { eventId: string }) {
          if (typeof eventId !== 'string' || eventId.length > 64 || !eventId) {
            throw new Error('A valid event ID is required for test roster fixtures');
          }
          const id = 'reg-e2e-' + randomUUID();
          const code = 'ZABAY-E2E-' + randomUUID().replaceAll('-', '').slice(0, 20);
          const email = 'roster-' + randomUUID() + '@example.test';
          const name = 'Browser Roster Attendee';
          await pool.query(
            'INSERT INTO registrations (id, event_id, attendee_name, attendee_email, ticket_type, qr_pass_code, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [id, eventId, name, email, 'VIP Access', code, 'confirmed']
          );
          return { id, event_id: eventId, attendee_name: name, attendee_email: email, qr_pass_code: code };
        },
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
        async 'db:eventBookingState'({ eventId }: { eventId: string }) {
          const result = await pool.query(
            `SELECT e.id, e.status, e.venue_id, e.hall_id,
                    count(b.id)::int AS booking_count
             FROM events e
             LEFT JOIN venue_bookings b ON b.event_id = e.id
             WHERE e.id = $1
             GROUP BY e.id`,
            [eventId]
          );
          return result.rows[0] || null;
        },
      });

      on('after:run', async () => {
        await pool.end();
        try { unlinkSync(videoPath); } catch { /* no fixture was created */ }
      });
    },
  },
});
