# Лендинг бизнес-клуба «ПОБЕДА» — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Собрать статический one-pager лендинг закрытого бизнес-клуба «ПОБЕДА» (Уфа) с модалкой заявки, которая уходит в Telegram через Vercel serverless-функцию.

**Architecture:** Чистый HTML/CSS/JS без билд-инструмента и фреймворков. `js/main.js` и `api/apply.js` написаны как CommonJS-модули с UMD-style экспортом (`module.exports`, если доступен) — это даёт юнит-тестируемые чистые функции (`validateApplication`, `formatTelegramMessage`, `validateApplyForm`, `shouldShowStickyCta`) без необходимости в jsdom или бандлере: в браузере `module` не определён, и DOM-обвязка просто не экспортируется. Вместо уникальных SVG-иконок на 17 пунктов списков используются золотые серифные номера («01», «02»...) — даёт тот же «абстрактный золотой» визуал из спеки без необходимости рисовать набор иконок.

**Tech Stack:** Vanilla HTML5 / CSS3 / JS (ES5-совместимый, без модулей), Node.js `node:test` для юнит-тестов чистых функций, Vercel Node.js serverless function (`api/apply.js`) для отправки в Telegram Bot API, Яндекс.Метрика (счётчик в `<head>`).

---

## Task 1: Инициализация проекта

**Files:**
- Create: `package.json`
- Create: `.gitignore`

- [ ] **Step 1: Инициализировать git-репозиторий**

Run: `git init`
Expected: `Initialized empty Git repository in .../Лендинг для Инст/.git/`

- [ ] **Step 2: Создать package.json**

```json
{
  "name": "pobeda-landing",
  "private": true,
  "version": "1.0.0",
  "description": "Лендинг закрытого бизнес-клуба «ПОБЕДА» (Уфа)",
  "scripts": {
    "test": "node --test tests/"
  }
}
```

- [ ] **Step 3: Создать .gitignore**

```
node_modules/
.vercel/
.DS_Store
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: init project"
```

---

## Task 2: Валидация заявки и форматирование сообщения (api/apply.js, часть 1)

**Files:**
- Create: `tests/apply.test.js`
- Create: `api/apply.js`

- [ ] **Step 1: Написать падающие тесты валидации**

```js
// tests/apply.test.js
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
```

- [ ] **Step 2: Запустить тесты — должны провалиться**

Run: `node --test tests/apply.test.js`
Expected: FAIL — `Cannot find module '../api/apply.js'`

- [ ] **Step 3: Реализовать validateApplication и formatTelegramMessage**

```js
// api/apply.js
function validateApplication(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Invalid request body'], name: '', contact: '' };
  }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const contact = typeof body.contact === 'string' ? body.contact.trim() : '';
  const errors = [];
  if (!name) errors.push('Имя обязательно');
  if (!contact) errors.push('Телефон или Telegram обязателен');
  if (body.website) errors.push('Spam detected');
  return { valid: errors.length === 0, errors, name, contact };
}

function formatTelegramMessage(data) {
  return 'Новая заявка на собеседование в клуб «ПОБЕДА»\n\nИмя: ' + data.name + '\nКонтакт: ' + data.contact;
}

module.exports.validateApplication = validateApplication;
module.exports.formatTelegramMessage = formatTelegramMessage;
```

- [ ] **Step 4: Запустить тесты — должны пройти**

Run: `node --test tests/apply.test.js`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add tests/apply.test.js api/apply.js
git commit -m "feat: add application validation and message formatting"
```

---

## Task 3: HTTP-хендлер с отправкой в Telegram (api/apply.js, часть 2)

**Files:**
- Modify: `tests/apply.test.js`
- Modify: `api/apply.js`

- [ ] **Step 1: Дописать падающие тесты на хендлер**

Добавить в конец `tests/apply.test.js`:

```js
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
```

- [ ] **Step 2: Запустить тесты — новые должны провалиться**

Run: `node --test tests/apply.test.js`
Expected: FAIL — `handler is not a function` (модуль пока не экспортирует функцию по умолчанию)

- [ ] **Step 3: Реализовать sendTelegramMessage и handler**

Заменить хвост `api/apply.js` (после `formatTelegramMessage`) на:

```js
async function sendTelegramMessage(options) {
  const url = 'https://api.telegram.org/bot' + options.token + '/sendMessage';
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: options.chatId, text: options.text }),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error('Telegram API error: ' + response.status + ' ' + errorBody);
  }
  return response.json();
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const result = validateApplication(req.body);
  if (!result.valid) {
    res.status(400).json({ ok: false, error: result.errors.join(', ') });
    return;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    res.status(500).json({ ok: false, error: 'Server is not configured' });
    return;
  }

  try {
    await sendTelegramMessage({
      token: token,
      chatId: chatId,
      text: formatTelegramMessage(result),
    });
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(502).json({ ok: false, error: 'Failed to deliver application' });
  }
}

