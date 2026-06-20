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
