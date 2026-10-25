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
  } finally {
    await pool.query('DELETE FROM events WHERE id = ANY($1::varchar[])', [[eventId, otherId]]);
    await pool.query('DELETE FROM users WHERE id = ANY($1::varchar[])', [[ownerId, outsiderId]]);
    await pool.end();
  }
});
