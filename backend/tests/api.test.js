const assert = require('node:assert/strict');
const test = require('node:test');
const request = require('supertest');

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (testDatabaseUrl) {
  const parsed = new URL(testDatabaseUrl);
  const databaseName = decodeURIComponent(parsed.pathname.slice(1));
  if (!databaseName || !/(^|[_-])test([_-]|$)/i.test(databaseName)) {
    throw new Error('Refusing integration tests: TEST_DATABASE_URL must target a database whose name contains "test".');
  }
  process.env.DATABASE_URL = testDatabaseUrl;
}

const { app } = require('../dist/app');
const { pool } = require('../dist/config/db');

test('health endpoint reports the service online', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'online');
  assert.equal(response.body.service, 'Zabay Backend API');
});

test('database-backed API behavior uses the schema and seed', { skip: !testDatabaseUrl }, async (t) => {
  const venues = await request(app).get('/api/venues');
  assert.equal(venues.status, 200);
  assert.ok(Array.isArray(venues.body.data));
  assert.ok(venues.body.data.some((venue) => venue.id === 'ven-6'));

  const event = await request(app).post('/api/events').send({
    title: 'Automated foundation test',
    category: 'test',
    start_date: '2030-01-01T10:00:00Z',
    end_date: '2030-01-01T12:00:00Z',
    organizer_id: 'usr-org-1',
    venue_id: 'ven-6',
  });
  assert.equal(event.status, 201);
  const eventId = event.body.data.id;
  t.after(async () => {
    await pool.query('DELETE FROM events WHERE id = $1', [eventId]);
    await pool.end();
  });

  const events = await request(app).get('/api/events');
  assert.equal(events.status, 200);
  assert.ok(events.body.data.some((row) => row.id === eventId));

  const taskId = `test-task-${Date.now()}`;
  await pool.query(
    `INSERT INTO tasks (id, event_id, title, track, status, priority, start_time, end_time)
     VALUES ($1, $2, 'Foundation test task', 'day_of_ops', 'todo', 'medium', '10:00', '11:00')`,
    [taskId, eventId]
  );
  const taskUpdate = await request(app).patch(`/api/tasks/${taskId}/status`).send({ status: 'completed' });
  assert.equal(taskUpdate.status, 200);
  assert.equal(taskUpdate.body.data.status, 'completed');

  const book = (payload) => request(app).post('/api/venues/ven-6/book').send({
    event_id: eventId,
    event_title: 'Automated foundation test',
    ...payload,
  });
  const slot = (day, hall_id) => ({
    ...(hall_id ? { hall_id } : {}),
    start_time: `2030-01-${String(day).padStart(2, '0')}T10:00:00Z`,
    end_time: `2030-01-${String(day).padStart(2, '0')}T12:00:00Z`,
  });

  const hallBooking = await book(slot(2, 'vh-trop-harbor'));
  assert.equal(hallBooking.status, 201);
  const sameHallConflict = await book({ ...slot(2, 'vh-trop-harbor'), start_time: '2030-01-02T11:00:00Z' });
  assert.equal(sameHallConflict.status, 409);
  assert.equal(sameHallConflict.body.code, 'EXCLUDE_CONSTRAINT_VIOLATION');

  assert.equal((await book(slot(2, 'vh-trop-sandugo'))).status, 201);
  assert.equal((await book({ ...slot(3, 'vh-trop-harbor'), start_time: '2030-01-03T12:00:00Z', end_time: '2030-01-03T14:00:00Z' })).status, 201);

  assert.equal((await book(slot(4))).status, 201);
  const hallDuringWholeVenue = await book(slot(4, 'vh-trop-harbor'));
  assert.equal(hallDuringWholeVenue.status, 409);
  const wholeDuringHall = await book(slot(2));
  assert.equal(wholeDuringHall.status, 409);

  const cancelledSeed = await pool.query(
    `INSERT INTO venue_bookings (id, venue_id, hall_id, event_id, event_title, booking_window, start_time, end_time, status)
     VALUES ('test-cancelled-booking', 'ven-6', 'vh-trop-harbor', $1, 'Cancelled fixture',
             tstzrange('2030-01-05T10:00:00Z'::timestamptz, '2030-01-05T12:00:00Z'::timestamptz, '[)'),
             '2030-01-05T10:00:00Z', '2030-01-05T12:00:00Z', 'cancelled') ON CONFLICT (id) DO NOTHING`,
    [eventId]
  );
  assert.equal(cancelledSeed.rowCount, 1);
  assert.equal((await book(slot(5, 'vh-trop-harbor'))).status, 201);

  assert.equal((await book({ ...slot(6, 'vh-trop-harbor'), end_time: '2030-01-06T09:00:00Z' })).status, 400);
  assert.equal((await book({ ...slot(6, 'vh-trop-harbor'), start_time: 'not-a-date' })).status, 400);
  assert.equal((await request(app).post('/api/venues/ven-missing/book').send({
    event_id: eventId, event_title: 'Missing venue', ...slot(7),
  })).status, 404);
  assert.equal((await book({ ...slot(7), event_id: 'missing-event' })).status, 404);
  assert.equal((await book(slot(7, 'missing-hall'))).status, 404);
  assert.equal((await book(slot(7, 'vh-metro-grand'))).status, 400);
  assert.equal((await request(app).post('/api/venues/ven-6/book').send({ event_id: eventId })).status, 400);

  await assert.rejects(pool.query(
    `INSERT INTO venue_bookings (id, venue_id, hall_id, event_id, event_title, booking_window, start_time, end_time)
     VALUES ('test-invalid-hall-pair', 'ven-6', 'vh-metro-grand', $1, 'Invalid pair',
             tstzrange('2030-01-07T10:00:00Z'::timestamptz, '2030-01-07T12:00:00Z'::timestamptz, '[)'),
             '2030-01-07T10:00:00Z', '2030-01-07T12:00:00Z')`, [eventId]
  ), (error) => error.code === '23514');
  await assert.rejects(pool.query(
    `INSERT INTO venue_bookings (id, venue_id, hall_id, event_id, event_title, booking_window, start_time, end_time)
     VALUES ('test-invalid-time-order', 'ven-6', 'vh-trop-harbor', $1, 'Invalid time order',
             tstzrange('2030-01-07T10:00:00Z'::timestamptz, '2030-01-07T12:00:00Z'::timestamptz, '[)'),
             '2030-01-07T12:00:00Z', '2030-01-07T10:00:00Z')`, [eventId]
  ), (error) => error.code === '23514');

  const concurrent = await Promise.all([
    book({ ...slot(8, 'vh-trop-harbor'), start_time: '2030-01-08T10:00:00Z' }),
    book({ ...slot(8, 'vh-trop-harbor'), start_time: '2030-01-08T10:30:00Z' }),
  ]);
  assert.deepEqual(concurrent.map((response) => response.status).sort(), [201, 409]);
});