module.exports = handler;
module.exports.validateApplication = validateApplication;
module.exports.formatTelegramMessage = formatTelegramMessage;
```

> Важно: `module.exports = handler` должно стоять **после** того, как `validateApplication`/`formatTelegramMessage` определены, а присваивание `module.exports.validateApplication = ...` — после `module.exports = handler` (иначе перезатрётся).

- [ ] **Step 4: Запустить тесты — все должны пройти**

Run: `node --test tests/apply.test.js`
Expected: PASS (10 tests)

- [ ] **Step 5: Commit**

```bash
git add api/apply.js tests/apply.test.js
git commit -m "feat: add Telegram delivery handler for application form"
```

---

## Task 4: Чистые функции js/main.js (валидация формы + sticky CTA)

**Files:**
- Create: `tests/main.test.js`
- Create: `js/main.js`

- [ ] **Step 1: Написать падающие тесты**

```js
// tests/main.test.js
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
```

- [ ] **Step 2: Запустить тесты — должны провалиться**

Run: `node --test tests/main.test.js`
Expected: FAIL — `Cannot find module '../js/main.js'`

- [ ] **Step 3: Создать js/main.js с чистыми функциями и заглушкой DOM-обвязки**

```js
// js/main.js
(function () {
  'use strict';

  var YANDEX_METRIKA_ID = 00000000; // TODO: заменить на реальный ID счётчика после создания

  function validateApplyForm(data) {
    var errors = {};
    var name = data.name ? String(data.name).trim() : '';
    var contact = data.contact ? String(data.contact).trim() : '';
    if (!name) errors.name = 'Введите имя';
    if (!contact) errors.contact = 'Введите телефон или Telegram';
    if (!data.consent) errors.consent = 'Нужно согласие на обработку данных';
    if (data.website) errors.website = 'spam';
    return { valid: Object.keys(errors).length === 0, errors: errors };
  }

  function shouldShowStickyCta(state) {
    if (state.modalOpen) return false;
    return state.scrollY > state.heroBottom;
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initApp);
  }

  function initApp() {
    // DOM-обвязка добавляется в Task 6
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      validateApplyForm: validateApplyForm,
      shouldShowStickyCta: shouldShowStickyCta,
    };
  }
})();
```

- [ ] **Step 4: Запустить тесты — должны пройти**

Run: `node --test tests/main.test.js`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add js/main.js tests/main.test.js
git commit -m "feat: add form validation and sticky CTA visibility logic"
```

---

## Task 5: Каркас index.html и SEO-метатеги

**Files:**
- Create: `index.html`

- [ ] **Step 1: Создать index.html с head и базовой структурой секций**

```html
<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Бизнес-клуб «ПОБЕДА» — закрытый клуб предпринимателей Уфы</title>
  <meta name="description" content="ПОБЕДА — закрытый клуб предпринимателей Уфы. Сильное окружение, мастермайнды и честная поддержка для роста бизнеса. Вступление по собеседованию.">
  <meta property="og:title" content="Бизнес-клуб «ПОБЕДА» — закрытый клуб предпринимателей Уфы">
  <meta property="og:description" content="Закрытый клуб предпринимателей Уфы. Вступление по собеседованию.">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="ru_RU">
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <header class="site-header">
    <div class="container site-header__inner">
      <a href="#hero" class="logo">ПОБЕДА</a>
      <nav class="site-nav">
        <a href="#what-is-included">Что входит</a>
        <a href="#founder">Основатель</a>
        <a href="#faq">FAQ</a>
      </nav>
      <button type="button" class="btn btn--gold btn--small" data-open-modal>Подать заявку</button>
    </div>
  </header>

  <main>
    <!-- Секции наполняются в Task 6 -->
  </main>

  <footer class="site-footer">
    <!-- Наполняется в Task 6 -->
  </footer>

  <div class="sticky-cta" id="stickyCta">
    <button type="button" class="btn btn--gold btn--full" data-open-modal>Подать заявку на собеседование</button>
  </div>

  <!-- Модалка добавляется в Task 7 -->

  <script src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Открыть index.html в браузере и проверить**

Открыть файл напрямую или через `npx serve .` → проверить: заголовок вкладки «Бизнес-клуб «ПОБЕДА»...», шрифты Playfair/Inter подключились (Network → fonts.googleapis.com 200), хедер с лого и кнопкой видим.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add page shell and SEO meta tags"
```

---

