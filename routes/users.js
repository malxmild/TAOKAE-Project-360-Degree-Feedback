const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// ✅ Route: GET /api/users?department=...
router.get('/', async (req, res) => {
  const { department } = req.query;

  if (!department) {
    return res.status(400).json({ message: 'Missing department' });
  }

  try {
    const result = await pool.query(
      'SELECT userid, name, position, department FROM users WHERE department ILIKE $1',

      [department]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users by department:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ✅ Route: GET /api/users/:userid
router.get('/:userid', async (req, res) => {
  const { userid } = req.params;
  try {
    const result = await pool.query(
      'SELECT userid, name, position, department FROM users WHERE userid = $1',
      [userid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user by ID:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

