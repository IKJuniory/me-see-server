const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ← добавь эту строку

// Подключаемся к Supabase
const supabase = createClient(
  'https://ikaaxwwtcdqlerxbtfjg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrYWF4d3d0Y2RxbGVyeGJ0ZmpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTcyODgsImV4cCI6MjA3NjQ5MzI4OH0.eGlWHyrQLwQyAzWqsG79qy3LYh2PJ3OlwjYKpydWhdA'
);

// === API ===

// 1. Отправить сообщение
app.post('/send', async (req, res) => {
  const { senderId, receiverId, encryptedText, encryptedAesKey = "", iv = "" } = req.body;
  
  if (!senderId || !receiverId || !encryptedText) {
    return res.status(400).json({ error: 'senderId, receiverId и encryptedText обязательны' });
  }

  try {
    const { data, error } = await supabase
  .from('messages')
  .insert([
    {
      sender_id: senderId,
      receiver_id: receiverId,
      encrypted_text: encryptedText,
      encrypted_aes_key: encryptedAesKey,
      iv: iv,
      timestamp: Date.now() // ← ДОБАВЛЕНО!
    }
  ]);

    if (error) throw error;

    console.log(`📨 Сообщение от ${senderId} для ${receiverId} сохранено в Supabase`);
    res.json({ success: true, messageId: data[0].id });
  } catch (e) {
    console.error('Ошибка сохранения:', e.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 2. Получить сообщения
app.get('/messages/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error('Ошибка загрузки:', e.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// === Запуск ===
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MeSSee-сервер запущен на порту ${PORT}`);
});