## Task 6: Контентные блоки index.html (hero, боли, манифест, что входит, основатель, формат, FAQ, финальный CTA, футер)

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Заполнить `<main>` всеми блоками**

Заменить `<!-- Секции наполняются в Task 6 -->` на:

```html
<section id="hero" class="hero">
  <div class="container">
    <p class="eyebrow">ПОБЕДА — закрытый клуб предпринимателей. Уфа.</p>
    <h1>Большие победы редко достигаются в одиночку</h1>
    <p class="hero__subtitle">Закрытый клуб предпринимателей Уфы. Сильное окружение, честная обратная связь и люди, которые понимают ваш бизнес.</p>
    <button type="button" class="btn btn--gold" data-open-modal>Подать заявку на собеседование</button>
    <p class="hero__note">Вступление только после личного разговора</p>
  </div>
</section>

<section id="pains" class="pains">
  <div class="container">
    <h2>Узнаёте себя?</h2>
    <p class="section-intro">Большинство предпринимателей сталкиваются с одним и тем же — даже если внешне всё выглядит благополучно.</p>
    <ul class="card-grid">
      <li class="card"><span class="card__num">01</span>Одиночество в принятии решений</li>
      <li class="card"><span class="card__num">02</span>Нет окружения, которое понимает бизнес</li>
      <li class="card"><span class="card__num">03</span>Не с кем обсудить проблему открыто</li>
      <li class="card"><span class="card__num">04</span>Не хватает честной обратной связи</li>
      <li class="card"><span class="card__num">05</span>Сложно искать партнёров и нужные связи</li>
      <li class="card"><span class="card__num">06</span>Не хватает новых идей и энергии для роста</li>
    </ul>
  </div>
</section>

<section id="manifesto" class="manifesto">
  <div class="container">
    <p>Победа — это не победа над конкурентами.<br>
    Это победа над одиночеством.<br>
    Над хаосом. Над страхами.<br>
    Победа через окружение.<br>
    Через совместное движение вперёд.</p>
    <p class="manifesto__quote">«Большие победы редко достигаются в одиночку.»</p>
  </div>
</section>

<section id="what-is-included" class="included">
  <div class="container">
    <h2>Что входит в клуб</h2>
    <ul class="card-grid card-grid--wide">
      <li class="card"><span class="card__num">01</span><strong>Ежемесячные встречи</strong><span>Реальные разговоры, а не созвоны для галочки</span></li>
      <li class="card"><span class="card__num">02</span><strong>Мастермайнды</strong><span>Разбор сложных решений с теми, кто прошёл похожий путь</span></li>
      <li class="card"><span class="card__num">03</span><strong>Закрытый чат</strong><span>Всегда на связи с людьми, которые понимают бизнес</span></li>
      <li class="card"><span class="card__num">04</span><strong>Спортивные мероприятия</strong><span>Энергия и форма наравне с делом</span></li>
      <li class="card"><span class="card__num">05</span><strong>Совместные поездки</strong><span>Больше контекста, больше доверия</span></li>
      <li class="card"><span class="card__num">06</span><strong>Приглашённые эксперты</strong><span>Практический опыт, не теория</span></li>
      <li class="card"><span class="card__num">07</span><strong>Поиск партнёров</strong><span>Нужные связи внутри закрытого круга</span></li>
      <li class="card"><span class="card__num">08</span><strong>Нетворкинг</strong><span>Знакомства, которые работают</span></li>
      <li class="card"><span class="card__num">09</span><strong>Совместный отдых с семьями</strong><span>Клуб не только про бизнес</span></li>
      <li class="card"><span class="card__num">10</span><strong>Помощь в кризисных ситуациях</strong><span>Поддержка, когда она нужнее всего</span></li>
      <li class="card"><span class="card__num">11</span><strong>Разборы бизнеса участников</strong><span>Взгляд со стороны от тех, кому можно доверять</span></li>
    </ul>
  </div>
</section>

<section id="founder" class="founder">
  <div class="container founder__inner">
    <div class="founder__avatar" aria-hidden="true"></div>
    <div>
      <p class="eyebrow">Кто стоит за клубом</p>
      <h2>[Имя Фамилия]</h2>
      <p>Предприниматель из Уфы. Создал клуб «ПОБЕДА», потому что сам прошёл путь одиночества в бизнесе — и знает, как сильное окружение меняет скорость роста.</p>
      <p class="founder__quote">«Я создал клуб, в который сам хотел бы прийти на старте своего пути.»</p>
    </div>
  </div>
</section>

<section id="format" class="format">
  <div class="container">
    <h2>Формат клуба</h2>
    <ul class="card-grid">
      <li class="card">Закрытый клуб — вступление только после собеседования</li>
      <li class="card">Платное участие — условия обсуждаются индивидуально на собеседовании</li>
      <li class="card">Без ограничений по нише и обороту — важна готовность быть частью круга</li>
    </ul>
  </div>
</section>

<section id="faq" class="faq">
  <div class="container">
    <h2>Вопросы и ответы</h2>
    <dl>
      <dt>Сколько стоит участие?</dt>
      <dd>Стоимость и условия участия обсуждаются индивидуально на собеседовании.</dd>
      <dt>Как происходит вступление?</dt>
      <dd>Вы оставляете заявку, мы созваниваемся, знакомимся и решаем, подходит ли клуб друг другу.</dd>
      <dt>Для кого этот клуб?</dt>
      <dd>Для предпринимателей Уфы — без ограничений по нише и обороту. Важнее готовность быть открытым и вкладываться в окружение.</dd>
      <dt>Это про обучение или нетворкинг?</dt>
      <dd>Ни то, ни другое в чистом виде. Это среда: встречи, мастермайнды, честная обратная связь и поддержка от людей, которые сами в бизнесе.</dd>
      <dt>Сколько человек в клубе?</dt>
      <dd>Клуб закрытый и небольшой по составу — это принципиально для качества общения.</dd>
    </dl>
  </div>
</section>

<section id="final-cta" class="final-cta">
  <div class="container">
    <h2>Готовы перестать быть один на один с бизнесом?</h2>
    <button type="button" class="btn btn--gold" data-open-modal>Подать заявку на собеседование</button>
  </div>
</section>
```

