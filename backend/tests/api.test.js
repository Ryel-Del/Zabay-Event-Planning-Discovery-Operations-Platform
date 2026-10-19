const assert = require('node:assert/strict');
const test = require('node:test');
const request = require('supertest');
const { app } = require('../dist/app');
const { pool } = require('../dist/config/db');

test('health endpoint reports the service online', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'online');
  assert.equal(response.body.service, 'Zabay Backend API');
});

test('database-backed API behavior uses the schema and seed', { skip: !process.env.DATABASE_URL }, async (t) => {
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

  const firstBooking = await request(app).post('/api/venues/ven-6/book').send({
    event_id: eventId,
    event_title: 'Automated foundation test',
    hall_id: 'vh-trop-harbor',
    start_time: '2030-01-01T10:00:00Z',
    end_time: '2030-01-01T12:00:00Z',
  });
  assert.equal(firstBooking.status, 201);
  const conflict = await request(app).post('/api/venues/ven-6/book').send({
    event_id: eventId,
    event_title: 'Automated foundation test',
    hall_id: 'vh-trop-harbor',
    start_time: '2030-01-01T11:00:00Z',
    end_time: '2030-01-01T13:00:00Z',
  });
  assert.equal(conflict.status, 409);
  assert.equal(conflict.body.code, 'EXCLUDE_CONSTRAINT_VIOLATION');
});
