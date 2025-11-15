const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db');

function validTitle(title) {
  return !!title && title.trim().length >= 2 && title.trim().length <= 150;
}

// GET all commands for a workspace
router.get('/workspaces/:workspaceId/commands', async (req, res, next) => {
  try {
    const rows = await all(
      `SELECT c.*
       FROM commands c
       JOIN clients cl ON c.client_id = cl.id
       WHERE cl.workspace_id = ?`,
      [req.params.workspaceId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET all commands for a client
router.get('/clients/:clientId/commands', async (req, res, next) => {
  try {
    const rows = await all(
      'SELECT * FROM commands WHERE client_id = ? ORDER BY sort_order IS NULL, sort_order ASC',
      [req.params.clientId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET a command by id
router.get('/commands/:id', async (req, res, next) => {
  try {
    const row = await get('SELECT * FROM commands WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: true, message: 'Command not found' });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// CREATE a command
router.post('/clients/:clientId/commands', async (req, res, next) => {
  try {
    const { title, body, tags, sort_order, is_favorite } = req.body;

    if (!validTitle(title)) {
      return res.status(400).json({ error: true, message: 'Title must be 2–150 characters' });
    }

    let tagString = null;
    if (Array.isArray(tags)) tagString = tags.join(',');
    else if (typeof tags === 'string') tagString = tags;

    let sortOrderValue = null;
    if (sort_order !== null && sort_order !== undefined && sort_order !== '') {
      const parsed = parseInt(sort_order, 10);
      if (!Number.isNaN(parsed)) sortOrderValue = parsed;
    }

    const favorite = (is_favorite === true || is_favorite === 1 || is_favorite === '1') ? 1 : 0;

    const result = await run(
      'INSERT INTO commands (client_id, title, body, tags, sort_order, is_favorite) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.clientId, title.trim(), body || null, tagString, sortOrderValue, favorite]
    );

    const created = await get('SELECT * FROM commands WHERE id = ?', [result.id]);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// UPDATE a command
router.put('/commands/:id', async (req, res, next) => {
  try {
    const existing = await get('SELECT * FROM commands WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: true, message: 'Command not found' });
    }

    let title = req.body.title ?? existing.title;
    let body = req.body.body ?? existing.body;
    let tags = req.body.tags ?? existing.tags;
    let sort_order = req.body.sort_order ?? existing.sort_order;
    let is_favorite = req.body.is_favorite ?? existing.is_favorite;

    if (!validTitle(title)) {
      return res.status(400).json({ error: true, message: 'Title must be 2–150 characters' });
    }

    let tagString = null;
    if (Array.isArray(tags)) tagString = tags.join(',');
    else if (typeof tags === 'string') tagString = tags;

    let sortOrderValue = null;
    if (sort_order !== null && sort_order !== undefined && sort_order !== '') {
      const parsed = parseInt(sort_order, 10);
      if (!Number.isNaN(parsed)) sortOrderValue = parsed;
    }

    const favorite =
      (is_favorite === true || is_favorite === 1 || is_favorite === '1') ? 1 : 0;

    await run(
      'UPDATE commands SET title = ?, body = ?, tags = ?, sort_order = ?, is_favorite = ? WHERE id = ?',
      [title.trim(), body || null, tagString, sortOrderValue, favorite, req.params.id]
    );

    const updated = await get('SELECT * FROM commands WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE a command
router.delete('/commands/:id', async (req, res, next) => {
  try {
    const existing = await get('SELECT * FROM commands WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: true, message: 'Command not found' });
    }

    await run('DELETE FROM commands WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
