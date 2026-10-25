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
    const authColumns = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('password_hash', 'password_salt', 'firebase_uid')");
    assert.deepEqual(authColumns.rows.map(row => row.column_name).sort(), ['firebase_uid', 'password_hash', 'password_salt']);

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
    const attendee = request.agent(app);
    const registered = await attendee.post('/api/auth/register').send({ name: 'Fresh Attendee', email: 'fresh-attendee@example.test', password: 'fresh-account-secret', role: 'organizer' });
    assert.equal(registered.status, 201, JSON.stringify(registered.body));
    assert.equal(registered.body.user.role, 'attendee');
    assert.equal((await attendee.get('/api/auth/me')).body.user.role, 'attendee');
    assert.equal((await attendee.post('/api/events').set('X-CSRF-Token', registered.body.csrfToken).send(eventPayload)).status, 403);
    assert.equal((await request(app).post('/api/auth/user-login').send({ email: 'fresh-attendee@example.test', password: 'fresh-account-secret' })).status, 200);
    await pool.query("UPDATE users SET role = 'venue_manager' WHERE email = 'fresh-attendee@example.test'");
    const venueManager = request.agent(app);
    const managerLogin = await venueManager.post('/api/auth/user-login').send({ email: 'fresh-attendee@example.test', password: 'fresh-account-secret' });
    assert.equal(managerLogin.status, 200);
    const managed = await venueManager.post('/api/venues').set('X-CSRF-Token', managerLogin.body.csrfToken).send({ name: 'Managed test venue', capacity: 50 });
    assert.equal(managed.status, 201, JSON.stringify(managed.body));
    assert.equal(managed.body.data.manager_id, registered.body.user.id);
    assert.equal((await venueManager.post('/api/events').set('X-CSRF-Token', managerLogin.body.csrfToken).send(eventPayload)).status, 403);
    const organizerRegistration = await request(app).post('/api/auth/register').send({ name: 'Fresh Organizer', email: 'fresh-organizer@example.test', password: 'fresh-organizer-secret' });
    assert.equal(organizerRegistration.status, 201);
    await pool.query("UPDATE users SET role = 'organizer' WHERE email = 'fresh-organizer@example.test'");
    const organizer = request.agent(app);
    const organizerLogin = await organizer.post('/api/auth/user-login').send({ email: 'fresh-organizer@example.test', password: 'fresh-organizer-secret' });
    const privateEvent = await organizer.post('/api/events').set('X-CSRF-Token', organizerLogin.body.csrfToken).send({ ...eventPayload, title: 'Owned private event', is_private: true, event_type: 'private', organizer_id: registered.body.user.id });
    assert.equal(privateEvent.status, 201, JSON.stringify(privateEvent.body));
    assert.equal(privateEvent.body.data.organizer_id, organizerRegistration.body.user.id);
    assert.equal((await organizer.get(`/api/events/${privateEvent.body.data.id}`)).status, 200);
    assert.equal((await organizer.get('/api/events')).body.data.some(row => row.id === privateEvent.body.data.id), true);
    assert.equal((await venueManager.get(`/api/events/${privateEvent.body.data.id}`)).status, 404);
    assert.equal((await request(app).get(`/api/events/${privateEvent.body.data.id}`)).status, 404);
  } finally {
    await pool.query("DELETE FROM events WHERE title = 'Owned private event'");
    await pool.query("DELETE FROM venues WHERE name = 'Managed test venue'");
    await pool.query("DELETE FROM users WHERE email = 'fresh-attendee@example.test'");
    await pool.query("DELETE FROM users WHERE email = 'fresh-organizer@example.test'");
    await pool.query("DELETE FROM events WHERE title IN ('Synthetic staging event', 'Spoofed organizer test')");
    await pool.query("DELETE FROM venues WHERE id = 'test-venue'");
    await pool.end();
  }
});
