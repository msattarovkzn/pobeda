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
