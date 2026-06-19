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
