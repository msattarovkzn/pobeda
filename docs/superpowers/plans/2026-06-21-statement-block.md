# Statement Block (replace Manifesto) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the dark `#manifesto` section entirely and replace it with a new light-background `#statement` section (same position, between `#includes` and `#format`) matching the user-provided reference screenshot — bold black headline with a red filled highlight, a red colored-text highlight, and a hand-drawn-style inline-SVG circle around one word, plus a left-side vertical red bar.

**Architecture:** Pure static HTML/CSS change in the existing one-pager (`index.html` + `css/styles.css`). No JS, no new asset files — the "hand-drawn circle" is an inline `<svg>` with a wobbly `<path>`, styled and positioned via CSS, following the same literal-color/no-asset convention already used for the `.growth` block's dot-grid decoration.

**Tech Stack:** Vanilla HTML5 / CSS3 (mobile-first, existing CSS custom properties for spacing). No build step — verify by opening the file with `npx serve .`.

---

### Task 1: Remove the old `#manifesto` section and add the new `#statement` section in `index.html`

**Files:**
- Modify: `index.html:122-131`

- [ ] **Step 1: Replace the manifesto markup with the statement markup**

Find this block in `index.html` (lines 122-131):

```html
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
```

Replace it with:

```html
    <section id="statement" class="statement">
      <div class="container statement__inner">
        <span class="statement__bar" aria-hidden="true"></span>
        <p class="statement__text">
          Один <span class="statement__highlight statement__highlight--fill">правильный</span><br>
          <span class="statement__highlight statement__highlight--text">разговор</span> может стоить<br>
          <span class="statement__highlight statement__highlight--circle">больше<svg class="statement__circle" viewBox="0 0 200 90" aria-hidden="true"><path d="M14,46 C10,24 34,9 76,7 C124,5 178,9 188,30 C198,52 172,73 110,78 C58,82 14,74 12,54" fill="none" stroke="#E31E24" stroke-width="6" stroke-linecap="round"/></svg></span> года попыток<br>
          в одиночку.
        </p>
      </div>
    </section>
```

- [ ] **Step 2: Confirm no other reference to `#manifesto`/`.manifesto` remains in `index.html`**

Run: `Select-String -Path index.html -Pattern "manifesto"`
Expected: no output (no matches).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: replace manifesto section with statement block markup"
```

---

### Task 2: Remove the old `.manifesto` CSS and add the new `.statement` CSS in `css/styles.css`

**Files:**
- Modify: `css/styles.css:198-205`

- [ ] **Step 1: Replace the manifesto CSS rules with the statement CSS rules**

Find this block in `css/styles.css` (lines 198-205):

```css
.manifesto {
  padding: var(--space-6) 0;
  text-align: center;
  background: var(--color-bg-alt);
}

.manifesto p:first-child { font-family: var(--font-serif); font-size: 1.5rem; color: var(--color-text); }
.manifesto__quote { color: var(--color-gold); font-size: 1.25rem; margin-top: var(--space-4); }
```

Replace it with:

```css
.statement {
  background: #F7F7F8;
  color: #0A0A0C;
  padding: var(--space-6) 0;
}

.statement__inner {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

.statement__bar {
  flex-shrink: 0;
  width: 4px;
  align-self: stretch;
  background: #E31E24;
}

.statement__text {
  font-family: var(--font-sans);
  font-weight: 800;
  line-height: 1.35;
  letter-spacing: -0.01em;
  margin: 0;
  color: #0A0A0C;
  font-size: 1.75rem;
}

.statement__highlight { font-weight: 800; }
.statement__highlight--fill { background: #E31E24; color: #fff; padding: 4px 14px; border-radius: 2px; }
.statement__highlight--text { color: #E31E24; }

.statement__highlight--circle {
  position: relative;
  display: inline-block;
  padding: 0 6px;
}

.statement__circle {
  position: absolute;
  top: -28%;
  left: -10%;
  width: 120%;
  height: 156%;
  pointer-events: none;
}

@media (min-width: 768px) {
  .statement__text { font-size: 2.5rem; }
}

@media (min-width: 1024px) {
  .statement__text { font-size: 3rem; }
}
```

- [ ] **Step 2: Confirm no other reference to `.manifesto` remains in `css/styles.css`**

Run: `Select-String -Path css/styles.css -Pattern "manifesto"`
Expected: no output (no matches).

- [ ] **Step 3: Commit**

```bash
git add css/styles.css
git commit -m "style: add statement block styles, remove manifesto styles"
```

---

### Task 3: Visual verification across breakpoints

**Files:** none (manual browser check only)

- [ ] **Step 1: Start a local static server**

Run: `npx serve .`
Expected: server starts and prints a local URL (e.g. `http://localhost:3000`).

- [ ] **Step 2: Open the page and locate the new section**

Open `http://localhost:3000` in a browser, scroll to the section between the photo carousel ("Что тебя ждёт в клубе") and "Формат клуба". Confirm:
- Background is light (`#F7F7F8`), text is bold black — a visible break from the dark sections above/below it.
- "правильный" sits on a solid red box with white text.
- "разговор" is plain red-colored text (no box).
- "больше" has a red hand-drawn-style oval traced around it, text itself stays black.
- A thin red vertical bar runs along the left edge of the paragraph, full height.
- No leftover dark "Победа — это не победа над конкурентами" text appears anywhere on the page.

- [ ] **Step 3: Resize to mobile width (375px) via DevTools device toolbar**

Confirm: text wraps to 4 lines per the `<br>` tags, stays left-aligned, vertical bar and SVG circle still render without clipping or overlapping neighboring text, font size reads at `1.75rem` (smallest tier).

- [ ] **Step 4: Resize to tablet width (768px)**

Confirm: font size steps up to `2.5rem`, layout still holds (bar + text in a row, no overlap).

- [ ] **Step 5: Resize to desktop width (1024px+)**

Confirm: font size steps up to `3rem`, section content stays within `var(--container-width)` (1120px) and centered like the rest of the page.

- [ ] **Step 6: Stop the server**

Press `Ctrl+C` in the terminal running `npx serve .`.

---

### Task 4: Final review commit

**Files:** none (no code changes expected; only run if Task 3 surfaced fixes)

- [ ] **Step 1: If Task 3 required any CSS/HTML tweaks, stage and commit them**

```bash
git add index.html css/styles.css
git commit -m "fix: adjust statement block after visual verification"
```

If no fixes were needed, skip this task entirely — Tasks 1 and 2 already committed the final code.
