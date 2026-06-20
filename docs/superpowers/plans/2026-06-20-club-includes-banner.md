# Баннер «Что тебя ждёт в клубе» (#includes) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить на лендинг новую секцию `#includes` — угловой красно-чёрный баннер с заголовком-бейджем, горизонтальной свайп-каруселью из 6 фото и кнопкой «Стать участником», между блоками `#growth` и `#manifesto`.

**Architecture:** Чистая статическая разметка (HTML/CSS) + один новый ES5-блок в существующем `js/main.js` без модулей и фреймворков, в том же стиле, что и уже работающая логика sticky-CTA. Видимость стрелок прокрутки управляется чистой функцией `getCarouselArrowState`, покрытой unit-тестом — по той же схеме, что и существующая `shouldShowStickyCta`.

**Tech Stack:** Vanilla HTML5/CSS3/JS (ES5), `node:test` для юнит-теста чистой функции. Спека: `docs/superpowers/specs/2026-06-20-club-includes-banner-design.md`.

---

## Task 1: Чистая функция видимости стрелок карусели (TDD)

**Files:**
- Modify: `tests/main.test.js`
- Modify: `js/main.js`

- [ ] **Step 1: Добавить падающий тест**

В `tests/main.test.js` заменить строку импорта (строка 3):

```js
const { validateApplyForm, shouldShowStickyCta } = require('../js/main.js');
```

на:

```js
const { validateApplyForm, shouldShowStickyCta, getCarouselArrowState } = require('../js/main.js');
```

И добавить в конец файла (после последнего теста, строка 35):

```js

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
```

- [ ] **Step 2: Прогнать тесты, убедиться, что новые падают**

Run: `npm test`
Expected: FAIL — `TypeError: getCarouselArrowState is not a function` (остальные существующие тесты по-прежнему проходят).

- [ ] **Step 3: Реализовать функцию**

В `js/main.js` добавить новую функцию сразу после `shouldShowStickyCta` (после строки 20, перед строкой `if (typeof document !== 'undefined') {`):

```js
  function getCarouselArrowState(state) {
    var tolerance = 4;
    return {
      showPrev: state.scrollLeft > tolerance,
      showNext: state.scrollLeft + state.clientWidth < state.scrollWidth - tolerance,
    };
  }
```

И добавить функцию в экспорт в самом низу файла (строки 141-146):

```js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      validateApplyForm: validateApplyForm,
      shouldShowStickyCta: shouldShowStickyCta,
      getCarouselArrowState: getCarouselArrowState,
    };
  }
```

- [ ] **Step 4: Прогнать тесты, убедиться, что всё проходит**

Run: `npm test`
Expected: PASS — все тесты, включая 4 новых для `getCarouselArrowState`.

- [ ] **Step 5: Commit**

```bash
git add tests/main.test.js js/main.js
git commit -m "feat: add carousel arrow visibility helper"
```

---

## Task 2: Разметка секции `#includes`

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Добавить пункт навигации в хедер**

Заменить (строки 38-41):

```html
      <nav class="site-nav">
        <a href="#founder">Основатель</a>
        <a href="#faq">FAQ</a>
      </nav>
```

на:

```html
      <nav class="site-nav">
        <a href="#founder">Основатель</a>
        <a href="#includes">Что входит</a>
        <a href="#faq">FAQ</a>
      </nav>
```

- [ ] **Step 2: Добавить секцию между `#growth` и `#manifesto`**

Между закрывающим `</section>` блока `#growth` и открывающим `<section id="manifesto" class="manifesto">` (строки 97-99) вставить:

```html

    <section id="includes" class="includes">
      <div class="includes__bg" aria-hidden="true"></div>
      <div class="includes__inner">
        <h2 class="includes__badge">Что тебя ждёт в клубе</h2>

        <div class="includes__carousel">
          <div class="includes__track" role="region" aria-label="Фото из жизни клуба" tabindex="0">
            <div class="includes__slide"><img src="assets/club-photo-1.webp" alt="Атмосфера встречи клуба «ПОБЕДА»" loading="eager"></div>
            <div class="includes__slide"><img src="assets/club-photo-2.webp" alt="Атмосфера встречи клуба «ПОБЕДА»" loading="lazy"></div>
            <div class="includes__slide"><img src="assets/club-photo-3.webp" alt="Атмосфера встречи клуба «ПОБЕДА»" loading="lazy"></div>
            <div class="includes__slide"><img src="assets/club-photo-4.webp" alt="Атмосфера встречи клуба «ПОБЕДА»" loading="lazy"></div>
            <div class="includes__slide"><img src="assets/club-photo-5.webp" alt="Атмосфера встречи клуба «ПОБЕДА»" loading="lazy"></div>
            <div class="includes__slide"><img src="assets/club-photo-6.webp" alt="Атмосфера встречи клуба «ПОБЕДА»" loading="lazy"></div>
          </div>
          <button type="button" class="includes__arrow includes__arrow--prev" aria-label="Предыдущее фото" hidden>&larr;</button>
          <button type="button" class="includes__arrow includes__arrow--next" aria-label="Следующее фото">&rarr;</button>
        </div>

        <button type="button" class="btn btn--gold includes__cta" data-open-modal>Стать участником</button>
      </div>
    </section>
```

