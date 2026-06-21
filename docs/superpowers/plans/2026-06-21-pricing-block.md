# Pricing Block (replace Format/FAQ/Final-CTA) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the `#format`, `#faq` and `#final-cta` sections entirely and replace them with a single new `#pricing` section (same position, between `#statement` and the footer) containing two white tariff cards — "Standart" and "VIP" — matching the user-provided reference screenshot, with the dead `FAQ` nav link replaced by a `Тарифы` link to the new section.

**Architecture:** Pure static HTML/CSS change in the existing one-pager (`index.html` + `css/styles.css`). No JS changes — the CTA buttons reuse the existing `[data-open-modal]` mechanism that `js/main.js` already wires up generically. No new asset files.

**Tech Stack:** Vanilla HTML5 / CSS3 (mobile-first, existing CSS custom properties for spacing/color). No build step — verify by opening the file with `npx serve .`. Existing `node --test` suite covers only `js/main.js` pure functions and is unaffected by this markup/CSS change, but is re-run as a regression check.

---

### Task 1: Update `index.html` — nav link, remove old sections, add `#pricing` section

**Files:**
- Modify: `index.html:41` (nav link)
- Modify: `index.html:134-168` (`#format`, `#faq`, `#final-cta` sections)

- [ ] **Step 1: Replace the dead FAQ nav link with a Тарифы link**

Find this block in `index.html` (lines 38-42):

```html
      <nav class="site-nav">
        <a href="#founder">Основатель</a>
        <a href="#includes">Что входит</a>
        <a href="#faq">FAQ</a>
      </nav>
```

Replace it with:

```html
      <nav class="site-nav">
        <a href="#founder">Основатель</a>
        <a href="#includes">Что входит</a>
        <a href="#pricing">Тарифы</a>
      </nav>
```

- [ ] **Step 2: Replace the `#format` / `#faq` / `#final-cta` sections with the new `#pricing` section**

Find this block in `index.html` (lines 134-168):

```html
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

Replace it with:

```html
    <section id="pricing" class="pricing">
      <div class="container">
        <h2>Форматы участия</h2>
        <div class="pricing-grid">
          <div class="pricing-card">
            <h3 class="pricing-card__title">Standart</h3>
            <ul class="pricing-card__list">
              <li><span class="pricing-card__badge">10</span><span>итоговых встреч резидентов клуба;</span></li>
              <li><span class="pricing-card__badge">10</span><span>бизнес-завтраков;</span></li>
              <li><span class="pricing-card__badge">10</span><span>советов директоров в формате групповых разборов (мастермайнд сессий);</span></li>
              <li><span class="pricing-card__badge">5</span><span>мастер-классов по личному бренду, финансам, привлечению инвестиций, продажам и интернет-маркетингу;</span></li>
              <li><span class="pricing-card__badge">80+</span><span>участников — закрытый чат клуба-предпринимателей;</span></li>
              <li>спортивные/развлекательные мероприятия, неформальные встречи Клуба (волейбол, пейнтбол, бизнес-баня и другие).</li>
            </ul>
            <button type="button" class="btn btn--gold btn--full pricing-card__cta" data-open-modal>Узнать стоимость</button>
          </div>

          <div class="pricing-card">
            <h3 class="pricing-card__title">VIP</h3>
            <p class="pricing-card__subtitle"><strong>Закрытая ВИП мастермайнд группа</strong><br>резидентов клуба с доходом от 1 млн. рублей в месяц</p>
            <ul class="pricing-card__list">
              <li><span class="pricing-card__badge">10</span><span>итоговых встреч резидентов клуба;</span></li>
              <li><span class="pricing-card__badge">10</span><span>бизнес-завтраков;</span></li>
              <li><span class="pricing-card__badge">10</span><span>советов директоров в формате групповых разборов (мастермайнд сессий);</span></li>
              <li><span class="pricing-card__badge">3</span><span>экскурсии в топовые компании;</span></li>
              <li><span class="pricing-card__badge">5</span><span>мастер-классов по личному бренду, финансам, привлечению инвестиций, продажам и интернет-маркетингу;</span></li>
              <li><span class="pricing-card__badge">80+</span><span>участников — закрытый чат клуба-предпринимателей;</span></li>
              <li>спортивные/развлекательные мероприятия, неформальные встречи Клуба (волейбол, пейнтбол, бизнес-баня и другие).</li>
            </ul>
            <button type="button" class="btn btn--gold btn--full pricing-card__cta" data-open-modal>Узнать стоимость</button>
          </div>
        </div>
      </div>
    </section>
```

- [ ] **Step 3: Confirm no leftover references to the removed ids/classes remain in `index.html`**

Run: `Select-String -Path index.html -Pattern 'id="format"|id="faq"|id="final-cta"|class="format"|class="faq"|class="final-cta"|class="card-grid"|class="card"|#faq'`
Expected: no output (no matches). Note: this intentionally does not match the new `id="pricing"`/`class="pricing"`/`class="pricing-card"` strings.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: replace format/faq/final-cta sections with pricing block markup"
```

---

### Task 2: Update `css/styles.css` — remove unused rules, add `.pricing` rules

**Files:**
- Modify: `css/styles.css:167-196` (`.card-grid`, `.card`, `.card__num` — orphaned once Task 1 lands)
- Modify: `css/styles.css:510-513` (`.faq`, `.final-cta`)

