// src/lib/notifications.ts

export async function sendTelegramAlert(message: string, buttons?: any, threadId?: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("TELEGRAM_ALERT_SKIPPED: Missing Token or Chat ID");
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const body: any = {
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML',
  };

  // [NEW] Routes message to a specific Telegram Topic
  if (threadId) {
    body.message_thread_id = threadId;
  }

  // If buttons are provided, we attach them as an Inline Keyboard
  if (buttons) {
    body.reply_markup = {
      inline_keyboard: buttons
    };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      console.error("TELEGRAM_API_ERROR:", errorData);
    }
  } catch (err) {
    console.error("TELEGRAM_FETCH_CRASH:", err);
  }
}

export async function editTelegramMessage(messageId: number, text: string, buttons?: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return;

  const url = `https://api.telegram.org/bot${token}/editMessageText`;

  const body: any = {
    chat_id: chatId,
    message_id: messageId,
    text: text,
    parse_mode: 'HTML',
  };

  if (buttons) {
    body.reply_markup = { inline_keyboard: buttons };
  }

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (err) {
    console.error("TG_EDIT_ERROR:", err);
  }
}

export async function sendTelegramPhoto(file: File, caption: string, buttons?: any, threadId?: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return;

  const url = `https://api.telegram.org/bot${token}/sendPhoto`;
  
  // We use FormData so Telegram knows we are sending an actual file, not just text
  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('caption', caption);
  formData.append('parse_mode', 'HTML');
  formData.append('photo', file);

  // [NEW] Routes photo to a specific Telegram Topic
  if (threadId) {
    formData.append('message_thread_id', threadId);
  }

  if (buttons) {
    formData.append('reply_markup', JSON.stringify({ inline_keyboard: buttons }));
  }

  try {
    await fetch(url, {
      method: 'POST',
      body: formData // No headers needed, fetch automatically sets the multipart boundary
    });
  } catch (err) {
    console.error("TG_PHOTO_ERROR:", err);
  }
}