- [ ] **Step 3: Проверить разметку**

Run: `Select-String -Path index.html -Pattern 'id="includes"|href="#includes"'`
Expected: две строки — пункт навигации `href="#includes"` и `<section id="includes" class="includes">`.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add club-includes banner markup"
```

---

## Task 3: Стили секции `#includes`

**Files:**
- Modify: `css/styles.css`

- [ ] **Step 1: Добавить стили**

Вставить после строки 342 (закрывающая `}` медиа-запроса `.growth__text`) и перед строкой 344 (`.faq dt { ... }`):

```css

.includes {
  --color-bg: #0A0A0C;
  --color-bg-alt: #161618;
  --color-gold: #E31E24;
  --color-text: #FFFFFF;
  --color-text-muted: #B9B9BD;
  --font-serif: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
  overflow: hidden;
  background: var(--color-bg);
  color: var(--color-text);
  padding: var(--space-5) 0 var(--space-4);
}

.includes__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(circle at 92% 18%, rgba(227, 30, 36, 0.4), transparent 45%),
    radial-gradient(circle at 6% 88%, rgba(227, 30, 36, 0.4), transparent 45%);
}

.includes__inner { position: relative; z-index: 1; }

.includes__badge {
  display: inline-block;
  margin: 0 0 var(--space-3) var(--space-3);
  background: var(--color-gold);
  color: #fff;
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 10px 16px;
  border-radius: 2px;
}

.includes__carousel { position: relative; }

.includes__track {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-left: var(--space-3);
  padding-right: var(--space-3);
  cursor: grab;
}

.includes__track::-webkit-scrollbar { display: none; }
.includes__track--dragging { cursor: grabbing; scroll-snap-type: none; }

.includes__slide {
  flex: 0 0 auto;
  width: 62vw;
  aspect-ratio: 3 / 4;
  scroll-snap-align: start;
}

.includes__slide img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.includes__arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: var(--color-gold);
  color: #fff;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
}

.includes__arrow--prev { left: var(--space-3); }
.includes__arrow--next { right: var(--space-3); }
.includes__arrow[hidden] { display: none; }

.includes__cta {
  display: block;
  margin: var(--space-3) auto 0;
}

@media (min-width: 768px) {
  .includes { padding: var(--space-6) 0; }

  .includes__badge {
    position: absolute;
    top: var(--space-3);
    left: var(--space-3);
    margin: 0;
    z-index: 2;
  }

  .includes__slide { width: 240px; }

  .includes__cta {
    position: absolute;
    bottom: var(--space-3);
    right: var(--space-3);
    margin: 0;
  }
}
```

- [ ] **Step 2: Визуально проверить статичную разметку**

Открыть `index.html` напрямую в браузере (двойной клик или `file:///` путь). Ожидается: секция между «Бизнес растёт…» и манифестом — чёрный фон с красными размытыми пятнами по углам, красная плашка-заголовок слева сверху (на ширине ≥768px) или в потоke сверху (на узком окне), ряд из 6 слотов-фото со скруглёнными углами (картинки будут битыми — это ожидаемо, файлы `assets/club-photo-*.webp` ещё не добавлены), круглая стрелка справа от карусели, красная кнопка «Стать участником» в правом нижнем углу секции (desktop) или по центру под каруселью (mobile).

- [ ] **Step 3: Commit**

```bash
git add css/styles.css
git commit -m "style: add club-includes banner styles"
```

---

## Task 4: Интерактивность карусели (драг/свайп + стрелки)

**Files:**
- Modify: `js/main.js`

- [ ] **Step 1: Добавить логику карусели в `initApp`**

