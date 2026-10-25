const assert = require('node:assert/strict');
const test = require('node:test');
const request = require('supertest');
const { scryptSync } = require('node:crypto');

process.env.OPERATOR_USERNAME = 'security-operator';
process.env.OPERATOR_PASSWORD = 'security-operator-secret';
process.env.FIREBASE_PROJECT_ID = 'security-test-project';
const db = require('../dist/config/db');
const firebase = require('../dist/config/firebase');
const { app } = require('../dist/app');
const users = new Map();
const emailIndex = new Map();
const events = [];
const put = (user) => { users.set(user.id, user); emailIndex.set(user.email.toLowerCase(), user.id); };
put({ id: 'seed-organizer', name: 'Seed Organizer', email: 'seed@example.test', role: 'organizer', password_hash: null, password_salt: null });
put({ id: 'real-organizer', name: 'Real Organizer', email: 'real@example.test', role: 'organizer', password_salt: 'test-salt', password_hash: scryptSync('correct-secret', 'test-salt', 64).toString('hex') });
put({ id: 'linked-organizer', name: 'Linked Organizer', email: 'linked@example.test', role: 'organizer', firebase_uid: 'trusted-linked-uid' });

db.query = async (sql, params = []) => {
  if (sql.startsWith('SELECT id, name, email, role, phone, organization, avatar, password_hash')) {
    const user = users.get(emailIndex.get(params[0])); return { rows: user ? [user] : [] };
  }
  if (sql.startsWith('SELECT id FROM users WHERE LOWER(email)')) {
    const id = emailIndex.get(params[0]); return { rows: id ? [{ id }] : [] };
  }
  if (sql.startsWith('SELECT role FROM users WHERE id')) {
    const user = users.get(params[0]); return { rows: user ? [{ role: user.role }] : [] };
  }
  if (sql.startsWith('SELECT id, name, email, role, phone, organization, avatar FROM users WHERE firebase_uid')) {
    return { rows: [...users.values()].filter(u => u.firebase_uid === params[0]) };
  }
  if (sql.startsWith('INSERT INTO users')) {
    const firebaseLogin = sql.includes('firebase_uid');
    const user = firebaseLogin
      ? { id: params[0], name: params[1], email: params[2], role: 'attendee', avatar: params[3], firebase_uid: params[4] }
      : { id: params[0], name: params[1], email: params[2], role: params[3], phone: params[4], organization: params[5], avatar: params[6], password_hash: params[7], password_salt: params[8] };
    put(user); return { rows: [user] };
  }
  if (sql.startsWith('UPDATE users SET password_hash')) throw new Error('Password takeover attempted');
  if (sql.startsWith('UPDATE tasks SET status')) return { rows: [] };
  if (sql.startsWith('SELECT id, name, email, role, phone, organization, avatar, created_at')) {
    const user = users.get(params[0]); return { rows: user ? [user] : [] };
  }
  if (sql.startsWith('SELECT id, name, email, avatar FROM users')) return { rows: [{ id: 'seed-organizer', name: 'Seed Organizer', email: 'seed@example.test', avatar: null }] };
  if (sql.includes('INSERT INTO events')) {
    const event = { id: `evt-${events.length + 1}`, organizer_id: params[7], title: params[0] };
    events.push(event); return { rows: [event] };
  }
  throw new Error(`Unexpected query: ${sql}`);
};

const payload = { title: 'Security test event', category: 'test', start_date: '2031-01-01T10:00:00Z', end_date: '2031-01-01T12:00:00Z' };
const registration = (email, role) => ({ name: 'New User', email, password: 'new-secret-long', role });

test('passwordless seed account cannot be claimed or mutated', async () => {
  for (const password of ['any-arbitrary-password', 'Zabay2026!']) {
    const response = await request(app).post('/api/auth/user-login').send({ email: 'seed@example.test', password });
    assert.equal(response.status, 401);
  }
  assert.equal(users.get('seed-organizer').password_hash, null);
});

