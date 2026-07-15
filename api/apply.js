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

async function sendMaxMessage(options) {
  const url = 'https://platform-api2.max.ru/messages';
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: options.token },
    body: JSON.stringify({ chat_id: options.chatId, text: options.text }),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error('MAX API error: ' + response.status + ' ' + errorBody);
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

  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;
  const maxToken = process.env.MAX_BOT_TOKEN;
  const maxChatId = process.env.MAX_CHAT_ID;
  const text = formatTelegramMessage(result);

  const deliveries = [];
  if (telegramToken && telegramChatId) {
    deliveries.push(sendTelegramMessage({ token: telegramToken, chatId: telegramChatId, text: text }));
  }
  if (maxToken && maxChatId) {
    deliveries.push(sendMaxMessage({ token: maxToken, chatId: maxChatId, text: text }));
  }

  if (deliveries.length === 0) {
    res.status(500).json({ ok: false, error: 'Server is not configured' });
    return;
  }

  const outcomes = await Promise.allSettled(deliveries);
  outcomes.forEach(function (outcome) {
    if (outcome.status === 'rejected') console.error(outcome.reason);
  });

  const delivered = outcomes.some(function (outcome) { return outcome.status === 'fulfilled'; });
  if (!delivered) {
    res.status(502).json({ ok: false, error: 'Failed to deliver application' });
    return;
  }

  res.status(200).json({ ok: true });
}

module.exports = handler;
module.exports.validateApplication = validateApplication;
module.exports.formatTelegramMessage = formatTelegramMessage;
