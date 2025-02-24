// templates/chat-template.js
const chatRouter = express.Router();

// Get chat messages
chatRouter.get('/:chatId', (req, res) => {
    const chatId = req.params.chatId;
    db.query('SELECT * FROM Messages WHERE chatId = ?', [chatId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ messages: results });
    });
});

// Send a new message
chatRouter.post('/:chatId', (req, res) => {
    const { senderId, content } = req.body;
    const chatId = req.params.chatId;
    db.query('INSERT INTO Messages (chatId, senderId, content) VALUES (?, ?, ?)', [chatId, senderId, content], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Message sent' });
    });
});

module.exports = chatRouter;