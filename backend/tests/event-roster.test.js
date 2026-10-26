const assert = require('node:assert/strict');
const test = require('node:test');
const { randomUUID, scryptSync } = require('node:crypto');
const request = require('supertest');

const databaseUrl = process.env.TEST_DATABASE_URL;
if (databaseUrl) {
  const name = new URL(databaseUrl).pathname.slice(1);
  if (!/(^|[_-])test([_-]|$)/i.test(name)) throw Error('Roster tests require a disposable test-named database');
  process.env.DATABASE_URL = databaseUrl;
}
process.env.OPERATOR_USERNAME = 'roster-test-operator';
process.env.OPERATOR_PASSWORD = 'roster-test-operator-secret';
const { app } = require('../dist/app');
const { pool } = require('../dist/config/db');

test('event registration roster protects attendee data and reports admission integrity', { skip: !databaseUrl }, async t => {
  const id = randomUUID();
  const ownerId = 'test-roster-owner-' + id;
  const otherId = 'test-roster-other-' + id;
  const firstEvent = 'test-roster-a-' + id;
  const secondEvent = 'test-roster-b-' + id;
  const password = 'roster-test-strong-secret';
  const salt = 'roster-tests-salt';
  const hash = scryptSync(password, salt, 64).toString('hex');
  t.after(async () => {
    await pool.query('DELETE FROM events WHERE id = ANY($1::varchar[])', [[firstEvent, secondEvent]]);
    await pool.query('DELETE FROM users WHERE id = ANY($1::varchar[])', [[ownerId, otherId]]);
    await pool.end();
  });

  await pool.query(
    'INSERT INTO users (id, name, email, role, password_hash, password_salt) VALUES ($1, $2, $3, $4, $5, $6), ($7, $8, $9, $10, $11, $12)',
    [ownerId, 'Roster Owner', ownerId + '@example.test', 'organizer', hash, salt,
      otherId, 'Other Organizer', otherId + '@example.test', 'organizer', hash, salt]
  );
  await pool.query(
    "INSERT INTO events (id, title, category, start_date, end_date, organizer_id) VALUES ($1, 'Roster event A', 'test', NOW() + INTERVAL '1 month', NOW() + INTERVAL '1 month 2 hours', $2), ($3, 'Roster event B', 'test', NOW() + INTERVAL '1 month', NOW() + INTERVAL '1 month 2 hours', $4)",
    [firstEvent, ownerId, secondEvent, otherId]
  );
  const passes = [0, 1, 2, 3].map(i => ({
    id: 'test-roster-pass-' + i + '-' + id, code: 'ZABAY-R-' + i + '-' + id,
    event: i === 3 ? secondEvent : firstEvent,
    status: i === 2 ? 'checked_in' : 'confirmed'
  }));
  for (const pass of passes) {
    await pool.query(
      'INSERT INTO registrations (id, event_id, attendee_name, attendee_email, ticket_type, qr_pass_code, status) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [pass.id, pass.event, 'Synthetic Guest', 'synthetic-' + pass.id + '@example.test', 'General Admission', pass.code, pass.status]
    );
  }
  const owner = request.agent(app);
  const other = request.agent(app);
  const operator = request.agent(app);
  const login = async (agent, email) => agent.post('/api/auth/user-login').send({ email, password });
  const ownLogin = await login(owner, ownerId + '@example.test');
  const otherLogin = await login(other, otherId + '@example.test');
  assert.equal(ownLogin.status, 200);
  assert.equal(otherLogin.status, 200);
  assert.equal((await operator.post('/api/auth/login').send({ username: process.env.OPERATOR_USERNAME, password: process.env.OPERATOR_PASSWORD })).status, 200);

  const rosterPath = '/api/events/' + firstEvent + '/registrations';
  const summaryPath = '/api/events/' + firstEvent + '/registration-summary';
  assert.equal((await request(app).get(rosterPath)).status, 401);
  assert.equal((await other.get(rosterPath)).status, 403);
  assert.equal((await other.get(summaryPath)).status, 403);
  assert.equal((await owner.get('/api/events/no-such-event/registrations')).status, 404);
  assert.equal((await owner.get(rosterPath + '?limit=0')).status, 400);
  assert.equal((await owner.get(rosterPath + '?offset=-1')).status, 400);

  const first = await owner.get(rosterPath + '?limit=1&offset=0');
  const second = await owner.get(rosterPath + '?limit=1&offset=1');
  assert.equal(first.status, 200);
  assert.equal(first.body.pagination.total, 3);
  assert.equal(first.body.data.length, 1);
  assert.equal(second.body.data.length, 1);
  assert.notEqual(first.body.data[0].id, second.body.data[0].id);
  assert.ok(first.body.data[0].qr_pass_code);
  const whole = await owner.get(rosterPath);
  assert.equal(whole.status, 200);
  assert.equal(whole.body.data.length, 3);
  assert.ok(whole.body.data.every(r => r.event_id === firstEvent));
  assert.equal(whole.body.summary.registered_count, 3);
  assert.equal(whole.body.summary.checked_in_count, 0);
  assert.equal(whole.body.summary.integrity_warning_count, 1); // Checked-in status without attendance.
  assert.ok(whole.body.data.some(r => r.integrity_warning === 'missing_attendance'));
  assert.equal((await owner.get(summaryPath)).body.data.registered_count, 3);
  assert.equal((await operator.get(rosterPath)).status, 200);

  const wallet = await owner.get('/api/attendees/registrations/me');
  assert.equal(wallet.status, 200);
  assert.ok(wallet.body.data.every(reg => reg.attendee_id === ownerId));
  assert.ok(!wallet.body.data.some(reg => reg.qr_pass_code === passes[0].code));

  // An unrelated organizer cannot use an optional event ID to authorize a pass.
  const foreign = await other.post('/api/attendees/checkin').set('X-CSRF-Token', otherLogin.body.csrfToken)
    .send({ qr_pass_code: passes[0].code });
  assert.equal(foreign.status, 403);
  const incorrectEvent = await operator.post('/api/attendees/checkin').send({
    qr_pass_code: passes[0].code, event_id: secondEvent
  });
  assert.equal(incorrectEvent.status, 400);
  assert.equal(incorrectEvent.body.code, 'WRONG_EVENT');

  const admitted = await owner.post('/api/attendees/checkin').set('X-CSRF-Token', ownLogin.body.csrfToken)
    .send({ qr_pass_code: passes[0].code, event_id: firstEvent });
  assert.equal(admitted.status, 200);
  assert.equal(admitted.body.data.id, passes[0].id);
  const duplicate = await owner.post('/api/attendees/checkin').set('X-CSRF-Token', ownLogin.body.csrfToken)
    .send({ qr_pass_code: passes[0].code, event_id: firstEvent });
  assert.equal(duplicate.status, 409);
  const checked = await owner.get(summaryPath);
  assert.equal(checked.body.data.checked_in_count, 1);
  assert.equal(checked.body.data.integrity_warning_count, 1);
  assert.equal((await pool.query('SELECT count(*)::int AS count FROM attendance_records WHERE registration_id=$1', [passes[0].id])).rows[0].count, 1);
  assert.equal((await pool.query('SELECT status FROM registrations WHERE id=$1', [passes[2].id])).rows[0].status, 'checked_in');

  // Historical inconsistencies are visible, not automatically "repaired".
  await pool.query(
    "UPDATE registrations SET status = 'cancelled' WHERE id=$1", [passes[1].id]
  );
  const afterCancellation = await owner.get(summaryPath);
  assert.equal(afterCancellation.body.data.registered_count, 2);
  assert.equal(afterCancellation.body.data.cancelled_count, 1);
});
