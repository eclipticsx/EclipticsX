const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db');

function validName(name) {
  return !!name && name.trim().length >= 2 && name.trim().length <= 150;
}

const VALID_STATUS = ["active", "paused", "archived"];

function validStatus(status) {
  return VALID_STATUS.includes(status);
}

// GET all clients for a workspace
router.get('/workspaces/:workspaceId/clients', async (req, res, next) => {
  try {
    const rows = await all(
      'SELECT * FROM clients WHERE workspace_id = ?',
      [req.params.workspaceId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET a client by id
router.get('/clients/:id', async (req, res, next) => {
  try {
    const row = await get('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: true, message: 'Client not found' });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// CREATE a client
router.post('/workspaces/:workspaceId/clients', async (req, res, next) => {
  try {
    const { name, description, status } = req.body;

    if (!validName(name)) {
      return res.status(400).json({ error: true, message: 'Name must be 2–150 characters' });
    }

    if (!validStatus(status)) {
      return res.status(400).json({
        error: true,
        message: `Status must be one of: ${VALID_STATUS.join(', ')}`
      });
    }

    const result = await run(
      'INSERT INTO clients (workspace_id, name, description, status) VALUES (?, ?, ?, ?)',
      [req.params.workspaceId, name.trim(), description || null, status]
    );

    const created = await get('SELECT * FROM clients WHERE id = ?', [result.id]);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// UPDATE a client
router.put('/clients/:id', async (req, res, next) => {
  try {
    const existing = await get('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: true, message: 'Client not found' });
    }

    const name = req.body.name ?? existing.name;
    const description = req.body.description ?? existing.description;
    const status = req.body.status ?? existing.status;

    if (!validName(name)) {
      return res.status(400).json({ error: true, message: 'Name must be 2–150 characters' });
    }

    if (!validStatus(status)) {
      return res.status(400).json({
        error: true,
        message: `Status must be one of: ${VALID_STATUS.join(', ')}`
      });
    }

    await run(
      'UPDATE clients SET name = ?, description = ?, status = ? WHERE id = ?',
      [name.trim(), description || null, status, req.params.id]
    );

    const updated = await get('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE a client
router.delete('/clients/:id', async (req, res, next) => {
  try {
    const existing = await get('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: true, message: 'Client not found' });
    }

    await run('DELETE FROM clients WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
