const assert = require('node:assert/strict');
const test = require('node:test');
const request = require('supertest');

process.env.NODE_ENV = 'production';
process.env.DEV_ACCESS_KEY = 'local-demo-only';
const { app } = require('../dist/app');

test('production rejects developer key even when configured', async () => {
  const agent = request.agent(app);
  const response = await agent.post('/api/auth/verify-key').send({ devKey: process.env.DEV_ACCESS_KEY });
  assert.equal(response.status, 404);
  assert.equal(response.headers['set-cookie'], undefined);
  assert.equal((await agent.get('/api/auth/session')).body.authenticated, false);
});
