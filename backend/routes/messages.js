const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db');

const VALID_SENDER_TYPES = ['user', 'ai', 'system'];

function validSenderType(t) {
  return VALID_SENDER_TYPES.includes(t);
}

// GET all messages in a thread
router.get('/threads/:threadId/messages', async (req, res, next) => {
  try {
    const thread = await get('SELECT * FROM threads WHERE id = ?', [req.params.threadId]);
    if (!thread) {
      return res.status(404).json({ error: true, message: 'Thread not found' });
    }

    const rows = await all(
      'SELECT * FROM messages WHERE thread_id = ? ORDER BY id ASC',
      [req.params.threadId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// CREATE message in a thread
router.post('/threads/:threadId/messages', async (req, res, next) => {
  try {
    const thread = await get('SELECT * FROM threads WHERE id = ?', [req.params.threadId]);
    if (!thread) {
      return res.status(404).json({ error: true, message: 'Thread not found' });
    }

    const { body, sender_type } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ error: true, message: 'Message body is required' });
    }

    const senderType = sender_type || 'user';
    if (!validSenderType(senderType)) {
      return res.status(400).json({
        error: true,
        message: `sender_type must be one of: ${VALID_SENDER_TYPES.join(', ')}`
      });
    }

    const result = await run(
      'INSERT INTO messages (thread_id, body, sender_type) VALUES (?, ?, ?)',
      [req.params.threadId, body.trim(), senderType]
    );

    const created = await get('SELECT * FROM messages WHERE id = ?', [result.id]);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