- [ ] **Step 2: Заполнить `<footer>`**

Заменить `<!-- Наполняется в Task 6 -->` на:

```html
<div class="container site-footer__inner">
  <span class="logo">ПОБЕДА</span>
  <p>Закрытый клуб предпринимателей. Уфа.</p>
  <a href="#" target="_blank" rel="noopener">Instagram</a>
  <a href="privacy.html">Политика обработки персональных данных</a>
  <p class="site-footer__copy">© 2026 Клуб «ПОБЕДА»</p>
</div>
```

- [ ] **Step 3: Открыть index.html в браузере и проверить**

Проверить, что все 9 секций отрендерились в порядке: hero → боли → манифест → что входит (11 пунктов) → основатель → формат (3 пункта) → FAQ (5 вопросов) → финальный CTA → футер. Якоря в навигации хедера скроллят к нужным секциям.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add landing page content sections"
```

---

## Task 7: Модальная форма заявки

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Добавить модалку перед `<script src="js/main.js">`**

```html
<div class="modal" id="applyModal" aria-hidden="true">
  <div class="modal__overlay" data-modal-close></div>
  <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="applyModalTitle">
    <button type="button" class="modal__close" data-modal-close aria-label="Закрыть">&times;</button>
    <h2 id="applyModalTitle">Заявка на собеседование</h2>
    <form id="applyForm" novalidate>
      <label for="applyName">Имя</label>
      <input type="text" id="applyName" name="name" autocomplete="name">
      <span class="form-error" data-error-for="name"></span>

      <label for="applyContact">Телефон или Telegram</label>
      <input type="text" id="applyContact" name="contact" autocomplete="tel">
      <span class="form-error" data-error-for="contact"></span>

      <div class="form-website">
        <label for="applyWebsite">Website</label>
        <input type="text" id="applyWebsite" name="website" tabindex="-1" autocomplete="off">
      </div>

      <label class="form-consent">
        <input type="checkbox" id="applyConsent" name="consent">
        Даю согласие на обработку персональных данных в соответствии с <a href="privacy.html" target="_blank" rel="noopener">Политикой обработки персональных данных</a>
      </label>
      <span class="form-error" data-error-for="consent"></span>

      <button type="submit" class="btn btn--gold btn--full">Отправить заявку</button>
      <p class="form-status" id="applyFormStatus" role="status" aria-live="polite"></p>
    </form>
  </div>
</div>
```

- [ ] **Step 2: Открыть index.html и проверить вёрстку модалки**

Модалка должна быть в DOM, но визуально скрыта до открытия (стили скрытия добавятся в Task 9 — на этом шаге допустимо, что модалка видна как обычный блок, это проверим после CSS).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add application modal markup"
```

---

## Task 8: CSS — дизайн-токены, типографика, базовый layout (mobile-first)

**Files:**
- Create: `css/styles.css`

- [ ] **Step 1: Создать css/styles.css с переменными, ресетом и базовой типографикой**

