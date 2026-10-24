const assert = require('node:assert/strict');
const test = require('node:test');
const request = require('supertest');

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl || !/(^|[_-])test([_-]|$)/i.test(new URL(databaseUrl).pathname.slice(1))) {
  throw new Error('Fresh database test requires TEST_DATABASE_URL with a test database name.');
}
process.env.DATABASE_URL = databaseUrl;
process.env.OPERATOR_USERNAME = 'fresh-operator';
process.env.OPERATOR_PASSWORD = 'fresh-operator-secret';
const { app } = require('../dist/app');
const { pool } = require('../dist/config/db');

test('schema-only database supports the complete operator workflow', async () => {
  try {
    for (const table of ['venues', 'events', 'registrations', 'attendance_records']) {
      const result = await pool.query(`SELECT count(*)::int AS count FROM ${table}`);
      assert.equal(result.rows[0].count, 0, `${table} must start empty`);
    }
    const users = await pool.query('SELECT id FROM users');
    assert.deepEqual(users.rows.map(row => row.id), ['zabay-operator']);

    const agent = request.agent(app);
    const eventPayload = {
      title: 'Synthetic staging event', category: 'test',
      start_date: '2031-03-01T10:00:00Z', end_date: '2031-03-01T12:00:00Z',
    };
    assert.equal((await agent.post('/api/events').send(eventPayload)).status, 401);
    assert.equal((await agent.post('/api/auth/login').send({ username: 'fresh-operator', password: 'wrong' })).status, 401);
    const login = await agent.post('/api/auth/login').send({ username: 'fresh-operator', password: 'fresh-operator-secret' });
    assert.equal(login.status, 200);
    const csrf = login.body.csrfToken;
    assert.equal((await agent.get('/api/auth/session')).body.authenticated, true);
    assert.equal((await agent.post('/api/events').send(eventPayload)).status, 403);
    assert.equal((await agent.post('/api/events').set('X-CSRF-Token', csrf).set('Origin', 'https://untrusted.example').send(eventPayload)).status, 403);

    const venueId = 'test-venue';
    await pool.query(`INSERT INTO venues (id, name, city, address, lat, lng, capacity, hourly_rate, power_kw_capacity)
      VALUES ($1, 'Synthetic venue', 'Test city', 'Test address', 1, 1, 100, 0, 10)`, [venueId]);
    const event = await agent.post('/api/events').set('X-CSRF-Token', csrf).send(eventPayload);
    assert.equal(event.status, 201, JSON.stringify(event.body));
    const eventId = event.body.data.id;
    assert.equal(event.body.data.organizer_id, 'zabay-operator');
    const spoofed = await agent.post('/api/events').set('X-CSRF-Token', csrf).send({
      ...eventPayload, title: 'Spoofed organizer test', organizer_id: 'usr-org-1',
    });
    assert.equal(spoofed.status, 201);
    assert.equal(spoofed.body.data.organizer_id, 'zabay-operator');

    const book = await agent.post(`/api/venues/${venueId}/book`).set('X-CSRF-Token', csrf).send({
      event_id: eventId, event_title: eventPayload.title,
      start_time: eventPayload.start_date, end_time: eventPayload.end_date,
    });
    assert.equal(book.status, 201, JSON.stringify(book.body));
    assert.equal((await pool.query('SELECT venue_id FROM events WHERE id = $1', [eventId])).rows[0].venue_id, venueId);

    const registration = await request(app).post('/api/attendees/register').send({
      event_id: eventId, attendee_name: 'Synthetic Guest', attendee_email: 'guest@example.test', ticket_type: 'General Admission',
    });
    assert.equal(registration.status, 201, JSON.stringify(registration.body));
    const pass = registration.body.data.qr_pass_code;
    assert.equal((await request(app).post('/api/attendees/checkin').send({ qr_pass_code: pass })).status, 401);
    const checkIn = () => agent.post('/api/attendees/checkin').set('X-CSRF-Token', csrf).send({ qr_pass_code: pass });
    assert.equal((await checkIn()).status, 200);
    assert.equal((await checkIn()).status, 409);
    assert.equal((await pool.query('SELECT count(*)::int AS count FROM attendance_records')).rows[0].count, 1);

    assert.equal((await agent.post('/api/auth/logout')).status, 403);
    assert.equal((await agent.post('/api/auth/logout').set('X-CSRF-Token', csrf)).status, 200);
    assert.equal((await agent.get('/api/auth/session')).body.authenticated, false);
    assert.equal((await agent.post('/api/events').set('X-CSRF-Token', csrf).send(eventPayload)).status, 401);
  } finally {
    await pool.query("DELETE FROM events WHERE title IN ('Synthetic staging event', 'Spoofed organizer test')");
    await pool.query("DELETE FROM venues WHERE id = 'test-venue'");
    await pool.end();
  }
});
