const test = require('node:test');
const assert = require('node:assert/strict');
const { validateApplyForm, shouldShowStickyCta, getCarouselArrowState } = require('../js/main.js');

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

test('getCarouselArrowState hides prev arrow at the start of the track', () => {
  const result = getCarouselArrowState({ scrollLeft: 0, clientWidth: 300, scrollWidth: 900 });
  assert.equal(result.showPrev, false);
  assert.equal(result.showNext, true);
});

test('getCarouselArrowState shows both arrows in the middle of the track', () => {
  const result = getCarouselArrowState({ scrollLeft: 250, clientWidth: 300, scrollWidth: 900 });
  assert.equal(result.showPrev, true);
  assert.equal(result.showNext, true);
});

test('getCarouselArrowState hides next arrow at the end of the track', () => {
  const result = getCarouselArrowState({ scrollLeft: 600, clientWidth: 300, scrollWidth: 900 });
  assert.equal(result.showPrev, true);
  assert.equal(result.showNext, false);
});

test('getCarouselArrowState hides both arrows when the track is not scrollable', () => {
  const result = getCarouselArrowState({ scrollLeft: 0, clientWidth: 900, scrollWidth: 900 });
  assert.equal(result.showPrev, false);
  assert.equal(result.showNext, false);
});