```css
:root {
  --color-bg: #0E0E10;
  --color-bg-alt: #1A1A1D;
  --color-gold: #C9A24B;
  --color-text: #F2F0EB;
  --color-text-muted: #B8B6B0;
  --font-serif: 'Playfair Display', Georgia, serif;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --container-width: 1120px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 40px;
  --space-5: 64px;
  --space-6: 96px;
}

* { box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  margin: 0;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

h1, h2 {
  font-family: var(--font-serif);
  font-weight: 700;
  line-height: 1.2;
  margin: 0 0 var(--space-3);
}

h1 { font-size: 2rem; }
h2 { font-size: 1.75rem; }

p { margin: 0 0 var(--space-3); color: var(--color-text-muted); }

a { color: var(--color-gold); text-decoration: none; }

.container {
  width: 100%;
  max-width: var(--container-width);
  margin: 0 auto;
  padding: 0 var(--space-3);
}

.eyebrow {
  color: var(--color-gold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.8rem;
  margin-bottom: var(--space-2);
}

.btn {
  display: inline-block;
  border: 1px solid var(--color-gold);
  background: transparent;
  color: var(--color-gold);
  font-family: var(--font-sans);
  font-weight: 600;
  padding: 14px 28px;
  border-radius: 2px;
  cursor: pointer;
  text-align: center;
}

.btn--gold { background: var(--color-gold); color: var(--color-bg); }
.btn--small { padding: 8px 16px; font-size: 0.85rem; }
.btn--full { display: block; width: 100%; }

@media (min-width: 768px) {
  h1 { font-size: 3rem; }
  h2 { font-size: 2.25rem; }
}
```

- [ ] **Step 2: Открыть index.html и проверить фон/типографику**

Через DevTools убедиться: фон `#0E0E10`, заголовки в Playfair Display, золотая кнопка CTA, контейнер ограничен 1120px на широком экране.

- [ ] **Step 3: Commit**

```bash
git add css/styles.css
git commit -m "feat: add design tokens and base typography"
```

---

## Task 9: CSS — компоненты (header, hero, карточки, манифест, основатель, FAQ, модалка, sticky CTA, футер)

**Files:**
- Modify: `css/styles.css`

- [ ] **Step 1: Дописать стили компонентов в конец css/styles.css**

```css
.site-header {
  position: sticky;
  top: 0;
  background: rgba(14, 14, 16, 0.92);
  backdrop-filter: blur(6px);
  z-index: 10;
  border-bottom: 1px solid var(--color-bg-alt);
}

.site-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-2);
  padding-bottom: var(--space-2);
}

.logo { font-family: var(--font-serif); font-size: 1.25rem; color: var(--color-text); letter-spacing: 0.05em; }

.site-nav { display: none; gap: var(--space-3); }
.site-nav a { color: var(--color-text-muted); }

@media (min-width: 768px) {
  .site-nav { display: flex; }
}

.hero {
  padding: var(--space-6) 0;
  text-align: center;
}

.hero__subtitle { max-width: 560px; margin: 0 auto var(--space-4); }
.hero__note { color: var(--color-text-muted); font-size: 0.85rem; margin-top: var(--space-2); }

.section-intro { max-width: 560px; }

.card-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}

@media (min-width: 768px) {
  .card-grid { grid-template-columns: repeat(2, 1fr); }
  .card-grid--wide { grid-template-columns: repeat(3, 1fr); }
}

.card {
  background: var(--color-bg-alt);
  padding: var(--space-3);
  border-radius: 4px;
  border: 1px solid rgba(201, 162, 75, 0.2);
}

.card strong { display: block; font-family: var(--font-serif); margin-bottom: 4px; }
.card span { color: var(--color-text-muted); font-size: 0.9rem; }

.card__num {
  display: block;
  font-family: var(--font-serif);
  color: var(--color-gold);
  font-size: 1.25rem;
  margin-bottom: 8px;
}

.manifesto {
  padding: var(--space-6) 0;
  text-align: center;
  background: var(--color-bg-alt);
}

.manifesto p:first-child { font-family: var(--font-serif); font-size: 1.5rem; color: var(--color-text); }
.manifesto__quote { color: var(--color-gold); font-size: 1.25rem; margin-top: var(--space-4); }

.founder__inner {
  display: grid;
  gap: var(--space-4);
  align-items: center;
}

@media (min-width: 768px) {
  .founder__inner { grid-template-columns: 240px 1fr; }
}

.founder__avatar {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, var(--color-gold), var(--color-bg-alt) 70%);
  margin: 0 auto;
}

.founder__quote { color: var(--color-gold); font-style: italic; }

.faq dt { font-family: var(--font-serif); color: var(--color-text); margin-top: var(--space-3); }
.faq dd { margin: 4px 0 0; }

.final-cta { text-align: center; padding: var(--space-6) 0; }

.site-footer { border-top: 1px solid var(--color-bg-alt); padding: var(--space-4) 0; }
.site-footer__inner { text-align: center; }
.site-footer__copy { font-size: 0.8rem; }

.sticky-cta {
  position: fixed;
  left: 0;
  right: 0;
  bottom: -100px;
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg);
  border-top: 1px solid var(--color-gold);
  transition: bottom 0.25s ease;
  z-index: 20;
}

.sticky-cta--visible { bottom: 0; }

@media (min-width: 768px) {
  .sticky-cta { display: none; }
}

.modal {
  position: fixed;
  inset: 0;
  display: none;
  z-index: 30;
}

.modal--open { display: block; }

.modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
}

.modal__dialog {
  position: relative;
  max-width: 420px;
  margin: var(--space-5) auto;
  background: var(--color-bg-alt);
  padding: var(--space-4);
  border-radius: 4px;
  border: 1px solid rgba(201, 162, 75, 0.3);
}

.modal__close {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 1.5rem;
  cursor: pointer;
}

#applyForm label { display: block; margin-top: var(--space-2); font-size: 0.9rem; }
#applyForm input[type="text"] {
  width: 100%;
  padding: 10px;
  margin-top: 4px;
  background: var(--color-bg);
  border: 1px solid rgba(201, 162, 75, 0.3);
  color: var(--color-text);
  border-radius: 2px;
}

.form-website { position: absolute; left: -9999px; }
.form-consent { display: flex; gap: 8px; align-items: flex-start; font-size: 0.85rem; color: var(--color-text-muted); }
.form-error { display: block; color: #d9534f; font-size: 0.8rem; min-height: 1em; }
.form-status { margin-top: var(--space-2); font-size: 0.9rem; }

body.no-scroll { overflow: hidden; }
```

