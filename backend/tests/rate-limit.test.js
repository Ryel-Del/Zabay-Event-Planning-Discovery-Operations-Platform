const assert = require('node:assert/strict');
const test = require('node:test');
const request = require('supertest');
const { scryptSync } = require('node:crypto');
process.env.FIREBASE_PROJECT_ID = 'rate-test-project';
const db = require('../dist/config/db');
const firebase = require('../dist/config/firebase');
const { app } = require('../dist/app');
const user = { id: 'rate-user', email: 'rate@example.test', role: 'attendee', password_salt: 'salt', password_hash: scryptSync('valid-secret', 'salt', 64).toString('hex') };
db.query = async () => ({ rows: [user] });
firebase.verifyFirebaseIdentity = async () => { throw new Error('invalid token'); };

test('public authentication endpoints limit bursts without blocking initial valid login', async () => {
  assert.equal((await request(app).post('/api/auth/user-login').send({ email: user.email, password: 'valid-secret' })).status, 200);
  for (let attempt = 0; attempt < 9; attempt++) {
    assert.equal((await request(app).post('/api/auth/user-login').send({ email: user.email, password: 'wrong-secret' })).status, 401);
  }
  assert.equal((await request(app).post('/api/auth/user-login').send({ email: user.email, password: 'valid-secret' })).status, 429);
  for (let attempt = 0; attempt < 10; attempt++) {
    assert.equal((await request(app).post('/api/auth/register').send({ name: '' })).status, 400);
  }
  assert.equal((await request(app).post('/api/auth/register').send({ name: '' })).status, 429);
  for (let attempt = 0; attempt < 20; attempt++) {
    assert.equal((await request(app).post('/api/auth/firebase-login').send({ idToken: 'forged' })).status, 401);
  }
  assert.equal((await request(app).post('/api/auth/firebase-login').send({ idToken: 'forged' })).status, 429);
});
