const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db');

const VALID_TYPES = ["chat", "note", "task"];
const VALID_STATUS = ["open", "closed", "archived"];

function validType(t) {
  return VALID_TYPES.includes(t);
}

function validStatus(s) {
  return VALID_STATUS.includes(s);
}

// GET all threads for a workspace
router.get('/workspaces/:workspaceId/threads', async (req, res, next) => {
  try {
    const rows = await all(
      'SELECT * FROM threads WHERE workspace_id = ?',
      [req.params.workspaceId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET all threads for a client
router.get('/clients/:clientId/threads', async (req, res, next) => {
  try {
    const rows = await all(
      'SELECT * FROM threads WHERE client_id = ?',
      [req.params.clientId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET a single thread
router.get('/threads/:id', async (req, res, next) => {
  try {
    const row = await get('SELECT * FROM threads WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: true, message: 'Thread not found' });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// CREATE thread
router.post('/clients/:clientId/threads', async (req, res, next) => {
  try {
    const { workspace_id, title, type, status } = req.body;

    if (!workspace_id) {
      return res.status(400).json({ error: true, message: 'workspace_id is required' });
    }

    if (!validType(type)) {
      return res.status(400).json({ error: true, message: 'Invalid type' });
    }

    if (!validStatus(status)) {
      return res.status(400).json({ error: true, message: 'Invalid status' });
    }

    const result = await run(
      'INSERT INTO threads (workspace_id, client_id, title, type, status) VALUES (?, ?, ?, ?, ?)',
      [workspace_id, req.params.clientId, title || null, type, status]
    );

    const created = await get('SELECT * FROM threads WHERE id = ?', [result.id]);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// UPDATE thread
router.put('/threads/:id', async (req, res, next) => {
  try {
    const existing = await get('SELECT * FROM threads WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: true, message: 'Thread not found' });
    }

    const title = req.body.title ?? existing.title;
    const type = req.body.type ?? existing.type;
    const status = req.body.status ?? existing.status;

    if (!validType(type)) {
      return res.status(400).json({ error: true, message: 'Invalid type' });
    }

    if (!validStatus(status)) {
      return res.status(400).json({ error: true, message: 'Invalid status' });
    }

    await run(
      'UPDATE threads SET title = ?, type = ?, status = ? WHERE id = ?',
      [title || null, type, status, req.params.id]
    );

    const updated = await get('SELECT * FROM threads WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE thread
router.delete('/threads/:id', async (req, res, next) => {
  try {
    const existing = await get('SELECT * FROM threads WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: true, message: 'Thread not found' });
    }

    await run('DELETE FROM threads WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