test('valid credentials work and ordinary accounts have no operator access', async () => {
  const agent = request.agent(app);
  const login = await agent.post('/api/auth/user-login').send({ email: 'real@example.test', password: 'correct-secret' });
  assert.equal(login.status, 200);
  const csrf = login.body.csrfToken;
  assert.equal((await agent.get('/api/auth/session')).body.operator, false);
  assert.equal((await agent.post('/api/venues').set('X-CSRF-Token', csrf).send({})).status, 403);
  assert.equal((await agent.patch('/api/tasks/some-task/status').set('X-CSRF-Token', csrf).send({ status: 'completed' })).status, 404);
  const event = await agent.post('/api/events').set('X-CSRF-Token', csrf).send({ ...payload, organizer_id: 'seed-organizer' });
  assert.equal(event.status, 201);
  assert.equal(event.body.data.organizer_id, 'real-organizer');
});

test('public registration ignores privileged roles and cannot write operator records', async () => {
  for (const role of ['organizer', 'venue_manager', 'staff', 'admin']) {
    const agent = request.agent(app);
    const result = await agent.post('/api/auth/register').send(registration(`${role}@example.test`, role));
    assert.equal(result.status, 201);
    assert.equal(result.body.user.role, 'attendee');
    assert.equal((await agent.post('/api/events').set('X-CSRF-Token', result.body.csrfToken).send(payload)).status, 403);
  }
});

test('developer key cannot issue operator authority', async () => {
  const agent = request.agent(app);
  assert.notEqual((await agent.post('/api/auth/verify-key').send({ devKey: 'zabay-operator-secret-2026' })).status, 200);
  process.env.DEV_ACCESS_KEY = 'local-only-demo-key';
  const accepted = await agent.post('/api/auth/verify-key').send({ devKey: 'local-only-demo-key' });
  assert.equal(accepted.status, 200);
  assert.equal((await agent.post('/api/events').set('X-CSRF-Token', accepted.body.csrfToken || '').send(payload)).status, 401);
  delete process.env.DEV_ACCESS_KEY;
});

test('user directory requires authorization and a narrow query', async () => {
  assert.equal((await request(app).get('/api/auth/search-users?q=seed')).status, 401);
  const agent = request.agent(app);
  const registered = await agent.post('/api/auth/register').send(registration('searcher@example.test', 'organizer'));
  assert.equal((await agent.get('/api/auth/search-users?q=seed')).status, 403);
  assert.equal(registered.body.user.role, 'attendee');
  const operator = request.agent(app);
  const login = await operator.post('/api/auth/login').send({ username: process.env.OPERATOR_USERNAME, password: process.env.OPERATOR_PASSWORD });
  const search = await operator.get('/api/auth/search-users?q=seed');
  assert.equal(login.status, 200);
  assert.equal(search.status, 200);
  assert.deepEqual(Object.keys(search.body.users[0]).sort(), ['avatar', 'email', 'id', 'name']);
  assert.equal((await operator.get('/api/auth/search-users')).status, 400);
});

test('Firebase token boundary rejects forgery, handles new identity, and refuses email collision', async () => {
  firebase.verifyFirebaseIdentity = async token => {
    if (!['verified-token', 'collision-token', 'organizer-token'].includes(token)) throw new Error('invalid token');
    return { uid: token === 'collision-token' ? 'collision-uid' : token === 'organizer-token' ? 'trusted-linked-uid' : 'verified-uid', email: token === 'collision-token' ? 'seed@example.test' : token === 'organizer-token' ? 'linked@example.test' : 'firebase@example.test', name: 'Verified Google User', picture: '' };
  };
  assert.equal((await request(app).post('/api/auth/firebase-login').send({ idToken: 'forged-token', role: 'organizer' })).status, 401);
  assert.equal((await request(app).post('/api/auth/firebase-login').send({ idToken: 'collision-token' })).status, 409);
  const agent = request.agent(app);
  const login = await agent.post('/api/auth/firebase-login').send({ idToken: 'verified-token', role: 'organizer', userId: 'seed-organizer' });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.role, 'attendee');
  assert.equal((await agent.get('/api/auth/me')).body.user.id, login.body.user.id);
  assert.equal((await agent.post('/api/events').set('X-CSRF-Token', login.body.csrfToken).send(payload)).status, 403);
  const organizer = request.agent(app);
  const linked = await organizer.post('/api/auth/firebase-login').send({ idToken: 'organizer-token', role: 'attendee' });
  assert.equal(linked.body.user.role, 'organizer');
  const created = await organizer.post('/api/events').set('X-CSRF-Token', linked.body.csrfToken).send({ ...payload, organizer_id: 'seed-organizer' });
  assert.equal(created.status, 201);
  assert.equal(created.body.data.organizer_id, 'linked-organizer');
});