- [ ] **Step 2: Открыть index.html и проверить визуально**

Проверить: модалка скрыта по умолчанию (`display:none` пока нет класса `modal--open`), sticky CTA спрятан за нижним краем экрана, карточки в 2-3 колонки на десктопе и в 1 колонку на мобильной ширине (DevTools → responsive 375px).

- [ ] **Step 3: Commit**

```bash
git add css/styles.css
git commit -m "feat: style header, content blocks, modal and sticky CTA"
```

---

## Task 10: DOM-обвязка js/main.js (модалка, отправка формы, sticky CTA)

**Files:**
- Modify: `js/main.js`

- [ ] **Step 1: Заменить заглушку initApp на полную обвязку**

Заменить `function initApp() { ... }` в `js/main.js` на:

```js
  function initApp() {
    var modal = document.getElementById('applyModal');
    var openTriggers = document.querySelectorAll('[data-open-modal]');
    var closeTriggers = modal ? modal.querySelectorAll('[data-modal-close]') : [];
    var form = document.getElementById('applyForm');
    var statusEl = document.getElementById('applyFormStatus');
    var stickyCta = document.getElementById('stickyCta');
    var hero = document.getElementById('hero');
    var modalOpen = false;

    function openModal() {
      if (!modal) return;
      modal.classList.add('modal--open');
      modal.setAttribute('aria-hidden', 'false');
      modalOpen = true;
      document.body.classList.add('no-scroll');
      updateStickyCta();
    }

    function closeModal() {
      if (!modal) return;
      modal.classList.remove('modal--open');
      modal.setAttribute('aria-hidden', 'true');
      modalOpen = false;
      document.body.classList.remove('no-scroll');
      updateStickyCta();
    }

    for (var i = 0; i < openTriggers.length; i++) {
      openTriggers[i].addEventListener('click', openModal);
    }
    for (var j = 0; j < closeTriggers.length; j++) {
      closeTriggers[j].addEventListener('click', closeModal);
    }
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && modalOpen) closeModal();
    });

    function clearErrors() {
      var errorEls = form.querySelectorAll('.form-error');
      for (var k = 0; k < errorEls.length; k++) errorEls[k].textContent = '';
    }

    function showErrors(errors) {
      clearErrors();
      Object.keys(errors).forEach(function (field) {
        var el = form.querySelector('[data-error-for="' + field + '"]');
        if (el) el.textContent = errors[field];
      });
    }

    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var data = {
          name: form.elements.name.value,
          contact: form.elements.contact.value,
          consent: form.elements.consent.checked,
          website: form.elements.website.value,
        };
        var result = validateApplyForm(data);
        if (!result.valid) {
          showErrors(result.errors);
          return;
        }
        clearErrors();
        submitApplication(data);
      });
    }

    function submitApplication(data) {
      var submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      statusEl.textContent = '';
      fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, contact: data.contact, website: data.website }),
      })
        .then(function (response) {
          if (!response.ok) throw new Error('Request failed');
          return response.json();
        })
        .then(function () {
          statusEl.textContent = 'Заявка получена. Мы свяжемся с вами в ближайшее время.';
          form.reset();
          if (window.ym) {
            window.ym(YANDEX_METRIKA_ID, 'reachGoal', 'form_submit');
          }
        })
        .catch(function () {
          statusEl.textContent = 'Не удалось отправить заявку. Попробуйте ещё раз или напишите нам в Telegram.';
        })
        .finally(function () {
          submitBtn.disabled = false;
        });
    }

    function updateStickyCta() {
      if (!stickyCta || !hero) return;
      var heroBottom = hero.getBoundingClientRect().bottom + window.scrollY;
      var show = shouldShowStickyCta({
        scrollY: window.scrollY,
        heroBottom: heroBottom,
        modalOpen: modalOpen,
      });
      stickyCta.classList.toggle('sticky-cta--visible', show);
    }

    if (stickyCta) {
      window.addEventListener('scroll', updateStickyCta, { passive: true });
      updateStickyCta();
    }
  }
```