- [ ] **Step 1: Remove the now-unused `.card-grid` / `.card` / `.card__num` rules**

Find this block in `css/styles.css` (lines 167-198, ending at the start of `.statement`):

```css
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

.statement {
```

Replace it with:

```css
.statement {
```

(This deletes the orphaned rules while leaving the single blank line above `.statement {` intact, matching existing file spacing.)

- [ ] **Step 2: Replace `.faq` / `.final-cta` rules with the new `.pricing` rules**

Find this block in `css/styles.css` (lines 510-513):

```css
.faq dt { font-family: var(--font-serif); color: var(--color-text); margin-top: var(--space-3); }
.faq dd { margin: 4px 0 0; }

.final-cta { text-align: center; padding: var(--space-6) 0; }
```

Replace it with:

```css
.pricing {
  --color-gold: #E31E24;
  padding: var(--space-6) 0;
}

.pricing-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}

@media (min-width: 768px) {
  .pricing-grid { grid-template-columns: repeat(2, 1fr); }
}

.pricing-card {
  background: #FFFFFF;
  color: #0A0A0C;
  border-radius: 8px;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
}

.pricing-card__title {
  font-family: var(--font-sans);
  font-weight: 800;
  font-size: 2rem;
  margin: 0 0 var(--space-3);
}

.pricing-card__subtitle {
  font-size: 0.95rem;
  margin: 0 0 var(--space-3);
}

.pricing-card__subtitle strong { font-weight: 700; }

.pricing-card__list {
  list-style: none;
  margin: 0 0 var(--space-4);
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
}

.pricing-card__list li {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
}

.pricing-card__badge {
  flex-shrink: 0;
  background: var(--color-gold);
  color: #fff;
  font-weight: 700;
  border-radius: 4px;
  min-width: 36px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
}

.pricing-card__cta {
  color: #fff;
  text-transform: uppercase;
  margin-top: auto;
}
```

- [ ] **Step 3: Confirm no leftover references to the removed classes remain in `css/styles.css`**

Run: `Select-String -Path css/styles.css -Pattern "\.faq|\.final-cta|\.card-grid|\.card__num|\.card "`
Expected: no output (no matches).

- [ ] **Step 4: Commit**

```bash
git add css/styles.css
git commit -m "style: add pricing block styles, remove format/faq/final-cta styles"
```

---

### Task 3: Run the existing test suite as a regression check

**Files:** none (no test code changes — this is a pure markup/CSS change, no JS touched)

- [ ] **Step 1: Run the test suite**

Run: `npm test`
Expected: all existing tests in `tests/apply.test.js` and `tests/main.test.js` pass (this change touches no JS, so this confirms nothing was accidentally broken).

---

### Task 4: Visual verification across breakpoints

**Files:** none (manual browser check only)

- [ ] **Step 1: Start a local static server**

Run: `npx serve .`
Expected: server starts and prints a local URL (e.g. `http://localhost:3000`).

- [ ] **Step 2: Open the page and locate the new section**

Open `http://localhost:3000` in a browser, scroll past the light "Один правильный разговор..." statement block. Confirm:
- The page background at this point is the standard dark site background (no light/full-bleed section, no blue/orange blur from the original reference screenshot).
- Heading "Форматы участия" appears above two white cards.
- Card 1 ("Standart"): black bold title, 5 list items each with a red number badge (10, 10, 10, 5, 80+), then one plain bullet without a badge (спортивные/развлекательные мероприятия...), then a full-width red button "УЗНАТЬ СТОИМОСТЬ" (white uppercase text) at the bottom.
- Card 2 ("VIP"): same structure plus the subtitle line "Закрытая ВИП мастермайнд группа резидентов клуба с доходом от 1 млн. рублей в месяц" under the title, and a 6th badge "3" (экскурсии в топовые компании) before the "5" mater-classes item.
- No "Формат клуба", "Вопросы и ответы", or "Готовы перестать быть один на один с бизнесом?" text appears anywhere on the page.
- Clicking either "Узнать стоимость" button opens the same apply modal as the other CTAs on the page.
- In the header nav (desktop width), "FAQ" is gone and "Тарифы" is present; clicking it scrolls to the new section.

- [ ] **Step 3: Resize to mobile width (375px) via DevTools device toolbar**

Confirm: the two cards stack vertically (single column), each card's button stays full-width and pinned below its list regardless of list length, no horizontal overflow or text clipping on the badges.

- [ ] **Step 4: Resize to tablet width (768px) and desktop (1024px+)**

Confirm: cards sit side-by-side in two equal-width columns, content stays within `var(--container-width)` (1120px) and centered like the rest of the page.

- [ ] **Step 5: Stop the server**

Press `Ctrl+C` in the terminal running `npx serve .`.

---

### Task 5: Final review commit

**Files:** none (no code changes expected; only run if Task 4 surfaced fixes)

- [ ] **Step 1: If Task 4 required any CSS/HTML tweaks, stage and commit them**

```bash
git add index.html css/styles.css
git commit -m "fix: adjust pricing block after visual verification"
```

If no fixes were needed, skip this task entirely — Tasks 1 and 2 already committed the final code.