В `js/main.js`, внутри `initApp()`, после блока sticky-CTA (после строки `if (stickyCta) { ... }`, перед закрывающей `}` функции `initApp`) добавить:

```js

    var includesTrack = document.querySelector('.includes__track');
    var includesPrev = document.querySelector('.includes__arrow--prev');
    var includesNext = document.querySelector('.includes__arrow--next');

    if (includesTrack && includesPrev && includesNext) {
      function updateIncludesArrows() {
        var state = getCarouselArrowState({
          scrollLeft: includesTrack.scrollLeft,
          clientWidth: includesTrack.clientWidth,
          scrollWidth: includesTrack.scrollWidth,
        });
        includesPrev.hidden = !state.showPrev;
        includesNext.hidden = !state.showNext;
      }

      function includesSlideStep() {
        var slide = includesTrack.querySelector('.includes__slide');
        var gap = 16;
        return slide ? slide.getBoundingClientRect().width + gap : includesTrack.clientWidth;
      }

      includesPrev.addEventListener('click', function () {
        includesTrack.scrollBy({ left: -includesSlideStep(), behavior: 'smooth' });
      });
      includesNext.addEventListener('click', function () {
        includesTrack.scrollBy({ left: includesSlideStep(), behavior: 'smooth' });
      });
      includesTrack.addEventListener('scroll', updateIncludesArrows, { passive: true });
      updateIncludesArrows();

      var includesDragging = false;
      var includesDragStartX = 0;
      var includesDragStartScroll = 0;

      includesTrack.addEventListener('pointerdown', function (event) {
        includesDragging = true;
        includesDragStartX = event.clientX;
        includesDragStartScroll = includesTrack.scrollLeft;
        includesTrack.classList.add('includes__track--dragging');
      });
      includesTrack.addEventListener('pointermove', function (event) {
        if (!includesDragging) return;
        includesTrack.scrollLeft = includesDragStartScroll - (event.clientX - includesDragStartX);
      });
      function endIncludesDrag() {
        includesDragging = false;
        includesTrack.classList.remove('includes__track--dragging');
      }
      includesTrack.addEventListener('pointerup', endIncludesDrag);
      includesTrack.addEventListener('pointerleave', endIncludesDrag);
    }
```

- [ ] **Step 2: Прогнать существующие тесты, убедиться, что ничего не сломалось**

Run: `npm test`
Expected: PASS — все тесты (включая `getCarouselArrowState` из Task 1), без изменений в их количестве.

- [ ] **Step 3: Вручную проверить интерактивность в браузере**

Открыть `index.html` в браузере, в секции «Что тебя ждёт в клубе»:
- Перетащить мышью карусель влево — изображения должны сдвигаться, слева появляется стрелка-«назад».
- Долистать карусель до конца — правая стрелка-«вперёд» скрывается.
- Кликнуть по стрелке «вперёд»/«назад» — карусель плавно прокручивается на ширину одного слота.
- На узком окне (<768px) — то же самое работает через тач-свайп (эмулятор устройства в DevTools).
- Кнопка «Стать участником» открывает модалку заявки (как остальные CTA на странице).

- [ ] **Step 4: Commit**

```bash
git add js/main.js
git commit -m "feat: wire club-includes carousel interactions"
```

---

## Task 5: Финальная проверка

**Files:** нет изменений (только проверка).

- [ ] **Step 1: Полный прогон тестов**

Run: `npm test`
Expected: PASS — все тесты проходят (форма заявки, sticky CTA, `getCarouselArrowState`).

- [ ] **Step 2: Проверить порядок секций и оба брейкпоинта**

Открыть `index.html` в браузере:
- Порядок секций сверху вниз: Hero → Основатель → «Бизнес растёт…» → **Что тебя ждёт в клубе** → Манифест → Формат клуба → FAQ → финальный CTA.
- На ширине ≥768px: бейдж и кнопка стоят по углам секции (`position: absolute`).
- На ширине <768px: бейдж — обычный блок сверху слева, кнопка — по центру под каруселью, отступы вокруг карусели минимальны.
- Клик по пункту меню «Что входит» в хедере (desktop) скроллит к секции `#includes`.

- [ ] **Step 3: Зафиксировать напоминание для пользователя**

Сообщить пользователю, что для полноценного отображения нужно положить 6 файлов `assets/club-photo-1.webp` … `assets/club-photo-6.webp` (портрет 3:4) — до этого фото в карусели будут битыми, это ожидаемое поведение (см. спеку, §«Ассеты»).
