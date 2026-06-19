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
