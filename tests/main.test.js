const test = require('node:test');
const assert = require('node:assert/strict');
const { validateApplyForm, shouldShowStickyCta } = require('../js/main.js');

test('validateApplyForm passes with name, contact and consent', () => {
  const result = validateApplyForm({ name: 'Иван', contact: '@ivan', consent: true, website: '' });
  assert.equal(result.valid, true);
});

test('validateApplyForm fails without consent', () => {
  const result = validateApplyForm({ name: 'Иван', contact: '@ivan', consent: false, website: '' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.consent);
});

test('validateApplyForm fails when honeypot filled', () => {
  const result = validateApplyForm({ name: 'Иван', contact: '@ivan', consent: true, website: 'spam' });
  assert.equal(result.valid, false);
});

test('shouldShowStickyCta is false while modal is open', () => {
  const show = shouldShowStickyCta({ scrollY: 800, heroBottom: 600, modalOpen: true });
  assert.equal(show, false);
});

test('shouldShowStickyCta is true after scrolling past hero', () => {
  const show = shouldShowStickyCta({ scrollY: 800, heroBottom: 600, modalOpen: false });
  assert.equal(show, true);
});

test('shouldShowStickyCta is false before reaching hero bottom', () => {
  const show = shouldShowStickyCta({ scrollY: 100, heroBottom: 600, modalOpen: false });
  assert.equal(show, false);
});
