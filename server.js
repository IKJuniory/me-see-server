const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

// В памяти (в реальном проекте — в БД!)
const users = new Map(); // userId → { publicKeyPem }
const messages = new Map(); // receiverId → [messages]

// === API ===

// 1. Регистрация / обновление публичного ключа
app.post('/register', (req, res) => {
    const { userId, publicKeyPem } = req.body;
    if (!userId || !publicKeyPem) {
        return res.status(400).json({ error: 'userId и publicKeyPem обязательны' });
    }
    users.set(userId, { publicKeyPem });
    console.log(`🔑 Зарегистрирован пользователь: ${userId}`);
    res.json({ success: true });
});

// 2. Получить публичный ключ пользователя
app.get('/public-key/:userId', (req, res) => {
    const { userId } = req.params;
    const user = users.get(userId);
    if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json({ publicKeyPem: user.publicKeyPem });
});

// 3. Отправить сообщение
app.post('/send', (req, res) => {
    const { senderId, receiverId, encryptedText, encryptedAesKey, iv } = req.body;
    
    if (!senderId || !receiverId || !encryptedText || !encryptedAesKey || !iv) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }

    const message = {
        id: uuidv4(),
        senderId,
        receiverId,
        encryptedText,
        encryptedAesKey,
        iv,
        timestamp: Date.now()
    };

    // Сохраняем в "почтовый ящик" получателя
    if (!messages.has(receiverId)) {
        messages.set(receiverId, []);
    }
    messages.get(receiverId).push(message);

    console.log(`📨 Сообщение от ${senderId} для ${receiverId} сохранено`);
    res.json({ success: true, messageId: message.id });
});

// 4. Получить все непрочитанные сообщения
app.get('/messages/:userId', (req, res) => {
    const { userId } = req.params;
    const userMessages = messages.get(userId) || [];
    res.json(userMessages);
});

// === Запуск ===
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Сервер MeSSee запущен на порту ${PORT}`);
});