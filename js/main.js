(function () {
  'use strict';

  var YANDEX_METRIKA_ID = 0; // TODO: заменить на реальный ID счётчика после создания

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

  function getCarouselArrowState(state) {
    var tolerance = 4;
    return {
      showPrev: state.scrollLeft > tolerance,
      showNext: state.scrollLeft + state.clientWidth < state.scrollWidth - tolerance,
    };
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initApp);
  }

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
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      validateApplyForm: validateApplyForm,
      shouldShowStickyCta: shouldShowStickyCta,
      getCarouselArrowState: getCarouselArrowState,
    };
  }
})();
