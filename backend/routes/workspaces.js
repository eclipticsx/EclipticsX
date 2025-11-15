const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db');

function validName(name) {
  return !!name && name.trim().length >= 2 && name.trim().length <= 100;
}

function makeSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

async function slugUnique(slug, excludeId = null) {
  let sql = 'SELECT id FROM workspaces WHERE slug = ?';
  const params = [slug];
  if (excludeId) {
    sql += ' AND id != ?';
    params.push(excludeId);
  }
  const row = await get(sql, params);
  return !row;
}

// GET all workspaces
router.get('/', async (req, res, next) => {
  try {
    const rows = await all('SELECT * FROM workspaces');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET workspace by id
router.get('/:id', async (req, res, next) => {
  try {
    const row = await get('SELECT * FROM workspaces WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: true, message: 'Workspace not found' });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// CREATE workspace
router.post('/', async (req, res, next) => {
  try {
    let { name, slug, owner_user_id } = req.body;

    if (!validName(name)) {
      return res.status(400).json({ error: true, message: 'Name must be 2–100 characters' });
    }
    if (!owner_user_id) {
      return res.status(400).json({ error: true, message: 'owner_user_id is required' });
    }

    if (!slug) slug = makeSlug(name);
    else slug = makeSlug(slug);

    if (!slug) {
      return res.status(400).json({ error: true, message: 'Slug cannot be empty' });
    }

    if (!(await slugUnique(slug))) {
      return res.status(400).json({ error: true, message: 'Slug must be unique' });
    }

    const result = await run(
      'INSERT INTO workspaces (name, slug, owner_user_id) VALUES (?, ?, ?)',
      [name.trim(), slug, owner_user_id]
    );

    const created = await get('SELECT * FROM workspaces WHERE id = ?', [result.id]);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// UPDATE workspace
router.put('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const existing = await get('SELECT * FROM workspaces WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: true, message: 'Workspace not found' });
    }

    let name = req.body.name ?? existing.name;
    let slug = req.body.slug ?? existing.slug;
    let owner_user_id = req.body.owner_user_id ?? existing.owner_user_id;

    if (!validName(name)) {
      return res.status(400).json({ error: true, message: 'Name must be 2–100 characters' });
    }
    if (!owner_user_id) {
      return res.status(400).json({ error: true, message: 'owner_user_id is required' });
    }

    if (!slug) slug = makeSlug(name);
    else slug = makeSlug(slug);

    if (!slug) {
      return res.status(400).json({ error: true, message: 'Slug cannot be empty' });
    }

    if (!(await slugUnique(slug, id))) {
      return res.status(400).json({ error: true, message: 'Slug must be unique' });
    }

    await run(
      'UPDATE workspaces SET name = ?, slug = ?, owner_user_id = ? WHERE id = ?',
      [name.trim(), slug, owner_user_id, id]
    );

    const updated = await get('SELECT * FROM workspaces WHERE id = ?', [id]);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE workspace
router.delete('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const existing = await get('SELECT * FROM workspaces WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: true, message: 'Workspace not found' });
    }
    await run('DELETE FROM workspaces WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