- [ ] **Step 2: Перезапустить юнит-тесты — не должны сломаться**

Run: `node --test tests/main.test.js`
Expected: PASS (6 tests) — `initApp` не выполняется в Node, т.к. `document` не определён

- [ ] **Step 3: Проверить вручную в браузере**

Открыть `index.html` через `npx serve .` (нужен http-сервер, не `file://`, иначе `fetch('/api/apply')` не сработает корректно на следующем шаге):
- Клик по «Подать заявку» открывает модалку, Escape и крестик закрывают.
- Пустая отправка формы показывает ошибки под полями.
- Скролл мимо hero на мобильной ширине (375px, DevTools) показывает sticky CTA снизу; на ширине ≥768px sticky CTA не появляется.

- [ ] **Step 4: Commit**

```bash
git add js/main.js
git commit -m "feat: wire up modal, form submission and sticky CTA behaviour"
```

---

## Task 11: Политика обработки персональных данных (152-ФЗ)

**Files:**
- Create: `privacy.html`

- [ ] **Step 1: Создать privacy.html**

```html
<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Политика обработки персональных данных — Клуб «ПОБЕДА»</title>
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <header class="site-header">
    <div class="container site-header__inner">
      <a href="index.html" class="logo">ПОБЕДА</a>
    </div>
  </header>
  <main class="container" style="padding: var(--space-5) var(--space-3); max-width: 720px;">
    <h1>Политика обработки персональных данных</h1>
    <p><strong>Оператор персональных данных:</strong> [указать наименование/ИП и реквизиты].</p>
    <p><strong>Цель обработки:</strong> рассмотрение заявки на собеседование для вступления в клуб «ПОБЕДА» и связь с заявителем.</p>
    <p><strong>Состав обрабатываемых данных:</strong> имя, номер телефона и/или контакт в Telegram, указанные заявителем в форме на сайте.</p>
    <p><strong>Передача третьим лицам:</strong> данные не передаются третьим лицам, за исключением технических сервисов, обеспечивающих работу сайта и доставку заявки (хостинг, Telegram).</p>
    <p><strong>Срок обработки:</strong> до достижения цели обработки или отзыва согласия заявителем.</p>
    <p><strong>Права субъекта данных:</strong> заявитель вправе отозвать согласие на обработку персональных данных, направив сообщение по контакту, указанному на сайте.</p>
    <p><a href="index.html">&larr; Назад на главную</a></p>
  </main>
</body>
</html>
```

- [ ] **Step 2: Проверить ссылку из модалки**

Открыть `index.html`, открыть модалку заявки, кликнуть по ссылке «Политикой обработки персональных данных» — должна открыться `privacy.html` в новой вкладке.

- [ ] **Step 3: Commit**

```bash
git add privacy.html
git commit -m "feat: add personal data processing policy page"
```

---

## Task 12: Favicon, robots.txt, sitemap.xml

**Files:**
- Create: `assets/favicon.svg`
- Create: `robots.txt`
- Create: `sitemap.xml`

- [ ] **Step 1: Создать assets/favicon.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="32" fill="#0E0E10"/>
  <text x="32" y="42" font-family="Georgia, serif" font-size="32" fill="#C9A24B" text-anchor="middle">П</text>
</svg>
```

- [ ] **Step 2: Создать robots.txt**

```
User-agent: *
Allow: /

Sitemap: /sitemap.xml
```

- [ ] **Step 3: Создать sitemap.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>/index.html</loc></url>
  <url><loc>/privacy.html</loc></url>
</urlset>
```

> Примечание: `<loc>` указаны относительными путями-плейсхолдерами. После подключения реального домена нужно заменить на полные абсолютные URL (например `https://pobeda-ufa.ru/index.html`).

