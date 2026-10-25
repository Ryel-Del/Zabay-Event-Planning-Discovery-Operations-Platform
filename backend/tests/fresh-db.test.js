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
    const listedEvent = (await request(app).get('/api/events')).body.data.find(row => row.id === eventId);
    assert.equal(listedEvent.registration_count, 1, 'list endpoint reports persisted active registrations');
    const detailEvent = (await request(app).get(`/api/events/${eventId}`)).body.data;
    assert.equal(detailEvent.registration_count, 1, 'detail endpoint reports persisted active registrations');
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
    const secondRegistration = await request(app).post('/api/auth/register').send({ name: 'Other Organizer', email: 'other-organizer@example.test', password: 'other-organizer-secret' });
    assert.equal(secondRegistration.status, 201);
    await pool.query("UPDATE users SET role = 'organizer' WHERE email = 'other-organizer@example.test'");
    const otherOrganizer = request.agent(app);
    const otherLogin = await otherOrganizer.post('/api/auth/user-login').send({ email: 'other-organizer@example.test', password: 'other-organizer-secret' });
    assert.equal(otherLogin.status, 200);
    const taskId = 'fresh-owned-task';
    await pool.query("INSERT INTO tasks (id, event_id, title, track, start_time, end_time) VALUES ($1, $2, 'Owned task', 'venue_logistics', '10:00', '11:00')", [taskId, privateEvent.body.data.id]);
    assert.equal((await organizer.get('/api/tasks')).body.data.some(row => row.id === taskId), true);
    assert.equal((await otherOrganizer.get('/api/tasks')).body.data.some(row => row.id === taskId), false);
    assert.equal((await otherOrganizer.patch(`/api/tasks/${taskId}/status`).set('X-CSRF-Token', otherLogin.body.csrfToken).send({ status: 'completed' })).status, 404);
    assert.equal((await organizer.patch(`/api/tasks/${taskId}/status`).set('X-CSRF-Token', organizerLogin.body.csrfToken).send({ status: 'completed' })).status, 200);
    const bookPayload = { event_id: privateEvent.body.data.id, event_title: 'Owned private event', start_time: eventPayload.start_date, end_time: eventPayload.end_date };
    assert.equal((await otherOrganizer.post(`/api/venues/${managed.body.data.id}/book`).set('X-CSRF-Token', otherLogin.body.csrfToken).send(bookPayload)).status, 403);
    assert.equal((await organizer.post(`/api/venues/${managed.body.data.id}/book`).set('X-CSRF-Token', organizerLogin.body.csrfToken).send(bookPayload)).status, 201);
    assert.equal((await venueManager.get(`/api/venues/${managed.body.data.id}`)).body.data.bookings.some(row => row.event_id === privateEvent.body.data.id), true);
    assert.equal((await otherOrganizer.get(`/api/venues/${managed.body.data.id}`)).body.data.bookings.some(row => row.event_id === privateEvent.body.data.id), false);
    const publicEvent = await organizer.post('/api/events').set('X-CSRF-Token', organizerLogin.body.csrfToken).send({ ...eventPayload, title: 'Owned public event' });
    assert.equal(publicEvent.status, 201);
    const registrationPayload = {
      event_id: publicEvent.body.data.id, attendee_name: 'Other Organizer',
      attendee_email: 'other-organizer@example.test', ticket_type: 'General Admission',
      attendee_id: secondRegistration.body.user.id,
    };
    assert.equal((await attendee.post('/api/attendees/register').send({ ...registrationPayload, registration_mode: 'account' })).status, 403);
    const signedInRegistration = await attendee.post('/api/attendees/register')
      .set('X-CSRF-Token', registered.body.csrfToken)
      .send({ ...registrationPayload, registration_mode: 'account' });
    assert.equal(signedInRegistration.status, 201, JSON.stringify(signedInRegistration.body));
    assert.equal(signedInRegistration.body.data.attendee_id, registered.body.user.id);
    assert.equal((await pool.query('SELECT attendee_id FROM registrations WHERE id = $1', [signedInRegistration.body.data.id])).rows[0].attendee_id, registered.body.user.id);
    const sameAccountOtherSession = request.agent(app);
    assert.equal((await sameAccountOtherSession.post('/api/auth/user-login').send({ email: 'fresh-attendee@example.test', password: 'fresh-account-secret' })).status, 200);
    const restoredPasses = await sameAccountOtherSession.get('/api/attendees/registrations/me');
    assert.equal(restoredPasses.status, 200);
    assert.deepEqual(restoredPasses.body.data.map(row => row.id), [signedInRegistration.body.data.id]);
    assert.equal(restoredPasses.body.data[0].event_title, 'Owned public event');
    assert.equal((await otherOrganizer.get('/api/attendees/registrations/me')).body.data.some(row => row.id === signedInRegistration.body.data.id), false);
    assert.equal((await request(app).get('/api/attendees/registrations/me')).status, 401);
    assert.equal((await organizer.get('/api/attendees/registrations/me')).body.data.some(row => row.id === signedInRegistration.body.data.id), false);
    const guestRegistration = await attendee.post('/api/attendees/register').send({ ...registrationPayload, registration_mode: 'guest' });
    assert.equal(guestRegistration.status, 201);
    assert.equal(guestRegistration.body.data.attendee_id, null);
    // A request omitting registration_mode must remain guest-owned, even with a valid user session.
    const implicitGuest = await attendee.post('/api/attendees/register').send({ ...registrationPayload, attendee_email: 'implicit-guest@example.test' });
    assert.equal(implicitGuest.status, 201);
    assert.equal(implicitGuest.body.data.attendee_id, null);
    assert.equal((await pool.query('SELECT attendee_id FROM registrations WHERE id = $1', [implicitGuest.body.data.id])).rows[0].attendee_id, null);
    assert.equal((await otherOrganizer.get('/api/attendees/registrations/me')).body.data.some(row => row.id === guestRegistration.body.data.id), false);
    const expiredCookie = registered.headers['set-cookie'][0].split(';')[0];
    assert.equal((await attendee.post('/api/auth/logout').set('X-CSRF-Token', registered.body.csrfToken)).status, 200);
    const expiredRegistration = await request(app).post('/api/attendees/register')
      .set('Cookie', expiredCookie).set('X-CSRF-Token', registered.body.csrfToken)
      .send({ ...registrationPayload, registration_mode: 'account', attendee_email: 'expired-session@example.test' });
    assert.equal(expiredRegistration.status, 401);
    assert.equal((await pool.query("SELECT count(*)::int AS count FROM registrations WHERE attendee_email = 'expired-session@example.test'")).rows[0].count, 0);
    const ownRegistration = await request(app).post('/api/attendees/register').send({ event_id: publicEvent.body.data.id, attendee_name: 'Owned Guest', attendee_email: 'owned-guest@example.test', ticket_type: 'General Admission' });
    assert.equal(ownRegistration.status, 201);
    const passCode = ownRegistration.body.data.qr_pass_code;
    assert.equal((await otherOrganizer.post('/api/attendees/checkin').set('X-CSRF-Token', otherLogin.body.csrfToken).send({ qr_pass_code: passCode })).status, 403);
    assert.equal((await organizer.post('/api/attendees/checkin').set('X-CSRF-Token', organizerLogin.body.csrfToken).send({ qr_pass_code: passCode, verified_by_id: secondRegistration.body.user.id })).status, 200);
    assert.equal((await pool.query('SELECT verified_by FROM attendance_records WHERE registration_id = $1', [ownRegistration.body.data.id])).rows[0].verified_by, organizerRegistration.body.user.id);
    await pool.query("UPDATE users SET role = 'staff' WHERE email = 'fresh-attendee@example.test'");
    assert.equal((await venueManager.get('/api/tasks')).status, 403);
    assert.equal((await venueManager.post('/api/attendees/checkin').set('X-CSRF-Token', managerLogin.body.csrfToken).send({ qr_pass_code: passCode })).status, 403);
  } finally {
    await pool.query("DELETE FROM events WHERE title = 'Owned public event'");
    await pool.query("DELETE FROM events WHERE title = 'Owned private event'");
    await pool.query("DELETE FROM venues WHERE name = 'Managed test venue'");
    await pool.query("DELETE FROM users WHERE email = 'fresh-attendee@example.test'");
    await pool.query("DELETE FROM users WHERE email = 'fresh-organizer@example.test'");
    await pool.query("DELETE FROM users WHERE email = 'other-organizer@example.test'");
    await pool.query("DELETE FROM events WHERE title IN ('Synthetic staging event', 'Spoofed organizer test')");
    await pool.query("DELETE FROM venues WHERE id = 'test-venue'");
    await pool.end();
  }
});
