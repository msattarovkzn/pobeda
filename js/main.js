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