- [ ] **Step 4: Проверить favicon в браузере**

Открыть `index.html`, убедиться, что во вкладке браузера отображается золотая буква «П» на тёмном круге.

- [ ] **Step 5: Commit**

```bash
git add assets/favicon.svg robots.txt sitemap.xml
git commit -m "feat: add favicon, robots.txt and sitemap"
```

---

## Task 13: Яндекс.Метрика

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Добавить счётчик в `<head>` перед `</head>`**

```html
<!-- Yandex.Metrika counter -->
<script type="text/javascript">
  (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();
  for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
  (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

  ym(00000000, "init", { // TODO: заменить 00000000 на реальный ID счётчика
       clickmap:true,
       trackLinks:true,
       accurateTrackBounce:true
  });
</script>
<noscript><div><img src="https://mc.yandex.ru/watch/00000000" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
```

- [ ] **Step 2: Синхронизировать ID счётчика с js/main.js**

Открыть `js/main.js`, убедиться, что `YANDEX_METRIKA_ID` (Task 4) равен тому же плейсхолдеру `00000000` — при подключении реального счётчика оба значения обновляются вместе.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add Yandex.Metrika counter with form_submit goal"
```

---

## Task 14: README с инструкцией деплоя

**Files:**
- Create: `README.md`

- [ ] **Step 1: Создать README.md**

```markdown
# Лендинг бизнес-клуба «ПОБЕДА»

Статический сайт (HTML/CSS/JS) + одна Vercel serverless-функция для отправки заявок в Telegram.

## Локальный запуск

```
npx vercel dev
```

(нужен для корректной работы `/api/apply` локально; обычный статический сервер `npx serve .` подойдёт только для просмотра вёрстки без отправки формы)

## Тесты

```
npm test
```

## Переменные окружения (Vercel → Project Settings → Environment Variables)

- `TELEGRAM_BOT_TOKEN` — токен бота, который будет слать заявки
- `TELEGRAM_CHAT_ID` — chat_id получателя заявок

## Деплой

```
npx vercel
npx vercel --prod
```

## Что нужно заменить перед публикацией рекламы

- Имя/фото/текст основателя в `index.html` (секция `#founder`)
- Ссылку на Instagram в футере `index.html`
- `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` в Vercel
- ID счётчика Яндекс.Метрики в `index.html` и `js/main.js` (`YANDEX_METRIKA_ID`)
- Реквизиты оператора в `privacy.html`
- Абсолютные URL в `sitemap.xml` после подключения домена
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add setup and deployment instructions"
```

---

## Task 15: Полная проверка через vercel dev

**Files:** (без изменений кода)

- [ ] **Step 1: Запустить тесты целиком**

Run: `npm test`
Expected: PASS — все тесты из `tests/apply.test.js` и `tests/main.test.js` (16 тестов)

- [ ] **Step 2: Поднять локальный Vercel dev-сервер**

Run: `npx vercel dev`
При первом запуске потребуется `vercel login` и привязка проекта (можно выбрать "Link to existing project? No" → создать новый при первом деплое, или просто продолжить локально без линковки, если CLI это позволяет).

- [ ] **Step 3: Вручную пройти заявку end-to-end**

Перед тестом задать локально переменные окружения (например в `.env` файле, который Vercel CLI подхватывает: `TELEGRAM_BOT_TOKEN=...`, `TELEGRAM_CHAT_ID=...`) с тестовым ботом.
1. Открыть `http://localhost:3000`.
2. Заполнить и отправить форму заявки с реальным тестовым ботом.
3. Убедиться, что сообщение пришло в Telegram-чат и в модалке показалось «Заявка получена...».
4. Отправить форму с пустыми полями — убедиться, что показываются ошибки и запрос на `/api/apply` не уходит.

- [ ] **Step 4: Финальный commit (если были правки по итогам проверки)**

```bash
git add -A
git commit -m "chore: final manual verification fixes"
```

---

## Self-Review Notes

- **Покрытие спеки:** все 10 блоков из `claude.md` §5 покрыты (Task 6–7), визуальная концепция §4 — Task 8–9, техническая реализация §6 — Task 1–4, 10, 13–14, юридический блок §7 — Task 11, плейсхолдеры §8 зафиксированы в коде явными `TODO`/placeholder-значениями и в README §«Что нужно заменить».
- **Изменение визуального решения:** иконки заменены золотыми номерами (см. Architecture) — это сужение в рамках уже одобренной «абстрактной золотой графики», не новая функциональность.
- **OG-изображение:** сознательно не включено в Task 5 (`og:image` отсутствует) — нет реального визуала для премиального брендированного баннера; добавить отдельной задачей, когда появятся реальные фото/брендинг.
