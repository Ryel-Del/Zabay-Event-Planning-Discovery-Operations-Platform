const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
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
  assert.match(eventId, /^evt-[0-9a-f-]{36}$/);
  let planningId;
  t.after(async () => {
    if (planningId) await pool.query('DELETE FROM events WHERE id = $1', [planningId]);
    await pool.query('DELETE FROM events WHERE id = $1', [eventId]);
    await pool.end();
  });

  const events = await request(app).get('/api/events');
  assert.equal(events.status, 200);
  assert.ok(events.body.data.some((row) => row.id === eventId));

  const register = (overrides = {}) => request(app).post('/api/attendees/register').send({
    event_id: eventId,
    attendee_name: 'Presentation Attendee',
    attendee_email: 'attendee@example.test',
    ticket_type: 'General Admission',
    ...overrides,
  });
  assert.equal((await register({ attendee_email: '' })).status, 400);
  assert.equal((await register({ event_id: 'missing-event' })).status, 404);
  const firstRegistration = await register({ amount_paid: 999 });
  const secondRegistration = await register();
  assert.equal(firstRegistration.status, 201);
  assert.equal(secondRegistration.status, 201);
  assert.match(firstRegistration.body.data.id, /^reg-[0-9a-f-]{36}$/);
  assert.notEqual(firstRegistration.body.data.qr_pass_code, secondRegistration.body.data.qr_pass_code);
  assert.equal(Number(firstRegistration.body.data.amount_paid), 0);
  const checkIn = (qr_pass_code) => request(app).post('/api/attendees/checkin').send({ qr_pass_code });
  assert.equal((await checkIn('')).status, 400);
  assert.equal((await checkIn('UNKNOWN-PASS')).status, 404);
  const firstPass = firstRegistration.body.data.qr_pass_code;
  assert.equal((await checkIn(firstPass)).status, 200);
  const duplicate = await checkIn(firstPass);
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.code, 'DUPLICATE_CHECK_IN');

  const concurrentPass = secondRegistration.body.data.qr_pass_code;
  const concurrentCheckIns = await Promise.all([checkIn(concurrentPass), checkIn(concurrentPass)]);
  assert.deepEqual(concurrentCheckIns.map((reply) => reply.status).sort(), [200, 409]);
  const attendance = await pool.query(
    'SELECT registration_id, count(*)::int AS count FROM attendance_records WHERE registration_id = ANY($1::varchar[]) GROUP BY registration_id',
    [[firstRegistration.body.data.id, secondRegistration.body.data.id]]
  );
  assert.equal(attendance.rows.length, 2);
  assert.ok(attendance.rows.every((row) => row.count === 1));
  await assert.rejects(pool.query(
    `INSERT INTO attendance_records (id, event_id, registration_id, attendee_name, verified_by)
     VALUES ($1, $2, $3, 'Duplicate', 'test')`,
    [`test-attendance-duplicate-${Date.now()}`, eventId, firstRegistration.body.data.id]
  ), (error) => error.code === '23505');

  const cancelled = await register();
  assert.equal(cancelled.status, 201);
  await pool.query("UPDATE registrations SET status = 'cancelled' WHERE id = $1", [cancelled.body.data.id]);
  const cancelledScan = await checkIn(cancelled.body.data.qr_pass_code);
  assert.equal(cancelledScan.status, 409);
  assert.equal(cancelledScan.body.code, 'CANCELLED_REGISTRATION');
  const cancelledAttendance = await pool.query(
    'SELECT count(*)::int AS count FROM attendance_records WHERE registration_id = $1', [cancelled.body.data.id]
  );
  assert.equal(cancelledAttendance.rows[0].count, 0);

  const rollbackRegistration = await register();
  assert.equal(rollbackRegistration.status, 201);
  const failedAttendanceInsert = await request(app).post('/api/attendees/checkin').send({
    qr_pass_code: rollbackRegistration.body.data.qr_pass_code,
    verified_by_id: 'x'.repeat(65),
  });
  assert.equal(failedAttendanceInsert.status, 500);
  const rolledBack = await pool.query(
    `SELECT r.status, count(a.id)::int AS attendance_count
     FROM registrations r LEFT JOIN attendance_records a ON a.registration_id = r.id
     WHERE r.id = $1 GROUP BY r.id`, [rollbackRegistration.body.data.id]
  );
  assert.deepEqual(rolledBack.rows, [{ status: 'confirmed', attendance_count: 0 }]);

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

  // Regression reproduction: transaction A fixes a REPEATABLE READ snapshot
  // before B commits a whole-venue reservation. A then attempts the overlapping
  // hall reservation from its stale snapshot.
  const snapshotRunId = Date.now();
  const snapshotBookingIds = [
    `test-snapshot-whole-${snapshotRunId}`,
    `test-snapshot-hall-${snapshotRunId}`,
    `test-snapshot-pending-${snapshotRunId}`,
    `test-snapshot-cancelled-${snapshotRunId}`,
  ];
  const snapshotStart = '2030-01-10T10:00:00Z';
  const snapshotEnd = '2030-01-10T12:00:00Z';
  const clientA = await pool.connect();
  const clientB = await pool.connect();
  let isolationError;
  try {
    await clientA.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
    await clientA.query('SELECT count(*) FROM venue_bookings WHERE venue_id = $1', ['ven-6']);

    await clientB.query('BEGIN ISOLATION LEVEL READ COMMITTED');
    await clientB.query(
      `INSERT INTO venue_bookings (id, venue_id, event_id, event_title, booking_window, start_time, end_time, status)
       VALUES ($1, 'ven-6', $2, 'Snapshot whole venue', tstzrange($3, $4, '[)'), $3, $4, 'confirmed')`,
      [snapshotBookingIds[0], eventId, snapshotStart, snapshotEnd]
    );
    await clientB.query('COMMIT');

    try {
      await clientA.query(
        `INSERT INTO venue_bookings (id, venue_id, hall_id, event_id, event_title, booking_window, start_time, end_time, status)
         VALUES ($1, 'ven-6', 'vh-trop-harbor', $2, 'Snapshot hall', tstzrange($3, $4, '[)'), $3, $4, 'confirmed')`,
        [snapshotBookingIds[1], eventId, snapshotStart, snapshotEnd]
      );
      await clientA.query('COMMIT');
    } catch (error) {
      isolationError = error;
      await clientA.query('ROLLBACK');
    }
    assert.equal(isolationError && isolationError.code, '0A000');
    assert.match(isolationError && isolationError.message, /READ COMMITTED/i);

    for (const [offset, status] of [[2, 'pending'], [3, 'cancelled']]) {
      await clientA.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
      await clientA.query(
        `INSERT INTO venue_bookings (id, venue_id, hall_id, event_id, event_title, booking_window, start_time, end_time, status)
         VALUES ($1, 'ven-6', 'vh-trop-harbor', $2, 'Non-confirmed snapshot fixture', tstzrange($3, $4, '[)'), $3, $4, $5)`,
        [snapshotBookingIds[offset], eventId, snapshotStart, snapshotEnd, status]
      );
      await clientA.query('COMMIT');
    }
  } finally {
    await clientA.query('ROLLBACK').catch(() => {});
    await clientB.query('ROLLBACK').catch(() => {});
    await clientB.query('DELETE FROM venue_bookings WHERE id = ANY($1::varchar[])', [snapshotBookingIds]);
    clientA.release();
    clientB.release();
  }

  const hallBooking = await book(slot(2, 'vh-trop-harbor'));
  assert.equal(hallBooking.status, 201);
  const bookedEvent = await request(app).get(`/api/events/${eventId}`);
  assert.equal(bookedEvent.body.data.venue_id, 'ven-6');
  assert.equal(bookedEvent.body.data.hall_id, 'vh-trop-harbor');

  const planning = await request(app).post('/api/events').send({
    title: 'Unbooked planning event', category: 'test',
    start_date: '2030-01-02T10:00:00Z', end_date: '2030-01-02T12:00:00Z',
    organizer_id: 'usr-org-1',
  });
  assert.equal(planning.status, 201);
  planningId = planning.body.data.id;
  const rejectedBooking = await book({
    ...slot(2, 'vh-trop-harbor'), event_id: planningId,
    event_title: 'Unbooked planning event',
  });
  assert.equal(rejectedBooking.status, 409);
  const stillPlanning = await request(app).get(`/api/events/${planningId}`);
  assert.equal(stillPlanning.body.data.status, 'planning');
  assert.equal(stillPlanning.body.data.venue_id, null);
  assert.equal(stillPlanning.body.data.hall_id, null);
  const retryBooking = await book({
    ...slot(2, 'vh-trop-dagohoy'), event_id: planningId,
    event_title: 'Unbooked planning event',
  });
  assert.equal(retryBooking.status, 201);
  const afterRetry = await request(app).get(`/api/events/${planningId}`);
  assert.equal(afterRetry.body.data.id, planningId);
  assert.equal(afterRetry.body.data.hall_id, 'vh-trop-dagohoy');
  assert.equal(new Date(afterRetry.body.data.start_date).toISOString(), '2030-01-02T10:00:00.000Z');
  assert.equal(new Date(afterRetry.body.data.end_date).toISOString(), '2030-01-02T12:00:00.000Z');
  const matchingEvents = await pool.query('SELECT count(*)::int AS count FROM events WHERE id = $1', [planningId]);
  assert.equal(matchingEvents.rows[0].count, 1);
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

  const pendingId = `test-pending-booking-${Date.now()}`;
  await pool.query(
    `INSERT INTO venue_bookings (id, venue_id, hall_id, event_id, event_title, booking_window, start_time, end_time, status)
     VALUES ($1, 'ven-6', 'vh-trop-harbor', $2, 'Pending fixture',
             tstzrange('2030-01-06T10:00:00Z'::timestamptz, '2030-01-06T12:00:00Z'::timestamptz, '[)'),
             '2030-01-06T10:00:00Z', '2030-01-06T12:00:00Z', 'pending')`,
    [pendingId, eventId]
  );
  assert.equal((await book(slot(6, 'vh-trop-harbor'))).status, 201);

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

  const crossScope = await Promise.all([
    book(slot(9)),
    book(slot(9, 'vh-trop-harbor')),
  ]);
  assert.deepEqual(crossScope.map((response) => response.status).sort(), [201, 409]);
  assert.equal(crossScope.find((response) => response.status === 409).body.code, 'EXCLUDE_CONSTRAINT_VIOLATION');
  const crossScopeWinner = crossScope.find((response) => response.status === 201).body.data;
  const crossScopeBookings = await pool.query(
    `SELECT id, hall_id FROM venue_bookings
     WHERE event_id = $1 AND venue_id = 'ven-6'
       AND start_time = '2030-01-09T10:00:00Z'::timestamptz
       AND end_time = '2030-01-09T12:00:00Z'::timestamptz
       AND status = 'confirmed'`, [eventId]
  );
  assert.equal(crossScopeBookings.rows.length, 1);
  assert.equal(crossScopeBookings.rows[0].id, crossScopeWinner.id);
  assert.equal(crossScopeBookings.rows[0].hall_id, crossScopeWinner.hall_id);

  const bookingsBeforeSchemaRerun = await pool.query(
    'SELECT id, booking_window::text FROM venue_bookings WHERE event_id = $1 ORDER BY id', [eventId]
  );
  const schemaSql = fs.readFileSync(path.resolve(__dirname, '../../db/schema.sql'), 'utf8');
  await pool.query(schemaSql);
  await pool.query(schemaSql);
  const bookingsAfterSchemaRerun = await pool.query(
    'SELECT id, booking_window::text FROM venue_bookings WHERE event_id = $1 ORDER BY id', [eventId]
  );
  assert.deepEqual(bookingsAfterSchemaRerun.rows, bookingsBeforeSchemaRerun.rows);

  const migrationClient = await pool.connect();
  const legacySchema = `zabay_upgrade_${randomUUID().replace(/-/g, '')}`;
  try {
    await migrationClient.query(`CREATE SCHEMA ${legacySchema}`);
    await migrationClient.query(`SET search_path TO ${legacySchema}, public`);
    await migrationClient.query(`
      CREATE TABLE venues (id VARCHAR(64) PRIMARY KEY);
      CREATE TABLE venue_halls (
        id VARCHAR(64) PRIMARY KEY,
        venue_id VARCHAR(64) NOT NULL REFERENCES venues(id)
      );
      CREATE TABLE events (id VARCHAR(64) PRIMARY KEY);
      CREATE TABLE venue_bookings (
        id VARCHAR(64) PRIMARY KEY,
        venue_id VARCHAR(64) NOT NULL REFERENCES venues(id),
        hall_id VARCHAR(64) REFERENCES venue_halls(id) ON DELETE SET NULL,
        hall_name VARCHAR(255),
        event_id VARCHAR(64) NOT NULL REFERENCES events(id),
        event_title VARCHAR(255) NOT NULL,
        booking_window TSRANGE NOT NULL,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        EXCLUDE USING gist (
          venue_id WITH =,
          COALESCE(hall_id, 'ALL') WITH =,
          booking_window WITH &&
        ) WHERE (status = 'confirmed')
      );
      INSERT INTO venues VALUES ('legacy-venue');
      INSERT INTO venue_halls VALUES ('legacy-hall', 'legacy-venue');
      INSERT INTO events VALUES ('legacy-event');
      INSERT INTO venue_bookings (
        id, venue_id, hall_id, event_id, event_title, booking_window, start_time, end_time
      ) VALUES (
        'legacy-booking', 'legacy-venue', 'legacy-hall', 'legacy-event', 'Preserved booking',
        tsrange('2030-02-01 10:00', '2030-02-01 12:00', '[)'),
        '2030-02-01T10:00:00Z', '2030-02-01T12:00:00Z'
      );
    `);
    await migrationClient.query(schemaSql);
    const migratedBooking = await migrationClient.query(
      `SELECT b.id, c.udt_name AS range_type
       FROM venue_bookings b
       JOIN information_schema.columns c
         ON c.table_schema = $1 AND c.table_name = 'venue_bookings' AND c.column_name = 'booking_window'
       WHERE b.id = 'legacy-booking'`, [legacySchema]
    );
    assert.deepEqual(migratedBooking.rows, [{ id: 'legacy-booking', range_type: 'tstzrange' }]);

    await migrationClient.query(schemaSql);
    const preservedCount = await migrationClient.query(
      "SELECT count(*)::int AS count FROM venue_bookings WHERE id = 'legacy-booking'"
    );
    assert.equal(preservedCount.rows[0].count, 1);
  } finally {
    await migrationClient.query(`DROP SCHEMA IF EXISTS ${legacySchema} CASCADE`);
    migrationClient.release();
  }
});
