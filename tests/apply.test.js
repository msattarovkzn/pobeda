const test = require('node:test');
const assert = require('node:assert/strict');
const { validateApplication, formatTelegramMessage } = require('../api/apply.js');

test('validateApplication accepts valid name and contact', () => {
  const result = validateApplication({ name: 'Иван', contact: '+79991234567' });
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('validateApplication rejects missing name', () => {
  const result = validateApplication({ name: '', contact: '+79991234567' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('Имя обязательно'));
});

test('validateApplication rejects missing contact', () => {
  const result = validateApplication({ name: 'Иван', contact: '   ' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('Телефон или Telegram обязателен'));
});

test('validateApplication rejects honeypot field filled', () => {
  const result = validateApplication({ name: 'Иван', contact: '@ivan', website: 'http://spam.com' });
  assert.equal(result.valid, false);
});

test('formatTelegramMessage includes name and contact', () => {
  const text = formatTelegramMessage({ name: 'Иван', contact: '@ivan' });
  assert.match(text, /Иван/);
  assert.match(text, /@ivan/);
});

const handler = require('../api/apply.js');

function createRes() {
  const res = { statusCode: null, body: null };
  res.status = function (code) { res.statusCode = code; return res; };
  res.json = function (payload) { res.body = payload; return res; };
  return res;
}

test('handler returns 405 for non-POST requests', async () => {
  const req = { method: 'GET', body: {} };
  const res = createRes();
  await handler(req, res);
  assert.equal(res.statusCode, 405);
});

test('handler returns 400 for invalid body', async () => {
  const req = { method: 'POST', body: { name: '', contact: '' } };
  const res = createRes();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
});

test('handler returns 500 when env vars missing', async () => {
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_CHAT_ID;
  const req = { method: 'POST', body: { name: 'Иван', contact: '@ivan' } };
  const res = createRes();
  await handler(req, res);
  assert.equal(res.statusCode, 500);
});

test('handler sends message to Telegram and returns 200', async () => {
  process.env.TELEGRAM_BOT_TOKEN = 'test-token';
  process.env.TELEGRAM_CHAT_ID = '12345';
  const originalFetch = global.fetch;
  let calledUrl = null;
  let calledBody = null;
  global.fetch = async function (url, options) {
    calledUrl = url;
    calledBody = JSON.parse(options.body);
    return { ok: true, json: async () => ({ ok: true }) };
  };
  const req = { method: 'POST', body: { name: 'Иван', contact: '@ivan' } };
  const res = createRes();
  await handler(req, res);
  global.fetch = originalFetch;
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true });
  assert.match(calledUrl, /test-token/);
  assert.equal(calledBody.chat_id, '12345');
});

test('handler returns 502 when Telegram API fails', async () => {
  process.env.TELEGRAM_BOT_TOKEN = 'test-token';
  process.env.TELEGRAM_CHAT_ID = '12345';
  const originalFetch = global.fetch;
  global.fetch = async function () {
    return { ok: false, status: 500, text: async () => 'error' };
  };
  const req = { method: 'POST', body: { name: 'Иван', contact: '@ivan' } };
  const res = createRes();
  await handler(req, res);
  global.fetch = originalFetch;
  assert.equal(res.statusCode, 502);
});
