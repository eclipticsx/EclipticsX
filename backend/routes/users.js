const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db');

function validEmail(email) {
  return !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

function validName(name) {
  return !!name && name.trim().length >= 2;
}

// GET all users
router.get('/', async (req, res, next) => {
  try {
    const users = await all('SELECT * FROM users');
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// GET user by ID
router.get('/:id', async (req, res, next) => {
  try {
    const user = await get('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ error: true, message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// CREATE user
router.post('/', async (req, res, next) => {
  try {
    const { email, name, avatar_url } = req.body;

    if (!validEmail(email)) return res.status(400).json({ error: true, message: 'Invalid email' });
    if (!validName(name)) return res.status(400).json({ error: true, message: 'Invalid name' });

    const normalized = email.trim().toLowerCase();

    const result = await run(
      'INSERT INTO users (email, name, avatar_url) VALUES (?, ?, ?)',
      [normalized, name.trim(), avatar_url || null]
    );

    const created = await get('SELECT * FROM users WHERE id = ?', [result.id]);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// UPDATE user
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await get('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: true, message: 'User not found' });

    const email = req.body.email ?? existing.email;
    const name = req.body.name ?? existing.name;
    const avatar = req.body.avatar_url ?? existing.avatar_url;

    if (!validEmail(email)) return res.status(400).json({ error: true, message: 'Invalid email' });
    if (!validName(name)) return res.status(400).json({ error: true, message: 'Invalid name' });

    const normalized = email.trim().toLowerCase();

    await run(
      'UPDATE users SET email = ?, name = ?, avatar_url = ? WHERE id = ?',
      [normalized, name.trim(), avatar || null, req.params.id]
    );

    const updated = await get('SELECT * FROM users WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE user
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await get('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: true, message: 'User not found' });

    await run('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
