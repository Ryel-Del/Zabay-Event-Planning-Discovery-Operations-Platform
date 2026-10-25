const assert = require('node:assert/strict');
const test = require('node:test');
const request = require('supertest');
const { randomUUID, scryptSync } = require('node:crypto');

const databaseUrl = process.env.TEST_DATABASE_URL;
if (databaseUrl) {
  const dbName = decodeURIComponent(new URL(databaseUrl).pathname.slice(1));
  if (!/(^|[_-])test([_-]|$)/i.test(dbName)) {
    throw new Error('Event roster integration tests require an explicitly named disposable test database.');
  }
  process.env.DATABASE_URL = databaseUrl;
}
process.env.OPERATOR_USERNAME = 'roster-test-operator';
process.env.OPERATOR_PASSWORD = 'roster-test-operator-secret';
const { app } = require('../dist/app');
const { pool } = require('../dist/config/db');

test('event roster access boundaries with disposable PostgreSQL', { skip: !databaseUrl }, async t => {
  const tag = randomUUID();
  const ownerId = `usr-roster-${tag}`;
  const outsiderId = `usr-roster-other-${tag}`;
  const attendeeId = `usr-roster-attendee-${tag}`;
  const eventId = `evt-roster-${tag}`;
  const otherId = `evt-roster-other-${tag}`;
  const salt = 'unique-roster-test-salt';
  const password = 'roster-test-password-long';
  const hash = scryptSync(password, salt, 64).toString('hex');
  try {
    await pool.query(
      `INSERT INTO users (id, name, email, role, password_hash, password_salt)
       VALUES ($1, 'Roster Owner', $2, 'organizer', $3, $4),
              ($5, 'Other Organizer', $6, 'organizer', $3, $4)`,
      [ownerId, `owner-${tag}@example.test`, hash, salt, outsiderId, `other-${tag}@example.test`]
    );
    await pool.query(
      `INSERT INTO events (id, title, category, organizer_id, start_date, end_date)
       VALUES ($1, 'Roster Test Event', 'test', $2, '2031-01-01', '2031-01-02'),
              ($3, 'Foreign Roster Event', 'test', $4, '2031-01-01', '2031-01-02')`,
      [eventId, ownerId, otherId, outsiderId]
    );

    const path = `/api/events/${eventId}/registrations`;
    await t.test('guests are denied without seeing roster information', async () => {
      const result = await request(app).get(path);
      assert.equal(result.status, 401);
      assert.equal(JSON.stringify(result.body).includes('attendee_email'), false);
    });
    const owner = request.agent(app);
    const other = request.agent(app);
    const operator = request.agent(app);
    const ownerLogin = await owner.post('/api/auth/user-login').send({ email: `owner-${tag}@example.test`, password });
    assert.equal(ownerLogin.status, 200);
    assert.equal((await other.post('/api/auth/user-login').send({ email: `other-${tag}@example.test`, password })).status, 200);
    assert.equal((await operator.post('/api/auth/login').send({ username: process.env.OPERATOR_USERNAME, password: process.env.OPERATOR_PASSWORD })).status, 200);

    await t.test('foreign organizer cannot inspect another event roster', async () => {
      const result = await other.get(path);
      assert.equal(result.status, 403);
      assert.equal(JSON.stringify(result.body).includes('attendee_email'), false);
    });
    await t.test('owner and operator can read an empty roster', async () => {
      for (const agent of [owner, operator]) {
        const result = await agent.get(path);
        assert.equal(result.status, 200);
        assert.equal(result.body.data.total, 0);
        assert.deepEqual(result.body.data.registrations, []);
        assert.equal(result.body.data.summary.registered, 0);
      }
    });
    await t.test('nonexistent event is not a roster', async () => {
      assert.equal((await owner.get('/api/events/missing-roster-event/registrations')).status, 404);
    });
    const ownRegistration = `reg-${randomUUID()}`;
    const foreignRegistration = `reg-${randomUUID()}`;
    await pool.query(
      `INSERT INTO registrations (id, event_id, attendee_name, attendee_email, qr_pass_code)
       VALUES ($1, $2, 'Owned Attendee', 'owned@example.test', $3),
              ($4, $5, 'Foreign Attendee', 'foreign@example.test', $6)`,
      [ownRegistration, eventId, `PASS-${randomUUID()}`, foreignRegistration, otherId, `PASS-${randomUUID()}`]
    );
    await t.test('event-specific roster never includes registrations from another event', async () => {
      const result = await owner.get(path);
      assert.equal(result.status, 200);
      assert.equal(result.body.data.total, 1);
      assert.deepEqual(result.body.data.registrations.map(row => row.attendee_name), ['Owned Attendee']);
      assert.equal(result.body.data.registrations[0].attendee_email, 'owned@example.test');
      assert.equal(result.body.data.registrations[0].attendee_id, undefined);
      assert.equal(result.body.data.registrations[0].amount_paid, undefined);
      assert.equal((await other.get(path)).status, 403);
      const foreign = await other.get(`/api/events/${otherId}/registrations`);
      assert.equal(foreign.body.data.registrations[0].attendee_name, 'Foreign Attendee');
    });
    await t.test('bounded pagination rejects abusive input and returns stable slices', async () => {
      const first = await owner.get(`${path}?page=1&limit=1`);
      assert.equal(first.status, 200);
      assert.equal(first.body.data.total, 1);
      assert.equal(first.body.data.page, 1);
      assert.equal(first.body.data.limit, 1);
      assert.equal(first.body.data.has_next, false);
      assert.equal((await owner.get(`${path}?page=2&limit=1`)).body.data.registrations.length, 0);
      for (const suffix of ['page=0', 'page=-1', 'page=x', 'page=9999999999', 'limit=0', 'limit=101', 'limit=nope']) {
        const response = await owner.get(`${path}?${suffix}`);
        assert.equal(response.status, 400, suffix);
      }
    });
    await t.test('historical admission mismatch is reported, never automatically repaired', async () => {
      await pool.query("UPDATE registrations SET status = 'checked_in' WHERE id = $1", [ownRegistration]);
      const inconsistent = await owner.get(path);
      assert.equal(inconsistent.status, 200);
      assert.equal(inconsistent.body.data.summary.registered, 1);
      assert.equal(inconsistent.body.data.summary.checked_in, 0);
      assert.equal(inconsistent.body.data.summary.integrity_issues, 1);
      assert.equal(inconsistent.body.data.registrations[0].attendance_recorded, false);
      const persisted = await pool.query('SELECT COUNT(*)::int AS total FROM attendance_records WHERE registration_id = $1', [ownRegistration]);
      assert.equal(persisted.rows[0].total, 0);
      await pool.query(
        `INSERT INTO attendance_records (id, event_id, registration_id, attendee_name, verified_by)
         VALUES ($1, $2, $3, 'Owned Attendee', 'roster-test')`,
        [`attendance-${randomUUID()}`, eventId, ownRegistration]
      );
      const reconciled = await owner.get(path);
      assert.equal(reconciled.body.data.summary.checked_in, 1);
      assert.equal(reconciled.body.data.summary.integrity_issues, 0);
    });
    await t.test('gate admission persists exactly once and refreshes database counts', async () => {
      const registrationId = `reg-${randomUUID()}`;
      const code = `PASS-${randomUUID()}`;
      await pool.query(
        `INSERT INTO registrations (id, event_id, attendee_name, attendee_email, qr_pass_code)
         VALUES ($1, $2, 'Gate Test', 'gate@example.test', $3)`,
        [registrationId, eventId, code]
      );
      const endpoint = '/api/attendees/checkin';
      const wrong = await owner.post(endpoint).set('X-CSRF-Token', ownerLogin.body.csrfToken)
        .send({ qr_pass_code: code, event_id: otherId });
      assert.equal(wrong.status, 400);
      assert.equal(wrong.body.code, 'WRONG_EVENT');
      const admitted = await owner.post(endpoint).set('X-CSRF-Token', ownerLogin.body.csrfToken)
        .send({ qr_pass_code: code, event_id: eventId });
      assert.equal(admitted.status, 200);
      assert.equal(admitted.body.data.id, registrationId);
      assert.equal(admitted.body.data.status, 'checked_in');
      const duplicate = await owner.post(endpoint).set('X-CSRF-Token', ownerLogin.body.csrfToken)
        .send({ qr_pass_code: code, event_id: eventId });
      assert.equal(duplicate.status, 409);
      assert.equal(duplicate.body.code, 'DUPLICATE_CHECK_IN');
      const stored = await pool.query('SELECT count(*)::int AS total FROM attendance_records WHERE registration_id = $1', [registrationId]);
      assert.equal(stored.rows[0].total, 1);
      const refreshed = await owner.get(path);
      assert.equal(refreshed.body.data.summary.registered, 2);
      assert.equal(refreshed.body.data.summary.checked_in, 2);
      assert.equal(refreshed.body.data.summary.integrity_issues, 0);
    });

    await t.test('attendance without a checked-in status is surfaced as a discrepancy', async () => {
      const registrationId = `reg-${randomUUID()}`;
      await pool.query(
        `INSERT INTO registrations (id, event_id, attendee_name, attendee_email, qr_pass_code)
         VALUES ($1, $2, 'Unreconciled Attendee', 'unreconciled@example.test', $3)`,
        [registrationId, eventId, `PASS-${randomUUID()}`]
      );
      await pool.query(
        `INSERT INTO attendance_records (id, event_id, registration_id, attendee_name, verified_by)
         VALUES ($1, $2, $3, 'Unreconciled Attendee', 'historical-import')`,
        [`attendance-${randomUUID()}`, eventId, registrationId]
      );
      const response = await owner.get(path);
      assert.equal(response.status, 200);
      assert.equal(response.body.data.summary.registered, 3);
      assert.equal(response.body.data.summary.checked_in, 2);
      assert.equal(response.body.data.summary.integrity_issues, 1);
      const item = response.body.data.registrations.find(row => row.id === registrationId);
      assert.equal(item.status, 'confirmed');
      assert.equal(item.attendance_recorded, true);
      assert.equal((await pool.query('SELECT status FROM registrations WHERE id = $1', [registrationId])).rows[0].status, 'confirmed');
    });

    await t.test('cancelled registrations remain auditable but do not inflate attendance', async () => {
      const cancelledId = `reg-${randomUUID()}`;
      await pool.query(
        `INSERT INTO registrations (id, event_id, attendee_name, attendee_email, qr_pass_code, status)
         VALUES ($1, $2, 'Cancelled Attendee', 'cancelled@example.test', $3, 'cancelled')`,
        [cancelledId, eventId, `PASS-${randomUUID()}`]
      );
      const response = await owner.get(path);
      assert.equal(response.status, 200);
      assert.equal(response.body.data.total, 4);
      assert.equal(response.body.data.summary.registered, 3);
      assert.equal(response.body.data.summary.checked_in, 2);
      assert.equal(response.body.data.summary.integrity_issues, 1);
      assert.ok(response.body.data.registrations.some(row => row.id === cancelledId && row.status === 'cancelled'));
    });

    await t.test('ordinary attendee wallet sessions cannot open organizer rosters', async () => {
      const email = `attendee-roster-${tag}@example.test`;
      await pool.query(
        `INSERT INTO users (id, name, email, role, password_hash, password_salt)
         VALUES ($1, 'Roster Wallet', $2, 'attendee', $3, $4)`,
        [attendeeId, email, hash, salt]
      );
      const wallet = request.agent(app);
      assert.equal((await wallet.post('/api/auth/user-login').send({ email, password })).status, 200);
      const response = await wallet.get(path);
      assert.equal(response.status, 403);
      assert.equal(JSON.stringify(response.body).includes('Owned Attendee'), false);
      assert.equal(JSON.stringify(response.body).includes('PASS-'), false);
    });

  } finally {
    await pool.query('DELETE FROM events WHERE id = ANY($1::varchar[])', [[eventId, otherId]]);
    await pool.query('DELETE FROM users WHERE id = ANY($1::varchar[])', [[ownerId, outsiderId, attendeeId]]);
    await pool.end();
  }
});
